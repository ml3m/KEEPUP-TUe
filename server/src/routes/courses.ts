// ============================================================
// Course Routes: CRUD operations for TU/e courses and custom courses
// ============================================================

import { Router } from 'express';
import { getDb } from '../db/index.js';
import type { Course, FocusArea, CourseType } from '../types.js';

const router = Router();

function formatCourse(row: any): Course {
  return {
    id: row.id,
    code: row.code,
    name: row.name,
    credits: row.credits,
    focus_area: row.focus_area,
    course_type: row.course_type,
    quarter: row.quarter,
    is_custom: Boolean(row.is_custom),
  };
}

// ------------------------------------------------------------
// GET /api/courses
// List all courses with optional filters: focus_area, course_type, quarter
// ------------------------------------------------------------
router.get('/', (req, res) => {
  try {
    const db = getDb();
    const { focus_area, course_type, quarter } = req.query;

    const conditions: string[] = [];
    const params: any[] = [];

    if (focus_area) {
      conditions.push('focus_area = ?');
      params.push(focus_area);
    }

    if (course_type) {
      conditions.push('course_type = ?');
      params.push(course_type);
    }

    if (quarter) {
      conditions.push('(quarter = ? OR quarter LIKE ?)');
      params.push(String(quarter), `%${quarter}%`);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
    const query = `SELECT * FROM courses ${whereClause} ORDER BY code ASC`;
    const rows = db.prepare(query).all(...params) as any[];

    const courses = rows.map(formatCourse);
    res.json(courses);
  } catch (error: any) {
    console.error('Error fetching courses:', error);
    res.status(500).json({ error: 'Failed to fetch courses', details: error.message });
  }
});

// ------------------------------------------------------------
// GET /api/courses/:id
// Get a single course by ID
// ------------------------------------------------------------
router.get('/:id', (req, res) => {
  try {
    const db = getDb();
    const id = Number(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ error: 'Invalid course ID' });
    }

    const course = db.prepare('SELECT * FROM courses WHERE id = ?').get(id) as any;
    if (!course) {
      return res.status(404).json({ error: 'Course not found' });
    }

    res.json(formatCourse(course));
  } catch (error: any) {
    console.error('Error fetching course:', error);
    res.status(500).json({ error: 'Failed to fetch course', details: error.message });
  }
});

// ------------------------------------------------------------
// POST /api/courses
// Create custom course (sets is_custom=1)
// Body: { code, name, credits, focus_area?, course_type?, quarter? }
// ------------------------------------------------------------
router.post('/', (req, res) => {
  try {
    const db = getDb();
    const { code, name, credits, focus_area, course_type, quarter } = req.body;

    if (!code || typeof code !== 'string' || !code.trim()) {
      return res.status(400).json({ error: 'Course code is required' });
    }
    if (!name || typeof name !== 'string' || !name.trim()) {
      return res.status(400).json({ error: 'Course name is required' });
    }
    const creditsNum = credits !== undefined ? Number(credits) : 5;
    if (isNaN(creditsNum) || creditsNum < 0) {
      return res.status(400).json({ error: 'Credits must be a non-negative number' });
    }

    const trimmedCode = code.trim().toUpperCase();
    const existing = db.prepare('SELECT id FROM courses WHERE UPPER(code) = ?').get(trimmedCode) as any;
    if (existing) {
      return res.status(400).json({ error: `Course with code ${trimmedCode} already exists` });
    }

    const validFocusAreas: FocusArea[] = ['algo_theory', 'arch_systems', 'soft_analytics'];
    const validCourseTypes: CourseType[] = ['foundational', 'deepening', 'cse_elective', 'seminar', 'graduation'];

    const focusAreaVal = validFocusAreas.includes(focus_area) ? focus_area : null;
    const courseTypeVal = validCourseTypes.includes(course_type) ? course_type : null;
    const quarterVal = quarter !== undefined ? String(quarter).trim() : '1';

    const insertStmt = db.prepare(`
      INSERT INTO courses (code, name, credits, focus_area, course_type, quarter, is_custom)
      VALUES (?, ?, ?, ?, ?, ?, 1)
    `);

    const result = insertStmt.run(
      trimmedCode,
      name.trim(),
      creditsNum,
      focusAreaVal,
      courseTypeVal,
      quarterVal,
    );

    const createdCourse = db.prepare('SELECT * FROM courses WHERE id = ?').get(result.lastInsertRowid) as any;
    res.status(201).json(formatCourse(createdCourse));
  } catch (error: any) {
    console.error('Error creating custom course:', error);
    res.status(500).json({ error: 'Failed to create course', details: error.message });
  }
});

// ------------------------------------------------------------
// PUT /api/courses/:id
// Update custom course (only if is_custom=1)
// ------------------------------------------------------------
router.put('/:id', (req, res) => {
  try {
    const db = getDb();
    const id = Number(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ error: 'Invalid course ID' });
    }

    const course = db.prepare('SELECT * FROM courses WHERE id = ?').get(id) as any;
    if (!course) {
      return res.status(404).json({ error: 'Course not found' });
    }

    if (!course.is_custom) {
      return res.status(400).json({ error: 'Cannot modify standard curriculum courses; only custom courses can be edited' });
    }

    const { code, name, credits, focus_area, course_type, quarter } = req.body;

    const newCode = code !== undefined ? String(code).trim().toUpperCase() : course.code;
    const newName = name !== undefined ? String(name).trim() : course.name;
    const newCredits = credits !== undefined ? Number(credits) : course.credits;

    if (isNaN(newCredits) || newCredits < 0) {
      return res.status(400).json({ error: 'Credits must be a non-negative number' });
    }

    if (newCode !== course.code) {
      const existing = db.prepare('SELECT id FROM courses WHERE UPPER(code) = ? AND id != ?').get(newCode, id) as any;
      if (existing) {
        return res.status(400).json({ error: `Course with code ${newCode} already exists` });
      }
    }

    const validFocusAreas: FocusArea[] = ['algo_theory', 'arch_systems', 'soft_analytics'];
    const validCourseTypes: CourseType[] = ['foundational', 'deepening', 'cse_elective', 'seminar', 'graduation'];

    const newFocusArea = focus_area !== undefined
      ? (validFocusAreas.includes(focus_area) ? focus_area : null)
      : course.focus_area;

    const newCourseType = course_type !== undefined
      ? (validCourseTypes.includes(course_type) ? course_type : null)
      : course.course_type;

    const newQuarter = quarter !== undefined ? String(quarter).trim() : course.quarter;

    db.prepare(`
      UPDATE courses
      SET code = ?, name = ?, credits = ?, focus_area = ?, course_type = ?, quarter = ?
      WHERE id = ?
    `).run(newCode, newName, newCredits, newFocusArea, newCourseType, newQuarter, id);

    const updatedCourse = db.prepare('SELECT * FROM courses WHERE id = ?').get(id) as any;
    res.json(formatCourse(updatedCourse));
  } catch (error: any) {
    console.error('Error updating course:', error);
    res.status(500).json({ error: 'Failed to update course', details: error.message });
  }
});

// ------------------------------------------------------------
// DELETE /api/courses/:id
// Delete custom course (only if is_custom=1)
// ------------------------------------------------------------
router.delete('/:id', (req, res) => {
  try {
    const db = getDb();
    const id = Number(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ error: 'Invalid course ID' });
    }

    const course = db.prepare('SELECT * FROM courses WHERE id = ?').get(id) as any;
    if (!course) {
      return res.status(404).json({ error: 'Course not found' });
    }

    if (!course.is_custom) {
      return res.status(400).json({ error: 'Cannot delete standard curriculum courses; only custom courses can be deleted' });
    }

    db.prepare('DELETE FROM courses WHERE id = ?').run(id);
    res.json({ success: true, message: 'Custom course deleted successfully' });
  } catch (error: any) {
    console.error('Error deleting course:', error);
    res.status(500).json({ error: 'Failed to delete course', details: error.message });
  }
});

export default router;
