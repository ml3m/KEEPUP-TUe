import axios from 'axios';
import type {
  Course,
  PlanEntry,
  PlanEntryWithCourse,
  UserSettings,
  ValidationResult,
  FocusArea,
  CourseType,
  PlanCategory,
  CourseStatus,
} from '@/types';

const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Courses API
export async function fetchCourses(filters?: {
  focus_area?: FocusArea | string;
  course_type?: CourseType | string;
  quarter?: string;
}): Promise<Course[]> {
  const response = await api.get<Course[]>('/courses', { params: filters });
  return response.data;
}

export async function fetchCourse(id: number): Promise<Course> {
  const response = await api.get<Course>(`/courses/${id}`);
  return response.data;
}

export async function createCourse(data: {
  code: string;
  name: string;
  credits: number;
  focus_area?: FocusArea | null;
  course_type?: CourseType | null;
  quarter?: string;
}): Promise<Course> {
  const response = await api.post<Course>('/courses', data);
  return response.data;
}

export async function updateCourse(id: number, data: Partial<Course>): Promise<Course> {
  const response = await api.put<Course>(`/courses/${id}`, data);
  return response.data;
}

export async function deleteCourse(id: number): Promise<void> {
  await api.delete(`/courses/${id}`);
}

// Plan API
export async function fetchPlan(): Promise<PlanEntryWithCourse[]> {
  const response = await api.get<PlanEntryWithCourse[]>('/plan');
  return response.data;
}

export async function addToPlan(data: {
  course_id: number;
  category: PlanCategory;
  year?: number | null;
  quarter?: number | null;
  status?: CourseStatus;
}): Promise<PlanEntryWithCourse> {
  const response = await api.post<PlanEntryWithCourse>('/plan', data);
  return response.data;
}

export async function updatePlanEntry(
  id: number,
  data: Partial<Pick<PlanEntry, 'category' | 'year' | 'quarter' | 'status' | 'grade' | 'sort_order'>>
): Promise<PlanEntryWithCourse> {
  const response = await api.put<PlanEntryWithCourse>(`/plan/${id}`, data);
  return response.data;
}

export async function removePlanEntry(id: number): Promise<void> {
  await api.delete(`/plan/${id}`);
}

export async function reorderPlan(
  entries: Array<{ id: number; sort_order: number; year?: number | null; quarter?: number | null }>
): Promise<PlanEntryWithCourse[]> {
  const response = await api.put<PlanEntryWithCourse[]>('/plan/reorder', { entries });
  return response.data;
}

// Settings API
export async function fetchSettings(): Promise<UserSettings> {
  const response = await api.get<UserSettings>('/settings');
  return response.data;
}

export async function updateSettings(data: {
  specialization_area: FocusArea | null;
}): Promise<UserSettings> {
  const response = await api.put<UserSettings>('/settings', data);
  return response.data;
}

// Validation API
export async function fetchValidation(): Promise<ValidationResult> {
  const response = await api.get<ValidationResult>('/validation');
  return response.data;
}

export default api;
