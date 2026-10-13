// ============================================================
// Shared TypeScript types for the KEEPUP application
// Used by both frontend components and API service layer
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
  details: Record<string, unknown>[];
}

export interface ValidationResult {
  overall_status: 'pass' | 'warning' | 'error';
  total_credits: number;
  target_credits: number;
  rules: ValidationRule[];
}

// Category display metadata
export const CATEGORY_META: Record<PlanCategory, { label: string; color: string; bgColor: string; targetCredits: number }> = {
  foundational:    { label: 'Foundational',     color: '#3B82F6', bgColor: 'bg-cat-foundational',   targetCredits: 15 },
  specialization:  { label: 'Specialization',   color: '#8B5CF6', bgColor: 'bg-cat-specialization', targetCredits: 15 },
  cse_elective:    { label: 'CSE Electives',    color: '#10B981', bgColor: 'bg-cat-cse-elective',   targetCredits: 30 },
  free_elective:   { label: 'Free Electives',   color: '#F59E0B', bgColor: 'bg-cat-free-elective',  targetCredits: 15 },
  seminar:         { label: 'Seminar',          color: '#EAB308', bgColor: 'bg-cat-seminar',        targetCredits: 5  },
  graduation:      { label: 'Graduation',       color: '#4F46E5', bgColor: 'bg-indigo-600',          targetCredits: 40 },
};

export const FOCUS_AREA_META: Record<FocusArea, { label: string; shortLabel: string }> = {
  algo_theory:    { label: 'Algorithms & Theory',       shortLabel: 'A&T' },
  arch_systems:   { label: 'Architecture & Systems',    shortLabel: 'A&S' },
  soft_analytics: { label: 'Software & Analytics',      shortLabel: 'S&A' },
};

export const STATUS_META: Record<CourseStatus, { label: string; icon: string; color: string }> = {
  planned:     { label: 'Planned',     icon: '📅', color: 'text-gray-500' },
  in_progress: { label: 'In Progress', icon: '🔄', color: 'text-blue-600' },
  passed:      { label: 'Passed',      icon: '✅', color: 'text-green-600' },
  failed:      { label: 'Failed',      icon: '❌', color: 'text-red-600' },
};
