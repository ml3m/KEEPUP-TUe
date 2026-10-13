// ============================================================
// Plan Routes: Study plan management
// ============================================================

import { Router } from 'express';
import { getDb } from '../db/index.js';
import type { PlanEntryWithCourse, PlanCategory, CourseStatus } from '../types.js';

const router = Router();

const VALID_CATEGORIES: PlanCategory[] = [
  'foundational',
  'specialization',
  'cse_elective',
  'free_elective',
  'seminar',
  'graduation',
];

const VALID_STATUSES: CourseStatus[] = ['planned', 'in_progress', 'passed', 'failed'];

function formatPlanEntry(row: any): PlanEntryWithCourse {
  return {
    id: row.id,
    course_id: row.course_id,
    category: row.category,
    year: row.year,
    quarter: row.quarter,
    status: row.status,
    grade: row.grade,
    sort_order: row.sort_order,
    created_at: row.created_at,
    updated_at: row.updated_at,
    course: {
      id: row.c_id ?? row.course_id,
      code: row.c_code,
      name: row.c_name,
      credits: row.c_credits,
      focus_area: row.c_focus_area,
      course_type: row.c_course_type,
      quarter: row.c_quarter,
      is_custom: Boolean(row.c_is_custom),
    },
  };
}

const JOINED_QUERY = `
  SELECT 
    p.id,
    p.course_id,
    p.category,
    p.year,
    p.quarter,
    p.status,
    p.grade,
    p.sort_order,
    p.created_at,
    p.updated_at,
    c.id AS c_id,
    c.code AS c_code,
    c.name AS c_name,
    c.credits AS c_credits,
    c.focus_area AS c_focus_area,
    c.course_type AS c_course_type,
    c.quarter AS c_quarter,
    c.is_custom AS c_is_custom
  FROM plan_entries p
  JOIN courses c ON p.course_id = c.id
`;

// ------------------------------------------------------------
// GET /api/plan
// Get all plan entries with joined course data, ordered by year, quarter, sort_order
// ------------------------------------------------------------
router.get('/', (_req, res) => {
  try {
    const db = getDb();
    const rows = db.prepare(`
      ${JOINED_QUERY}
      ORDER BY 
        CASE WHEN p.year IS NULL THEN 1 ELSE 0 END,
        p.year ASC,
        CASE WHEN p.quarter IS NULL THEN 1 ELSE 0 END,
        p.quarter ASC,
        p.sort_order ASC,
        p.id ASC
    `).all() as any[];

    res.json(rows.map(formatPlanEntry));
  } catch (error: any) {
    console.error('Error fetching study plan:', error);
    res.status(500).json({ error: 'Failed to fetch plan', details: error.message });
  }
});

// ------------------------------------------------------------
// POST /api/plan
// Add course to plan: body { course_id, category, year?, quarter?, status?, grade?, sort_order? }
// ------------------------------------------------------------
router.post('/', (req, res) => {
  try {
    const db = getDb();
    const { course_id, category, year, quarter, status, grade, sort_order } = req.body;

    if (!course_id || isNaN(Number(course_id))) {
      return res.status(400).json({ error: 'Valid course_id is required' });
    }

    if (!category || !VALID_CATEGORIES.includes(category)) {
      return res.status(400).json({
        error: `Valid category is required. Allowed: ${VALID_CATEGORIES.join(', ')}`,
      });
    }

    // Verify course exists
    const course = db.prepare('SELECT id FROM courses WHERE id = ?').get(course_id);
    if (!course) {
      return res.status(404).json({ error: 'Course not found' });
    }

    // Verify uniqueness
    const existing = db.prepare('SELECT id FROM plan_entries WHERE course_id = ?').get(course_id);
    if (existing) {
      return res.status(400).json({ error: 'Course is already in the study plan' });
    }

    // Validate optional year & quarter
    const yearVal = year !== undefined && year !== null ? Number(year) : null;
    if (yearVal !== null && (isNaN(yearVal) || (yearVal !== 1 && yearVal !== 2))) {
      return res.status(400).json({ error: 'Year must be 1, 2, or null' });
    }

    const quarterVal = quarter !== undefined && quarter !== null ? Number(quarter) : null;
    if (quarterVal !== null && (isNaN(quarterVal) || quarterVal < 1 || quarterVal > 4)) {
      return res.status(400).json({ error: 'Quarter must be 1, 2, 3, 4, or null' });
    }

    const statusVal = status && VALID_STATUSES.includes(status) ? status : 'planned';

    let gradeVal: number | null = null;
    if (grade !== undefined && grade !== null && grade !== '') {
      gradeVal = Number(grade);
      if (isNaN(gradeVal) || gradeVal < 0 || gradeVal > 10) {
        return res.status(400).json({ error: 'Grade must be a number between 0 and 10, or null' });
      }
    }

    let sortOrderVal = 0;
    if (sort_order !== undefined && !isNaN(Number(sort_order))) {
      sortOrderVal = Number(sort_order);
    } else {
      const maxOrder = db.prepare(`
        SELECT COALESCE(MAX(sort_order), -1) + 1 AS next_order
        FROM plan_entries
        WHERE (year = ? OR (year IS NULL AND ? IS NULL))
          AND (quarter = ? OR (quarter IS NULL AND ? IS NULL))
      `).get(yearVal, yearVal, quarterVal, quarterVal) as { next_order: number };
      sortOrderVal = maxOrder?.next_order ?? 0;
    }

    const result = db.prepare(`
      INSERT INTO plan_entries (course_id, category, year, quarter, status, grade, sort_order)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(course_id, category, yearVal, quarterVal, statusVal, gradeVal, sortOrderVal);

    const inserted = db.prepare(`${JOINED_QUERY} WHERE p.id = ?`).get(result.lastInsertRowid) as any;
    res.status(201).json(formatPlanEntry(inserted));
  } catch (error: any) {
    console.error('Error adding course to plan:', error);
    res.status(500).json({ error: 'Failed to add course to plan', details: error.message });
  }
});

// ------------------------------------------------------------
// PUT /api/plan/reorder
// Batch update sort_order: body { entries: [{ id, sort_order, year?, quarter? }] }
// NOTE: Must be registered BEFORE /api/plan/:id
// ------------------------------------------------------------
router.put('/reorder', (req, res) => {
  try {
    const db = getDb();
    const { entries } = req.body;

    if (!Array.isArray(entries)) {
      return res.status(400).json({ error: 'Body must contain an array of entries' });
    }

    const updateWithPosition = db.prepare(`
      UPDATE plan_entries
      SET sort_order = ?, year = ?, quarter = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `);

    const updateSortOnly = db.prepare(`
      UPDATE plan_entries
      SET sort_order = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `);

    const transaction = db.transaction((items: any[]) => {
      for (const item of items) {
        if (!item.id || item.sort_order === undefined) continue;

        if ('year' in item && 'quarter' in item) {
          const yearVal = item.year !== null && item.year !== undefined ? Number(item.year) : null;
          const quarterVal = item.quarter !== null && item.quarter !== undefined ? Number(item.quarter) : null;
          updateWithPosition.run(Number(item.sort_order), yearVal, quarterVal, item.id);
        } else {
          updateSortOnly.run(Number(item.sort_order), item.id);
        }
      }
    });

    transaction(entries);
    res.json({ success: true, message: 'Plan entries reordered successfully' });
  } catch (error: any) {
    console.error('Error reordering plan entries:', error);
    res.status(500).json({ error: 'Failed to reorder entries', details: error.message });
  }
});

// ------------------------------------------------------------
// PUT /api/plan/:id
// Update plan entry: body can include { category?, year?, quarter?, status?, grade?, sort_order? }
// ------------------------------------------------------------
router.put('/:id', (req, res) => {
  try {
    const db = getDb();
    const id = Number(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ error: 'Invalid plan entry ID' });
    }

    const existing = db.prepare('SELECT * FROM plan_entries WHERE id = ?').get(id) as any;
    if (!existing) {
      return res.status(404).json({ error: 'Plan entry not found' });
    }

    const { category, year, quarter, status, grade, sort_order } = req.body;

    let newCategory = existing.category;
    if (category !== undefined) {
      if (!VALID_CATEGORIES.includes(category)) {
        return res.status(400).json({
          error: `Invalid category. Allowed: ${VALID_CATEGORIES.join(', ')}`,
        });
      }
      newCategory = category;
    }

    let newYear = existing.year;
    if (year !== undefined) {
      if (year === null || year === '') {
        newYear = null;
      } else {
        const yNum = Number(year);
        if (isNaN(yNum) || (yNum !== 1 && yNum !== 2)) {
          return res.status(400).json({ error: 'Year must be 1, 2, or null' });
        }
        newYear = yNum;
      }
    }

    let newQuarter = existing.quarter;
    if (quarter !== undefined) {
      if (quarter === null || quarter === '') {
        newQuarter = null;
      } else {
        const qNum = Number(quarter);
        if (isNaN(qNum) || qNum < 1 || qNum > 4) {
          return res.status(400).json({ error: 'Quarter must be 1, 2, 3, 4, or null' });
        }
        newQuarter = qNum;
      }
    }

    let newStatus = existing.status;
    if (status !== undefined) {
      if (!VALID_STATUSES.includes(status)) {
        return res.status(400).json({
          error: `Invalid status. Allowed: ${VALID_STATUSES.join(', ')}`,
        });
      }
      newStatus = status;
    }

    let newGrade = existing.grade;
    if (grade !== undefined) {
      if (grade === null || grade === '') {
        newGrade = null;
      } else {
        const gNum = Number(grade);
        if (isNaN(gNum) || gNum < 0 || gNum > 10) {
          return res.status(400).json({ error: 'Grade must be a number between 0 and 10, or null' });
        }
        newGrade = gNum;
      }
    }

    let newSortOrder = existing.sort_order;
    if (sort_order !== undefined) {
      const sNum = Number(sort_order);
      if (!isNaN(sNum)) {
        newSortOrder = sNum;
      }
    }

    db.prepare(`
      UPDATE plan_entries
      SET category = ?, year = ?, quarter = ?, status = ?, grade = ?, sort_order = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(newCategory, newYear, newQuarter, newStatus, newGrade, newSortOrder, id);

    const updated = db.prepare(`${JOINED_QUERY} WHERE p.id = ?`).get(id) as any;
    res.json(formatPlanEntry(updated));
  } catch (error: any) {
    console.error('Error updating plan entry:', error);
    res.status(500).json({ error: 'Failed to update plan entry', details: error.message });
  }
});

// ------------------------------------------------------------
// DELETE /api/plan/:id
// Remove course from plan
// ------------------------------------------------------------
router.delete('/:id', (req, res) => {
  try {
    const db = getDb();
    const id = Number(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ error: 'Invalid plan entry ID' });
    }

    const existing = db.prepare('SELECT id FROM plan_entries WHERE id = ?').get(id);
    if (!existing) {
      return res.status(404).json({ error: 'Plan entry not found' });
    }

    db.prepare('DELETE FROM plan_entries WHERE id = ?').run(id);
    res.json({ success: true, message: 'Plan entry removed successfully' });
  } catch (error: any) {
    console.error('Error deleting plan entry:', error);
    res.status(500).json({ error: 'Failed to delete plan entry', details: error.message });
  }
});

export default router;
