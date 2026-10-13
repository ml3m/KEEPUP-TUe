import React, { useState, useMemo } from 'react';
import { useAppContext } from '@/context/AppContext';
import AddCourseModal from '@/components/common/AddCourseModal';
import { createCourse } from '@/services/api';
import { Course, FOCUS_AREA_META } from '@/types';
import {
  Search,
  Filter,
  Check,
  Plus,
  BookOpen,
  Sparkles,
  HelpCircle,
  PlusCircle,
  Trash2,
  Layers,
  GraduationCap,
  Bookmark,
  Calendar,
  X,
  Loader2,
} from 'lucide-react';

const CoursesCatalog: React.FC = () => {
  const { courses, plan, removePlanEntry, refreshCourses } = useAppContext();

  const [searchQuery, setSearchQuery] = useState<string>('');
  const [focusAreaFilter, setFocusAreaFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [quarterFilter, setQuarterFilter] = useState<string>('all');

  // Modal State
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);

  // Custom Course Form State
  const [customCode, setCustomCode] = useState<string>('');
  const [customName, setCustomName] = useState<string>('');
  const [customCredits, setCustomCredits] = useState<number>(5);
  const [customQuarter, setCustomQuarter] = useState<string>('1');
  const [isSubmittingCustom, setIsSubmittingCustom] = useState<boolean>(false);
  const [customSuccessMessage, setCustomSuccessMessage] = useState<string | null>(null);

  // Plan lookup by course_id -> plan_entry_id
  const plannedEntryMap = useMemo(() => {
    const map = new Map<number, number>();
    plan.forEach((entry) => {
      map.set(entry.course_id, entry.id);
    });
    return map;
  }, [plan]);

  // Filter courses
  const filteredCourses = useMemo(() => {
    return courses.filter((course) => {
      // Search query (code or name)
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchesCode = course.code.toLowerCase().includes(query);
        const matchesName = course.name.toLowerCase().includes(query);
        if (!matchesCode && !matchesName) return false;
      }

      // Focus area
      if (focusAreaFilter !== 'all') {
        if (course.focus_area !== focusAreaFilter) return false;
      }

      // Course type
      if (typeFilter !== 'all') {
        if (course.course_type !== typeFilter) return false;
      }

      // Quarter
      if (quarterFilter !== 'all') {
        if (!course.quarter.includes(quarterFilter) && course.quarter !== 'year') {
          return false;
        }
      }

      return true;
    });
  }, [courses, searchQuery, focusAreaFilter, typeFilter, quarterFilter]);

  // Group filtered courses by curriculum sections
  const sections = useMemo(() => {
    const algoCourses = filteredCourses.filter(
      (c) => c.focus_area === 'algo_theory'
    );
    const archCourses = filteredCourses.filter(
      (c) => c.focus_area === 'arch_systems'
    );
    const softCourses = filteredCourses.filter(
      (c) => c.focus_area === 'soft_analytics'
    );
    const cseElectives = filteredCourses.filter(
      (c) => c.course_type === 'cse_elective' && !c.focus_area
    );
    const seminars = filteredCourses.filter((c) => c.course_type === 'seminar');
    const graduation = filteredCourses.filter((c) => c.course_type === 'graduation');
    const customCourses = filteredCourses.filter(
      (c) => c.is_custom && !c.focus_area && c.course_type !== 'cse_elective'
    );

    return [
      {
        id: 'algo_theory',
        title: 'Algorithms & Theory',
        subtitle: 'Foundational & Deepening tracks in formal methods, complexity, and logic',
        badgeColor: 'bg-blue-50 text-blue-700 border-blue-200',
        accentColor: '#3B82F6',
        icon: Layers,
        courses: algoCourses,
      },
      {
        id: 'arch_systems',
        title: 'Architecture & Systems',
        subtitle: 'Foundational & Deepening tracks in hardware, security, networks, and OS',
        badgeColor: 'bg-purple-50 text-purple-700 border-purple-200',
        accentColor: '#8B5CF6',
        icon: Layers,
        courses: archCourses,
      },
      {
        id: 'soft_analytics',
        title: 'Software & Analytics',
        subtitle: 'Foundational & Deepening tracks in data science, AI, and software engineering',
        badgeColor: 'bg-indigo-50 text-indigo-700 border-indigo-200',
        accentColor: '#6366F1',
        icon: Layers,
        courses: softCourses,
      },
      {
        id: 'cse_electives',
        title: 'CSE Electives',
        subtitle: 'Specialized subjects, research projects, and academic/industrial internships',
        badgeColor: 'bg-emerald-50 text-emerald-700 border-emerald-200',
        accentColor: '#10B981',
        icon: Bookmark,
        courses: cseElectives,
      },
      {
        id: 'seminars',
        title: 'Seminars',
        subtitle: 'Advanced research literature presentations (5 ECTS required)',
        badgeColor: 'bg-amber-50 text-amber-700 border-amber-200',
        accentColor: '#F59E0B',
        icon: Sparkles,
        courses: seminars,
      },
      {
        id: 'graduation',
        title: 'Graduation Phase',
        subtitle: 'Preparation Graduation Project (10 ECTS) & Master Thesis Project (30 ECTS)',
        badgeColor: 'bg-red-50 text-tue-red border-red-200',
        accentColor: '#EF4444',
        icon: GraduationCap,
        courses: graduation,
      },
      {
        id: 'custom',
        title: 'Custom & Free Electives',
        subtitle: 'Individually added external subjects, language courses, and transfer credits',
        badgeColor: 'bg-slate-100 text-slate-700 border-slate-200',
        accentColor: '#64748B',
        icon: PlusCircle,
        courses: customCourses,
      },
    ].filter((sec) => sec.courses.length > 0);
  }, [filteredCourses]);

  const hasActiveFilters =
    searchQuery.trim() !== '' ||
    focusAreaFilter !== 'all' ||
    typeFilter !== 'all' ||
    quarterFilter !== 'all';

  const handleClearFilters = () => {
    setSearchQuery('');
    setFocusAreaFilter('all');
    setTypeFilter('all');
    setQuarterFilter('all');
  };

  const handleOpenAddModal = (course: Course) => {
    setSelectedCourse(course);
    setIsModalOpen(true);
  };

  const handleRemoveFromPlan = async (courseId: number) => {
    const entryId = plannedEntryMap.get(courseId);
    if (entryId) {
      try {
        await removePlanEntry(entryId);
      } catch (err) {
        console.error('Failed to remove course:', err);
      }
    }
  };

  const handleCreateCustomCourse = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customCode.trim() || !customName.trim()) return;

    setIsSubmittingCustom(true);
    setCustomSuccessMessage(null);
    try {
      const newCourse = await createCourse({
        code: customCode.trim().toUpperCase(),
        name: customName.trim(),
        credits: Number(customCredits),
        focus_area: null,
        course_type: null,
        quarter: customQuarter,
      });

      await refreshCourses();
      setCustomCode('');
      setCustomName('');
      setCustomCredits(5);
      setCustomSuccessMessage(`Course "${newCourse.code}" created! Configure placement below.`);

      // Automatically open add modal for convenience
      setSelectedCourse(newCourse);
      setIsModalOpen(true);
    } catch (err) {
      console.error('Failed to create custom course:', err);
    } finally {
      setIsSubmittingCustom(false);
    }
  };

  // Helper badge for course type
  const renderTypeBadge = (course: Course) => {
    if (course.course_type === 'foundational') {
      return (
        <span
          className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-bold bg-blue-50 text-blue-700 border border-blue-200/80"
          title="Foundational Course (Mandatory in focus area)"
        >
          Foundational
        </span>
      );
    }
    if (course.course_type === 'deepening') {
      return (
        <span
          className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-bold bg-purple-50 text-purple-700 border border-purple-200/80"
          title="Deepening Course"
        >
          Deepening
        </span>
      );
    }
    if (course.course_type === 'seminar') {
      return (
        <span
          className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-bold bg-amber-50 text-amber-800 border border-amber-200/80"
          title="Seminar Course"
        >
          Seminar
        </span>
      );
    }
    if (course.course_type === 'cse_elective') {
      return (
        <span
          className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200/80"
          title="CSE Elective"
        >
          CSE Elective
        </span>
      );
    }
    if (course.course_type === 'graduation') {
      return (
        <span
          className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-bold bg-red-50 text-tue-red border border-red-200/80"
          title="Graduation Requirement"
        >
          Graduation
        </span>
      );
    }
    return (
      <span
        className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-medium bg-slate-100 text-slate-700 border border-slate-200"
        title="Custom / Free Elective"
      >
        Free Elective
      </span>
    );
  };

  return (
    <div className="space-y-8 pb-12">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-red-50 text-tue-red rounded-xl">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900 tracking-tight">
                Curriculum Catalog
              </h2>
              <p className="text-xs text-gray-500 mt-0.5">
                Explore the complete TU/e Computer Science curriculum and add courses directly to your study schedule.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start md:self-auto">
          <span className="text-xs font-medium text-gray-500 bg-white border border-gray-200 px-3 py-1.5 rounded-lg shadow-sm">
            Total Catalog Courses:{' '}
            <strong className="text-gray-900 font-mono">{courses.length}</strong>
          </span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-2xl border border-gray-200/80 p-4 shadow-sm space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
          {/* Search Input */}
          <div className="md:col-span-5 relative">
            <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by course code or title (e.g., 2IMA10, Algorithms)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9.5 pr-8 py-2 bg-gray-50/70 border border-gray-200 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-tue-red/20 focus:border-tue-red transition-all"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600 rounded-md"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Focus Area Filter */}
          <div className="md:col-span-3">
            <div className="relative">
              <select
                value={focusAreaFilter}
                onChange={(e) => setFocusAreaFilter(e.target.value)}
                className="w-full px-3 py-2 bg-gray-50/70 border border-gray-200 rounded-xl text-xs font-medium text-gray-700 focus:bg-white focus:ring-2 focus:ring-tue-red/20 focus:border-tue-red transition-all cursor-pointer"
              >
                <option value="all">All Focus Areas</option>
                <option value="algo_theory">Algorithms & Theory</option>
                <option value="arch_systems">Architecture & Systems</option>
                <option value="soft_analytics">Software & Analytics</option>
              </select>
            </div>
          </div>

          {/* Course Type Filter */}
          <div className="md:col-span-2">
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="w-full px-3 py-2 bg-gray-50/70 border border-gray-200 rounded-xl text-xs font-medium text-gray-700 focus:bg-white focus:ring-2 focus:ring-tue-red/20 focus:border-tue-red transition-all cursor-pointer"
            >
              <option value="all">All Types</option>
              <option value="foundational">Foundational</option>
              <option value="deepening">Deepening</option>
              <option value="cse_elective">CSE Elective</option>
              <option value="seminar">Seminar</option>
            </select>
          </div>

          {/* Quarter Filter */}
          <div className="md:col-span-2">
            <select
              value={quarterFilter}
              onChange={(e) => setQuarterFilter(e.target.value)}
              className="w-full px-3 py-2 bg-gray-50/70 border border-gray-200 rounded-xl text-xs font-medium text-gray-700 focus:bg-white focus:ring-2 focus:ring-tue-red/20 focus:border-tue-red transition-all cursor-pointer"
            >
              <option value="all">All Quarters</option>
              <option value="1">Quarter 1 (Fall)</option>
              <option value="2">Quarter 2 (Winter)</option>
              <option value="3">Quarter 3 (Spring)</option>
              <option value="4">Quarter 4 (Summer)</option>
            </select>
          </div>
        </div>

        {/* Filter Stats & Clear action */}
        <div className="flex items-center justify-between text-xs text-gray-500 pt-2 border-t border-gray-100">
          <div className="flex items-center gap-2">
            <span>
              Showing <strong className="text-gray-900 font-semibold">{filteredCourses.length}</strong>{' '}
              of <strong className="text-gray-900 font-semibold">{courses.length}</strong> courses
            </span>
            {hasActiveFilters && (
              <span className="text-[11px] bg-red-50 text-tue-red font-semibold px-2 py-0.5 rounded-full border border-red-100">
                Filtered view
              </span>
            )}
          </div>

          {hasActiveFilters && (
            <button
              onClick={handleClearFilters}
              className="inline-flex items-center gap-1 text-xs font-medium text-tue-red hover:text-tue-red-dark hover:underline transition-colors"
            >
              <X className="w-3.5 h-3.5" />
              Reset filters
            </button>
          )}
        </div>
      </div>

      {/* Course Sections */}
      <div className="space-y-10">
        {sections.map((section) => {
          const SectionIcon = section.icon;

          return (
            <section key={section.id} className="space-y-4">
              {/* Section Header */}
              <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-2 border-b border-gray-200/90 pb-3">
                <div className="flex items-center gap-2.5">
                  <div
                    className="w-2.5 h-5 rounded-full"
                    style={{ backgroundColor: section.accentColor }}
                  />
                  <h3 className="font-bold text-gray-900 text-base tracking-tight">
                    {section.title}
                  </h3>
                  <span
                    className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-mono font-semibold border ${section.badgeColor}`}
                  >
                    {section.courses.length}
                  </span>
                </div>
                <span className="text-xs text-gray-500">{section.subtitle}</span>
              </div>

              {/* Course Cards Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {section.courses.map((course) => {
                  const isPlanned = plannedEntryMap.has(course.id);

                  return (
                    <div
                      key={course.id}
                      className={`group rounded-xl p-4 flex flex-col justify-between border transition-all duration-200 ${
                        isPlanned
                          ? 'border-emerald-300 bg-emerald-50/30 shadow-sm'
                          : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-md'
                      }`}
                    >
                      <div>
                        {/* Top Meta Bar */}
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-bold text-sm tracking-tight text-gray-900 bg-gray-100/90 px-2 py-0.5 rounded-md border border-gray-200/70">
                              {course.code}
                            </span>
                            {renderTypeBadge(course)}
                          </div>
                          <span className="font-mono font-semibold text-xs px-2 py-0.5 rounded-full bg-slate-100 text-slate-800 border border-slate-200/60">
                            {course.credits} ECTS
                          </span>
                        </div>

                        {/* Title */}
                        <h4 className="font-semibold text-gray-900 text-sm mt-3 line-clamp-2 leading-snug group-hover:text-tue-red transition-colors">
                          {course.name}
                        </h4>

                        {/* Timing and Area Information */}
                        <div className="flex items-center justify-between text-xs text-gray-500 mt-3 pt-2 border-t border-gray-100/80">
                          <span className="inline-flex items-center gap-1 font-medium text-[11px] text-gray-600 bg-gray-50 px-2 py-0.5 rounded-md border border-gray-100">
                            <Calendar className="w-3 h-3 text-gray-400" />
                            {course.quarter ? `Quarter ${course.quarter}` : 'Year-long / Flexible'}
                          </span>
                          {course.focus_area && (
                            <span className="text-[11px] font-medium text-gray-400">
                              {FOCUS_AREA_META[course.focus_area]?.shortLabel}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Card Bottom: Add / Remove Action */}
                      <div className="mt-4 pt-3 border-t border-gray-100/80">
                        {isPlanned ? (
                          <div className="flex items-center justify-between gap-2">
                            <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-800 bg-emerald-100/90 px-2.5 py-1 rounded-lg border border-emerald-200">
                              <Check className="w-3.5 h-3.5 text-emerald-600 stroke-[2.5]" />
                              Scheduled in Plan
                            </span>
                            <button
                              onClick={() => handleRemoveFromPlan(course.id)}
                              className="inline-flex items-center gap-1 text-xs text-gray-400 hover:text-red-600 p-1 rounded hover:bg-red-50 transition-colors"
                              title="Remove from plan"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              <span className="text-[11px]">Remove</span>
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => handleOpenAddModal(course)}
                            className="w-full py-1.5 px-3 rounded-lg bg-gray-50 hover:bg-red-50 text-gray-700 hover:text-tue-red border border-gray-200 hover:border-red-200 text-xs font-semibold flex items-center justify-center gap-1.5 transition-all shadow-2xs active:scale-[0.99]"
                          >
                            <Plus className="w-3.5 h-3.5" />
                            Add to Plan
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          );
        })}

        {/* Empty Search Result State */}
        {sections.length === 0 && (
          <div className="text-center py-16 bg-white rounded-2xl border border-gray-200/90 shadow-sm max-w-lg mx-auto p-8">
            <div className="w-12 h-12 rounded-2xl bg-gray-50 border border-gray-200 flex items-center justify-center mx-auto mb-3 text-gray-400">
              <HelpCircle className="w-6 h-6" />
            </div>
            <h4 className="font-bold text-gray-900 text-base">
              No matching courses found
            </h4>
            <p className="text-xs text-gray-500 mt-1 leading-relaxed">
              We couldn't find any courses matching your filter criteria. Try clearing some filters or register a custom free elective below.
            </p>
            {hasActiveFilters && (
              <button
                onClick={handleClearFilters}
                className="btn-primary text-xs mt-4 py-2 px-4 inline-flex items-center gap-1.5"
              >
                Clear all filters
              </button>
            )}
          </div>
        )}
      </div>

      {/* "Add Custom Course" Section */}
      <div className="bg-gradient-to-br from-white via-gray-50/50 to-red-50/20 rounded-2xl border border-gray-200/90 p-6 shadow-sm">
        <div className="flex items-center gap-2.5 mb-1.5">
          <div className="p-1.5 bg-red-100/70 text-tue-red rounded-lg">
            <Sparkles className="w-4 h-4" />
          </div>
          <h3 className="font-bold text-gray-900 text-base tracking-tight">
            Register Custom Elective or Language Course
          </h3>
        </div>
        <p className="text-xs text-gray-500 max-w-2xl mb-5">
          Need to include courses outside the CSE catalog (such as Dutch for Beginners SFC500, Mathematics of Deep Learning 2MMA80, or external homologation modules)? Add them here.
        </p>

        {customSuccessMessage && (
          <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-xl flex items-center gap-2 shadow-2xs">
            <Check className="w-4 h-4 text-emerald-600 stroke-[2.5]" />
            <span>{customSuccessMessage}</span>
          </div>
        )}

        <form
          onSubmit={handleCreateCustomCourse}
          className="grid grid-cols-1 sm:grid-cols-12 gap-3.5 items-end"
        >
          <div className="sm:col-span-3">
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              Course Code
            </label>
            <input
              type="text"
              placeholder="e.g., SFC500"
              value={customCode}
              onChange={(e) => setCustomCode(e.target.value)}
              required
              className="w-full px-3 py-2 bg-white border border-gray-300 rounded-xl text-sm font-mono uppercase focus:ring-2 focus:ring-tue-red/20 focus:border-tue-red transition-all"
            />
          </div>

          <div className="sm:col-span-4">
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              Course Name
            </label>
            <input
              type="text"
              placeholder="e.g., Dutch for Beginners I"
              value={customName}
              onChange={(e) => setCustomName(e.target.value)}
              required
              className="w-full px-3 py-2 bg-white border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-tue-red/20 focus:border-tue-red transition-all"
            />
          </div>

          <div className="sm:col-span-2">
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              Credits (ECTS)
            </label>
            <input
              type="number"
              min="1"
              max="30"
              value={customCredits}
              onChange={(e) => setCustomCredits(Number(e.target.value))}
              required
              className="w-full px-3 py-2 bg-white border border-gray-300 rounded-xl text-sm font-mono focus:ring-2 focus:ring-tue-red/20 focus:border-tue-red transition-all"
            />
          </div>

          <div className="sm:col-span-1">
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              Quarter
            </label>
            <select
              value={customQuarter}
              onChange={(e) => setCustomQuarter(e.target.value)}
              className="w-full px-2 py-2 bg-white border border-gray-300 rounded-xl text-sm font-medium focus:ring-2 focus:ring-tue-red/20 focus:border-tue-red transition-all cursor-pointer"
            >
              <option value="1">Q1</option>
              <option value="2">Q2</option>
              <option value="3">Q3</option>
              <option value="4">Q4</option>
              <option value="year">Year</option>
            </select>
          </div>

          <div className="sm:col-span-2">
            <button
              type="submit"
              disabled={isSubmittingCustom}
              className="btn-primary w-full flex items-center justify-center gap-1.5 py-2 text-xs font-semibold rounded-xl shadow-sm hover:shadow active:scale-[0.99] transition-all disabled:opacity-60"
            >
              {isSubmittingCustom ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Creating...</span>
                </>
              ) : (
                <>
                  <PlusCircle className="w-4 h-4" />
                  <span>Create Course</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Add Course Modal */}
      <AddCourseModal
        course={selectedCourse}
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedCourse(null);
        }}
      />
    </div>
  );
};

export default CoursesCatalog;
