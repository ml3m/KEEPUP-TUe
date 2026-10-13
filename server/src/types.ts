// ============================================================
// TypeScript types for the KEEPUP server
// ============================================================

export type FocusArea = 'algo_theory' | 'arch_systems' | 'soft_analytics';

export type CourseType = 'foundational' | 'deepening' | 'cse_elective' | 'seminar' | 'graduation';

export type PlanCategory =
  | 'foundational'
  | 'specialization'
  | 'cse_elective'
  | 'free_elective'
  | 'seminar'
  | 'graduation';

export type CourseStatus = 'planned' | 'in_progress' | 'passed' | 'failed';

export interface Course {
  id: number;
  code: string;
  name: string;
  credits: number;
  focus_area: FocusArea | null;
  course_type: CourseType | null;
  quarter: string; // "1", "2", "3", "4", "1,2", "year"
  is_custom: boolean;
}

export interface PlanEntry {
  id: number;
  course_id: number;
  category: PlanCategory;
  year: number | null;
  quarter: number | null;
  status: CourseStatus;
  grade: number | null;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface PlanEntryWithCourse extends PlanEntry {
  course: Course;
}

export interface UserSettings {
  id: number;
  specialization_area: FocusArea | null;
  created_at: string;
  updated_at: string;
}

export interface ValidationRule {
  id: string;
  name: string;
  status: 'pass' | 'warning' | 'error';
  message: string;
  details: any[];
}

export interface ValidationResult {
  overall_status: 'pass' | 'warning' | 'error';
  total_credits: number;
  target_credits: number;
  rules: ValidationRule[];
}
