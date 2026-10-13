// ============================================================
// Core Validation Engine for KEEPUP Study Planner
// Validates study plan against TU/e CSE Master program rules (R1-R10)
// ============================================================

import { getDb } from '../db/index.js';
import type { ValidationResult, ValidationRule, FocusArea } from '../types.js';

interface RawPlanEntryRow {
  id: number;
  course_id: number;
  category: string;
  year: number | null;
  quarter: number | null;
  status: string;
  grade: number | null;
  sort_order: number;
  code: string;
  name: string;
  credits: number;
  focus_area: FocusArea | null;
  course_type: string | null;
  course_quarter: string | null;
  is_custom: number;
}

const FOCUS_AREA_NAMES: Record<FocusArea, string> = {
  algo_theory: 'Algorithms & Theory',
  arch_systems: 'Architecture & Systems',
  soft_analytics: 'Software & Analytics',
};

const ALL_FOCUS_AREAS: FocusArea[] = ['algo_theory', 'arch_systems', 'soft_analytics'];

/**
 * Checks if a course is offered in the given quarter.
 * Lenient with 'year' and multi-quarter courses (e.g., '1,2').
 */
function isQuarterOffered(courseQuarter: string | null | undefined, quarterNum: number): boolean {
  if (!courseQuarter) return true; // lenient if unspecified
  const qStr = courseQuarter.trim().toLowerCase();
  if (qStr === 'year') return true;

  // Split by commas, slashes, or whitespace
  const quarters = qStr.split(/[,/\s]+/).map(q => q.trim());
  return quarters.includes(String(quarterNum));
}

export function validatePlan(): ValidationResult {
  const db = getDb();

  // 1. Fetch user settings
  const settings = db.prepare('SELECT * FROM user_settings WHERE id = 1').get() as {
    id: number;
    specialization_area: FocusArea | null;
  } | undefined;
  const specArea = settings?.specialization_area ?? null;

  // 2. Fetch all plan entries joined with course data
  const entries = db.prepare(`
    SELECT 
      p.id,
      p.course_id,
      p.category,
      p.year,
      p.quarter,
      p.status,
      p.grade,
      p.sort_order,
      c.code,
      c.name,
      c.credits,
      c.focus_area,
      c.course_type,
      c.quarter AS course_quarter,
      c.is_custom
    FROM plan_entries p
    JOIN courses c ON p.course_id = c.id
    ORDER BY p.year ASC, p.quarter ASC, p.sort_order ASC
  `).all() as RawPlanEntryRow[];

  const rules: ValidationRule[] = [];

  // ============================================================
  // R1 — Foundational Breadth (15 credits)
  // Must have exactly one foundational course from EACH of the 3 focus areas
  // with category='foundational' in plan_entries
  // ============================================================
  {
    const foundationalEntries = entries.filter(e => e.category === 'foundational');
    const areaBreakdown: Record<FocusArea, RawPlanEntryRow[]> = {
      algo_theory: [],
      arch_systems: [],
      soft_analytics: [],
    };
    const invalidEntries: RawPlanEntryRow[] = [];

    for (const entry of foundationalEntries) {
      if (entry.focus_area && ALL_FOCUS_AREAS.includes(entry.focus_area) && entry.course_type === 'foundational') {
        areaBreakdown[entry.focus_area].push(entry);
      } else {
        invalidEntries.push(entry);
      }
    }

    const missingAreas: string[] = [];
    const excessAreas: string[] = [];

    for (const area of ALL_FOCUS_AREAS) {
      const count = areaBreakdown[area].length;
      if (count === 0) {
        missingAreas.push(FOCUS_AREA_NAMES[area]);
      } else if (count > 1) {
        excessAreas.push(`${FOCUS_AREA_NAMES[area]} (${count})`);
      }
    }

    const isBreadthSatisfied =
      missingAreas.length === 0 &&
      excessAreas.length === 0 &&
      invalidEntries.length === 0 &&
      foundationalEntries.length === 3;

    let status: 'pass' | 'warning' | 'error' = 'pass';
    let message = 'Foundational breadth requirement met (1 course from each of the 3 focus areas, 15 credits).';

    if (!isBreadthSatisfied) {
      status = 'error';
      const issues: string[] = [];
      if (missingAreas.length > 0) {
        issues.push(`Missing: ${missingAreas.join(', ')}`);
      }
      if (excessAreas.length > 0) {
        issues.push(`Multiple courses in: ${excessAreas.join(', ')}`);
      }
      if (invalidEntries.length > 0) {
        issues.push(`Non-foundational course(s) categorized as foundational: ${invalidEntries.map(e => e.code).join(', ')}`);
      }
      message = `Foundational breadth incomplete: ${issues.join('; ')}.`;
    }

    const details = ALL_FOCUS_AREAS.map(area => ({
      focus_area: area,
      area_name: FOCUS_AREA_NAMES[area],
      count: areaBreakdown[area].length,
      courses: areaBreakdown[area].map(c => ({ code: c.code, name: c.name, credits: c.credits })),
      satisfied: areaBreakdown[area].length === 1,
    }));

    if (invalidEntries.length > 0) {
      details.push({
        focus_area: 'invalid' as any,
        area_name: 'Invalid Foundational Entries',
        count: invalidEntries.length,
        courses: invalidEntries.map(c => ({ code: c.code, name: c.name, credits: c.credits })),
        satisfied: false,
      });
    }

    rules.push({
      id: 'R1',
      name: 'Foundational Breadth',
      status,
      message,
      details,
    });
  }

  // ============================================================
  // R2 — Specialization Depth (15 credits)
  // Must have exactly 3 courses with category='specialization'
  // Must belong to declared specialization focus area (user_settings.specialization_area)
  // Must be foundational or deepening courses of that focus area
  // ============================================================
  {
    const specEntries = entries.filter(e => e.category === 'specialization');
    let status: 'pass' | 'warning' | 'error' = 'pass';
    let message = '';
    const details: any[] = [];

    if (!specArea) {
      status = 'error';
      message = 'Specialization area not declared in user settings. Please select your specialization focus area.';
    } else {
      const specAreaName = FOCUS_AREA_NAMES[specArea] || specArea;
      const validCourses: RawPlanEntryRow[] = [];
      const invalidCourses: Array<{ entry: RawPlanEntryRow; reason: string }> = [];

      for (const entry of specEntries) {
        const isMatchingArea = entry.focus_area === specArea;
        const isValidType = entry.course_type === 'foundational' || entry.course_type === 'deepening';

        if (isMatchingArea && isValidType) {
          validCourses.push(entry);
        } else {
          let reason = '';
          if (!isMatchingArea && !isValidType) {
            reason = `Course focus area (${entry.focus_area || 'none'}) does not match specialization (${specArea}), and course type (${entry.course_type || 'none'}) is not foundational/deepening`;
          } else if (!isMatchingArea) {
            reason = `Course focus area (${entry.focus_area || 'none'}) does not match declared specialization (${specArea})`;
          } else {
            reason = `Course type (${entry.course_type || 'none'}) must be foundational or deepening`;
          }
          invalidCourses.push({ entry, reason });
        }
      }

      const totalCredits = specEntries.reduce((sum, e) => sum + e.credits, 0);

      details.push({
        specialization_area: specArea,
        specialization_name: specAreaName,
        total_entries: specEntries.length,
        valid_entries: validCourses.length,
        total_credits: totalCredits,
        courses: specEntries.map(e => ({
          code: e.code,
          name: e.name,
          credits: e.credits,
          focus_area: e.focus_area,
          course_type: e.course_type,
          valid: validCourses.some(v => v.id === e.id),
        })),
        invalid_reasons: invalidCourses.map(i => ({ code: i.entry.code, reason: i.reason })),
      });

      if (validCourses.length === 3 && specEntries.length === 3) {
        status = 'pass';
        message = `Specialization depth requirement met (3 courses in ${specAreaName}, 15 credits).`;
      } else {
        status = 'error';
        const issues: string[] = [];
        if (specEntries.length !== 3) {
          issues.push(`Expected 3 courses, found ${specEntries.length}`);
        }
        if (invalidCourses.length > 0) {
          issues.push(`${invalidCourses.length} course(s) do not meet specialization criteria for ${specAreaName}`);
        }
        message = `Specialization depth incomplete: ${issues.join('; ')}.`;
      }
    }

    rules.push({
      id: 'R2',
      name: 'Specialization Depth',
      status,
      message,
      details,
    });
  }

  // ============================================================
  // R3 — CSE Electives (30 credits)
  // Sum credits of plan_entries with category='cse_elective'. Must equal 30.
  // ============================================================
  {
    const cseElectiveEntries = entries.filter(e => e.category === 'cse_elective');
    const credits = cseElectiveEntries.reduce((sum, e) => sum + e.credits, 0);
    const target = 30;

    const status: 'pass' | 'warning' | 'error' = credits === target ? 'pass' : 'error';
    const message =
      credits === target
        ? `CSE electives requirement met (30/30 credits).`
        : `CSE electives requirement not met: currently ${credits}/${target} credits.`;

    rules.push({
      id: 'R3',
      name: 'CSE Electives',
      status,
      message,
      details: [
        {
          current_credits: credits,
          target_credits: target,
          courses: cseElectiveEntries.map(e => ({ code: e.code, name: e.name, credits: e.credits })),
        },
      ],
    });
  }

  // ============================================================
  // R4 — Free Electives (15 credits)
  // Sum credits of plan_entries with category='free_elective'. Must equal 15.
  // ============================================================
  {
    const freeElectiveEntries = entries.filter(e => e.category === 'free_elective');
    const credits = freeElectiveEntries.reduce((sum, e) => sum + e.credits, 0);
    const target = 15;

    const status: 'pass' | 'warning' | 'error' = credits === target ? 'pass' : 'error';
    const message =
      credits === target
        ? `Free electives requirement met (15/15 credits).`
        : `Free electives requirement not met: currently ${credits}/${target} credits.`;

    rules.push({
      id: 'R4',
      name: 'Free Electives',
      status,
      message,
      details: [
        {
          current_credits: credits,
          target_credits: target,
          courses: freeElectiveEntries.map(e => ({ code: e.code, name: e.name, credits: e.credits })),
        },
      ],
    });
  }

  // ============================================================
  // R5 — Seminar (5 credits)
  // Exactly one plan_entry with category='seminar'
  // If placed in a quarter, warn if placed before Year 1 Q4
  // ============================================================
  {
    const seminarEntries = entries.filter(e => e.category === 'seminar');
    let status: 'pass' | 'warning' | 'error' = 'pass';
    let message = '';

    if (seminarEntries.length === 0) {
      status = 'error';
      message = 'Missing seminar course: exactly one seminar course is required (5 credits).';
    } else if (seminarEntries.length > 1) {
      status = 'error';
      message = `Too many seminar courses: expected 1, found ${seminarEntries.length}.`;
    } else {
      const sem = seminarEntries[0];
      // Check quarter timing: warn if scheduled before Year 1 Q4
      if (sem.year === 1 && sem.quarter !== null && sem.quarter < 4) {
        status = 'warning';
        message = `Seminar course ${sem.code} is scheduled in Year 1 Q${sem.quarter}. Seminars are recommended from Year 1 Q4 onward.`;
      } else {
        status = 'pass';
        message = `Seminar requirement met (${sem.code}: ${sem.name}, 5 credits).`;
      }
    }

    rules.push({
      id: 'R5',
      name: 'Seminar',
      status,
      message,
      details: seminarEntries.map(e => ({
        code: e.code,
        name: e.name,
        credits: e.credits,
        year: e.year,
        quarter: e.quarter,
      })),
    });
  }

  // ============================================================
  // R6 — Graduation (40 credits)
  // Must have both 2IMC05 (10cr) and 2IMC00 (30cr) in plan with category='graduation'
  // ============================================================
  {
    const gradEntries = entries.filter(e => e.category === 'graduation');
    const has2IMC05 = gradEntries.some(e => e.code === '2IMC05');
    const has2IMC00 = gradEntries.some(e => e.code === '2IMC00');

    let status: 'pass' | 'warning' | 'error' = 'pass';
    let message = '';

    if (has2IMC05 && has2IMC00) {
      status = 'pass';
      message = 'Graduation requirements met: 2IMC05 (10cr) and 2IMC00 (30cr) both included.';
    } else {
      status = 'error';
      const missing: string[] = [];
      if (!has2IMC05) missing.push('2IMC05 Preparation Graduation Project (10 credits)');
      if (!has2IMC00) missing.push('2IMC00 Master Project (30 credits)');
      message = `Missing graduation components: ${missing.join(', ')}.`;
    }

    rules.push({
      id: 'R6',
      name: 'Graduation',
      status,
      message,
      details: [
        {
          code: '2IMC05',
          name: 'Preparation Graduation Project',
          required_credits: 10,
          present: has2IMC05,
        },
        {
          code: '2IMC00',
          name: 'Master Project',
          required_credits: 30,
          present: has2IMC00,
        },
      ],
    });
  }

  // ============================================================
  // R7 — Per-Quarter Credit Limit
  // For each (year, quarter) combination that has plan entries, sum credits.
  // Must not exceed 20. Skip entries with NULL year/quarter (unassigned).
  // ============================================================
  {
    const quarterTotals: Record<string, { year: number; quarter: number; credits: number; courses: string[] }> = {};

    for (const entry of entries) {
      if (entry.year !== null && entry.quarter !== null) {
        const key = `Y${entry.year}Q${entry.quarter}`;
        if (!quarterTotals[key]) {
          quarterTotals[key] = {
            year: entry.year,
            quarter: entry.quarter,
            credits: 0,
            courses: [],
          };
        }
        quarterTotals[key].credits += entry.credits;
        quarterTotals[key].courses.push(`${entry.code} (${entry.credits}cr)`);
      }
    }

    const overloadedQuarters = Object.values(quarterTotals).filter(q => q.credits > 20);
    const status: 'pass' | 'warning' | 'error' = overloadedQuarters.length > 0 ? 'error' : 'pass';

    const message =
      overloadedQuarters.length > 0
        ? `Per-quarter credit limit (20 cr) exceeded in: ${overloadedQuarters
            .map(q => `Year ${q.year} Q${q.quarter} (${q.credits} cr)`)
            .join(', ')}.`
        : 'All quarters comply with the maximum limit of 20 credits.';

    rules.push({
      id: 'R7',
      name: 'Per-Quarter Credit Limit',
      status,
      message,
      details: Object.values(quarterTotals).map(q => ({
        year: q.year,
        quarter: q.quarter,
        credits: q.credits,
        exceeded: q.credits > 20,
        courses: q.courses,
      })),
    });
  }

  // ============================================================
  // R8 — Total Credits
  // Sum ALL plan entry credits. Must equal exactly 120.
  // ============================================================
  const totalCredits = entries.reduce((sum, e) => sum + e.credits, 0);
  {
    const target = 120;
    const status: 'pass' | 'warning' | 'error' = totalCredits === target ? 'pass' : 'error';
    const message =
      totalCredits === target
        ? `Total credits requirement met (120/120 credits).`
        : `Total credits must equal 120 (currently ${totalCredits}/${target} credits).`;

    rules.push({
      id: 'R8',
      name: 'Total Credits',
      status,
      message,
      details: [
        {
          total_credits: totalCredits,
          target_credits: target,
          difference: totalCredits - target,
        },
      ],
    });
  }

  // ============================================================
  // R9 — Quarter Availability
  // For each plan entry that has a year/quarter assignment, check if
  // the course's quarter field includes that quarter number.
  // Soft warning, not an error.
  // ============================================================
  {
    const quarterMismatches: Array<{
      code: string;
      name: string;
      year: number;
      assigned_quarter: number;
      offered_quarter: string | null;
    }> = [];

    for (const entry of entries) {
      if (entry.year !== null && entry.quarter !== null) {
        if (!isQuarterOffered(entry.course_quarter, entry.quarter)) {
          quarterMismatches.push({
            code: entry.code,
            name: entry.name,
            year: entry.year,
            assigned_quarter: entry.quarter,
            offered_quarter: entry.course_quarter,
          });
        }
      }
    }

    const status: 'pass' | 'warning' | 'error' = quarterMismatches.length > 0 ? 'warning' : 'pass';
    const message =
      quarterMismatches.length > 0
        ? `${quarterMismatches.length} course(s) scheduled in quarters outside their normally offered schedule.`
        : 'All scheduled courses align with their offered quarters.';

    rules.push({
      id: 'R9',
      name: 'Quarter Availability',
      status,
      message,
      details: quarterMismatches,
    });
  }

  // ============================================================
  // R10 — Specialization Cross-Area
  // If a course has focus_area != user's specialization_area AND category='specialization',
  // warn to reclassify as 'cse_elective'
  // ============================================================
  {
    const crossAreaEntries: Array<{
      code: string;
      name: string;
      course_focus_area: FocusArea | null;
      user_specialization: FocusArea | null;
    }> = [];

    if (specArea) {
      for (const entry of entries) {
        if (entry.category === 'specialization' && entry.focus_area !== specArea) {
          crossAreaEntries.push({
            code: entry.code,
            name: entry.name,
            course_focus_area: entry.focus_area,
            user_specialization: specArea,
          });
        }
      }
    }

    let status: 'pass' | 'warning' | 'error' = 'pass';
    let message = '';

    if (!specArea) {
      status = 'warning';
      message = 'No specialization area declared. Cannot check for specialization cross-area courses.';
    } else if (crossAreaEntries.length > 0) {
      status = 'warning';
      message = `${crossAreaEntries.length} course(s) marked as 'specialization' have a different focus area than your specialization (${FOCUS_AREA_NAMES[specArea] || specArea}). Consider reclassifying as 'cse_elective'.`;
    } else {
      status = 'pass';
      message = 'All specialization courses belong to your declared focus area.';
    }

    rules.push({
      id: 'R10',
      name: 'Specialization Cross-Area',
      status,
      message,
      details: crossAreaEntries,
    });
  }

  // Determine overall status: error > warning > pass
  const hasError = rules.some(r => r.status === 'error');
  const hasWarning = rules.some(r => r.status === 'warning');
  const overall_status: 'pass' | 'warning' | 'error' = hasError ? 'error' : hasWarning ? 'warning' : 'pass';

  return {
    overall_status,
    total_credits: totalCredits,
    target_credits: 120,
    rules,
  };
}
