import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type {
  PlanEntryWithCourse,
  Course,
  UserSettings,
  ValidationResult,
  PlanCategory,
  CourseStatus,
  FocusArea,
  PlanEntry,
} from '@/types';
import {
  fetchPlan,
  fetchCourses,
  fetchSettings,
  fetchValidation,
  addToPlan as apiAddToPlan,
  updatePlanEntry as apiUpdatePlanEntry,
  removePlanEntry as apiRemovePlanEntry,
  reorderPlan as apiReorderPlan,
  updateSettings as apiUpdateSettings,
} from '@/services/api';

interface AppContextType {
  plan: PlanEntryWithCourse[];
  courses: Course[];
  settings: UserSettings | null;
  validation: ValidationResult | null;
  loading: boolean;
  error: string | null;
  refreshPlan: () => Promise<void>;
  refreshCourses: () => Promise<void>;
  refreshSettings: () => Promise<void>;
  refreshValidation: () => Promise<void>;
  refreshAll: () => Promise<void>;
  addToPlan: (data: {
    course_id: number;
    category: PlanCategory;
    year?: number | null;
    quarter?: number | null;
    status?: CourseStatus;
  }) => Promise<PlanEntryWithCourse>;
  updatePlanEntry: (
    id: number,
    data: Partial<Pick<PlanEntry, 'category' | 'year' | 'quarter' | 'status' | 'grade' | 'sort_order'>>
  ) => Promise<PlanEntryWithCourse>;
  removePlanEntry: (id: number) => Promise<void>;
  reorderPlan: (
    entries: Array<{ id: number; sort_order: number; year?: number | null; quarter?: number | null }>
  ) => Promise<PlanEntryWithCourse[]>;
  updateSpecialization: (area: FocusArea | null) => Promise<UserSettings>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [plan, setPlan] = useState<PlanEntryWithCourse[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [settings, setSettings] = useState<UserSettings | null>(null);
  const [validation, setValidation] = useState<ValidationResult | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const refreshValidation = useCallback(async () => {
    try {
      const data = await fetchValidation();
      setValidation(data);
    } catch (err) {
      console.warn('Failed to fetch validation:', err);
    }
  }, []);

  const refreshPlan = useCallback(async () => {
    try {
      const data = await fetchPlan();
      setPlan(data);
      await refreshValidation();
    } catch (err) {
      console.error('Failed to fetch plan:', err);
    }
  }, [refreshValidation]);

  const refreshCourses = useCallback(async () => {
    try {
      const data = await fetchCourses();
      setCourses(data);
    } catch (err) {
      console.error('Failed to fetch courses:', err);
    }
  }, []);

  const refreshSettings = useCallback(async () => {
    try {
      const data = await fetchSettings();
      setSettings(data);
      await refreshValidation();
    } catch (err) {
      console.error('Failed to fetch settings:', err);
    }
  }, [refreshValidation]);

  const refreshAll = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [coursesData, planData, settingsData, validationData] = await Promise.all([
        fetchCourses().catch(() => []),
        fetchPlan().catch(() => []),
        fetchSettings().catch(() => null),
        fetchValidation().catch(() => null),
      ]);
      setCourses(coursesData);
      setPlan(planData);
      setSettings(settingsData);
      setValidation(validationData);
    } catch (err) {
      console.error('Failed to refresh all data:', err);
      setError('Failed to load study plan data.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshAll();
  }, [refreshAll]);

  const addToPlan = async (data: {
    course_id: number;
    category: PlanCategory;
    year?: number | null;
    quarter?: number | null;
    status?: CourseStatus;
  }) => {
    const newEntry = await apiAddToPlan(data);
    await refreshPlan();
    return newEntry;
  };

  const updatePlanEntry = async (
    id: number,
    data: Partial<Pick<PlanEntry, 'category' | 'year' | 'quarter' | 'status' | 'grade' | 'sort_order'>>
  ) => {
    const updated = await apiUpdatePlanEntry(id, data);
    await refreshPlan();
    return updated;
  };

  const removePlanEntry = async (id: number) => {
    await apiRemovePlanEntry(id);
    await refreshPlan();
  };

  const reorderPlan = async (
    entries: Array<{ id: number; sort_order: number; year?: number | null; quarter?: number | null }>
  ) => {
    const result = await apiReorderPlan(entries);
    await refreshPlan();
    return result;
  };

  const updateSpecialization = async (area: FocusArea | null) => {
    const updated = await apiUpdateSettings({ specialization_area: area });
    setSettings(updated);
    await refreshValidation();
    return updated;
  };

  return (
    <AppContext.Provider
      value={{
        plan,
        courses,
        settings,
        validation,
        loading,
        error,
        refreshPlan,
        refreshCourses,
        refreshSettings,
        refreshValidation,
        refreshAll,
        addToPlan,
        updatePlanEntry,
        removePlanEntry,
        reorderPlan,
        updateSpecialization,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export function useAppContext(): AppContextType {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
}

export default AppContext;
