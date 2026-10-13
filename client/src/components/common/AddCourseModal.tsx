import React, { useState, useEffect } from 'react';
import Modal from './Modal';
import { useAppContext } from '@/context/AppContext';
import {
  Course,
  PlanCategory,
  CourseStatus,
  CATEGORY_META,
  STATUS_META,
  FOCUS_AREA_META,
} from '@/types';
import { PlusCircle, Calendar, Tag, AlertCircle } from 'lucide-react';

interface AddCourseModalProps {
  course: Course | null;
  isOpen: boolean;
  onClose: () => void;
  onAdded?: () => void;
}

const CATEGORIES: PlanCategory[] = [
  'foundational',
  'specialization',
  'cse_elective',
  'free_elective',
  'seminar',
  'graduation',
];

const STATUSES: CourseStatus[] = ['planned', 'in_progress', 'passed', 'failed'];

const AddCourseModal: React.FC<AddCourseModalProps> = ({
  course,
  isOpen,
  onClose,
  onAdded,
}) => {
  const { plan, settings, addToPlan } = useAppContext();

  const [category, setCategory] = useState<PlanCategory>('cse_elective');
  const [year, setYear] = useState<number | null>(1);
  const [quarter, setQuarter] = useState<number | null>(1);
  const [status, setStatus] = useState<CourseStatus>('planned');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Compute smart defaults whenever modal opens for a given course
  useEffect(() => {
    if (!course || !isOpen) return;
    setErrorMessage(null);

    // 1. Smart default for Category
    let defaultCat: PlanCategory = 'cse_elective';

    if (course.course_type === 'graduation') {
      defaultCat = 'graduation';
    } else if (course.course_type === 'seminar') {
      defaultCat = 'seminar';
    } else if (course.course_type === 'foundational') {
      // Check if this course's focus area already has a foundational course in plan
      const foundationalCoveredAreas = plan
        .filter((entry) => entry.category === 'foundational' && entry.course.focus_area)
        .map((entry) => entry.course.focus_area);

      const areaAlreadyCovered =
        course.focus_area && foundationalCoveredAreas.includes(course.focus_area);

      if (!areaAlreadyCovered) {
        defaultCat = 'foundational';
      } else if (
        course.focus_area &&
        settings?.specialization_area &&
        course.focus_area === settings.specialization_area
      ) {
        const specCount = plan.filter((e) => e.category === 'specialization').length;
        defaultCat = specCount < 3 ? 'specialization' : 'cse_elective';
      } else {
        defaultCat = 'cse_elective';
      }
    } else if (
      course.focus_area &&
      settings?.specialization_area &&
      course.focus_area === settings.specialization_area
    ) {
      const specCount = plan.filter((e) => e.category === 'specialization').length;
      defaultCat = specCount < 3 ? 'specialization' : 'cse_elective';
    } else if (course.is_custom) {
      defaultCat = 'free_elective';
    } else if (course.course_type === 'cse_elective' || course.course_type === 'deepening') {
      defaultCat = 'cse_elective';
    }

    setCategory(defaultCat);

    // 2. Smart default for Quarter / Year
    let defaultQuarter: number | null = 1;
    let defaultYear: number | null = 1;

    if (course.course_type === 'graduation') {
      defaultYear = 2;
      defaultQuarter = course.code === '2IMC05' ? 1 : 2;
    } else if (course.quarter) {
      if (course.quarter === '1') defaultQuarter = 1;
      else if (course.quarter === '2') defaultQuarter = 2;
      else if (course.quarter === '3') defaultQuarter = 3;
      else if (course.quarter === '4') defaultQuarter = 4;
      else if (course.quarter.includes('1')) defaultQuarter = 1;
      else if (course.quarter === 'year') {
        defaultQuarter = null;
        defaultYear = null;
      }
    }

    setQuarter(defaultQuarter);
    setYear(defaultYear);
    setStatus('planned');
  }, [course, isOpen, plan, settings]);

  if (!course) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      await addToPlan({
        course_id: course.id,
        category,
        year: year ? Number(year) : null,
        quarter: quarter ? Number(quarter) : null,
        status,
      });

      onAdded?.();
      onClose();
    } catch (err: unknown) {
      console.error('Failed to add course to plan:', err);
      const msg =
        err && typeof err === 'object' && 'response' in err
          ? (err as { response?: { data?: { error?: string } } }).response?.data?.error
          : 'Failed to add course to plan. It might already be in your plan.';
      setErrorMessage(msg || 'Failed to add course to plan.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Add Course to Plan">
      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Course Info Card */}
        <div className="p-4 bg-gray-50 rounded-xl border border-gray-100 flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono font-bold text-gray-900 text-sm">
                {course.code}
              </span>
              <span className="badge bg-red-100 text-tue-red font-medium">
                {course.credits} ECTS
              </span>
              {course.focus_area && (
                <span className="badge bg-purple-100 text-purple-700">
                  {FOCUS_AREA_META[course.focus_area]?.shortLabel}
                </span>
              )}
            </div>
            <h4 className="font-semibold text-gray-900 mt-1">{course.name}</h4>
            <p className="text-xs text-gray-500 mt-0.5">
              Offered in: Quarter {course.quarter || 'Flexible'}
            </p>
          </div>
        </div>

        {errorMessage && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-xl flex items-center gap-2 text-sm text-red-700">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Category Selector */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5 flex items-center gap-1.5">
            <Tag className="w-4 h-4 text-gray-400" />
            Plan Category
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {CATEGORIES.map((catKey) => {
              const meta = CATEGORY_META[catKey];
              const isSelected = category === catKey;
              return (
                <button
                  type="button"
                  key={catKey}
                  onClick={() => setCategory(catKey)}
                  className={`flex items-center gap-2.5 p-3 rounded-lg border text-left text-xs font-medium transition-all ${
                    isSelected
                      ? 'border-gray-900 bg-gray-900 text-white shadow-sm'
                      : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  <span
                    className="w-3 h-3 rounded-full flex-shrink-0"
                    style={{ backgroundColor: meta.color }}
                  />
                  <div className="flex-1 truncate">
                    <div className="truncate">{meta.label}</div>
                    <div
                      className={`text-[10px] ${
                        isSelected ? 'text-gray-300' : 'text-gray-400'
                      }`}
                    >
                      Target: {meta.targetCredits} ECTS
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Timing: Year and Quarter */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-1.5">
              <Calendar className="w-4 h-4 text-gray-400" />
              Year
            </label>
            <select
              value={year === null ? 'none' : year}
              onChange={(e) =>
                setYear(e.target.value === 'none' ? null : Number(e.target.value))
              }
              className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-tue-red focus:border-tue-red"
            >
              <option value="1">Year 1</option>
              <option value="2">Year 2</option>
              <option value="none">Unassigned / Flexible</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Quarter
            </label>
            <select
              value={quarter === null ? 'none' : quarter}
              onChange={(e) =>
                setQuarter(e.target.value === 'none' ? null : Number(e.target.value))
              }
              className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-tue-red focus:border-tue-red"
            >
              <option value="1">Quarter 1 (Fall)</option>
              <option value="2">Quarter 2 (Winter)</option>
              <option value="3">Quarter 3 (Spring)</option>
              <option value="4">Quarter 4 (Summer)</option>
              <option value="none">Unassigned</option>
            </select>
          </div>
        </div>

        {/* Status Selector */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Status
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {STATUSES.map((statusKey) => {
              const meta = STATUS_META[statusKey];
              const isSelected = status === statusKey;
              return (
                <button
                  type="button"
                  key={statusKey}
                  onClick={() => setStatus(statusKey)}
                  className={`p-2 rounded-lg border text-xs flex items-center justify-center gap-1.5 transition-all ${
                    isSelected
                      ? 'border-tue-red bg-red-50 text-tue-red font-semibold'
                      : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  <span>{meta.icon}</span>
                  <span>{meta.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
          <button
            type="button"
            onClick={onClose}
            className="btn-secondary"
            disabled={isSubmitting}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="btn-primary flex items-center gap-2"
            disabled={isSubmitting}
          >
            <PlusCircle className="w-4 h-4" />
            {isSubmitting ? 'Adding...' : 'Add to Plan'}
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default AddCourseModal;
