import React, { useState, useMemo } from 'react';
import { useAppContext } from '@/context/AppContext';
import {
  CATEGORY_META,
  PlanCategory,
  STATUS_META,
  CourseStatus,
  FOCUS_AREA_META,
} from '@/types';
import {
  Table,
  Search,
  ChevronUp,
  ChevronDown,
  ChevronsUpDown,
  Trash2,
  Award,
  CheckCircle2,
  Clock,
  BookOpen,
  X,
  Calendar,
  Layers,
} from 'lucide-react';

type SortColumn = 'code' | 'category' | 'name' | 'credits' | 'term' | 'status' | 'grade';
type SortDirection = 'asc' | 'desc';

const CATEGORIES: PlanCategory[] = [
  'foundational',
  'specialization',
  'cse_elective',
  'free_elective',
  'seminar',
  'graduation',
];

const Summary: React.FC = () => {
  const { plan, settings, updatePlanEntry, removePlanEntry } = useAppContext();

  // Filters
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Sorting
  const [sortColumn, setSortColumn] = useState<SortColumn>('term');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');

  // Local state for grade inputs to allow smooth editing without firing API on every keystroke
  const [editingGrades, setEditingGrades] = useState<Record<number, string>>({});

  // Summary statistics
  const totalCredits = useMemo(
    () => plan.reduce((sum, e) => sum + (e.course?.credits || 0), 0),
    [plan]
  );

  const passedEntries = useMemo(
    () => plan.filter((e) => e.status === 'passed'),
    [plan]
  );

  const passedCredits = useMemo(
    () => passedEntries.reduce((sum, e) => sum + (e.course?.credits || 0), 0),
    [passedEntries]
  );

  // Weighted GPA of passed graded courses
  const gpa = useMemo(() => {
    const graded = passedEntries.filter((e) => e.grade !== null && e.grade !== undefined);
    if (graded.length === 0) return null;

    const totalWeight = graded.reduce((sum, e) => sum + (e.course?.credits || 0), 0);
    if (totalWeight === 0) return null;

    const weightedSum = graded.reduce(
      (sum, e) => sum + (e.grade! * (e.course?.credits || 0)),
      0
    );
    return (weightedSum / totalWeight).toFixed(2);
  }, [passedEntries]);

  // Handle header sorting click
  const handleSort = (col: SortColumn) => {
    if (sortColumn === col) {
      setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortColumn(col);
      setSortDirection('asc');
    }
  };

  const hasActiveFilters =
    searchQuery.trim() !== '' || categoryFilter !== 'all' || statusFilter !== 'all';

  const handleClearFilters = () => {
    setSearchQuery('');
    setCategoryFilter('all');
    setStatusFilter('all');
  };

  // Filtered and Sorted entries
  const processedEntries = useMemo(() => {
    const filtered = plan.filter((entry) => {
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchCode = entry.course?.code.toLowerCase().includes(q);
        const matchName = entry.course?.name.toLowerCase().includes(q);
        if (!matchCode && !matchName) return false;
      }

      if (categoryFilter !== 'all' && entry.category !== categoryFilter) {
        return false;
      }

      if (statusFilter !== 'all' && entry.status !== statusFilter) {
        return false;
      }

      return true;
    });

    return filtered.sort((a, b) => {
      let comparison = 0;

      switch (sortColumn) {
        case 'code':
          comparison = (a.course?.code || '').localeCompare(b.course?.code || '');
          break;
        case 'name':
          comparison = (a.course?.name || '').localeCompare(b.course?.name || '');
          break;
        case 'category':
          comparison = (a.category || '').localeCompare(b.category || '');
          break;
        case 'credits':
          comparison = (a.course?.credits || 0) - (b.course?.credits || 0);
          break;
        case 'term': {
          const aTerm = (a.year || 99) * 10 + (a.quarter || 99);
          const bTerm = (b.year || 99) * 10 + (b.quarter || 99);
          comparison = aTerm - bTerm;
          break;
        }
        case 'status':
          comparison = a.status.localeCompare(b.status);
          break;
        case 'grade':
          comparison = (a.grade || 0) - (b.grade || 0);
          break;
      }

      return sortDirection === 'asc' ? comparison : -comparison;
    });
  }, [plan, searchQuery, categoryFilter, statusFilter, sortColumn, sortDirection]);

  // Inline status update
  const handleStatusChange = async (id: number, newStatus: CourseStatus) => {
    try {
      await updatePlanEntry(id, { status: newStatus });
    } catch (err) {
      console.error('Failed to update status:', err);
    }
  };

  // Inline grade update on blur or enter
  const handleGradeBlur = async (id: number, currentGrade: number | null) => {
    const valStr = editingGrades[id];
    if (valStr === undefined) return;

    const trimmed = valStr.trim();
    const newGrade = trimmed === '' ? null : Number(trimmed);

    if (newGrade !== currentGrade) {
      if (newGrade === null || (!isNaN(newGrade) && newGrade >= 0 && newGrade <= 10)) {
        try {
          await updatePlanEntry(id, { grade: newGrade });
        } catch (err) {
          console.error('Failed to update grade:', err);
        }
      }
    }

    setEditingGrades((prev) => {
      const copy = { ...prev };
      delete copy[id];
      return copy;
    });
  };

  const handleRemove = async (id: number) => {
    try {
      await removePlanEntry(id);
    } catch (err) {
      console.error('Failed to remove course:', err);
    }
  };

  // Render sort icon helper
  const renderSortIcon = (col: SortColumn) => {
    if (sortColumn !== col) {
      return <ChevronsUpDown className="w-3.5 h-3.5 text-gray-300" />;
    }
    return sortDirection === 'asc' ? (
      <ChevronUp className="w-3.5 h-3.5 text-gray-900" />
    ) : (
      <ChevronDown className="w-3.5 h-3.5 text-gray-900" />
    );
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header Banner & Metrics */}
      <div className="bg-gradient-to-br from-white via-slate-50/50 to-red-50/10 rounded-2xl border border-gray-200/90 p-6 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2.5">
              <div className="p-2 bg-red-50 text-tue-red rounded-xl">
                <Table className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900 tracking-tight">
                  Curriculum Summary & Grades
                </h2>
                <div className="flex flex-wrap items-center gap-2.5 mt-1 text-xs text-gray-500">
                  <span>Specialization Track:</span>
                  {settings?.specialization_area ? (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg text-xs font-bold bg-purple-50 text-purple-700 border border-purple-200/70">
                      <span className="w-2 h-2 rounded-full bg-purple-600" />
                      {FOCUS_AREA_META[settings.specialization_area]?.label}
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 rounded-lg text-xs font-medium bg-gray-100 text-gray-500 italic">
                      None selected
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Quick Metrics Cards */}
          <div className="grid grid-cols-3 gap-3 self-stretch lg:self-auto">
            {/* Metric 1 */}
            <div className="bg-white/90 backdrop-blur-xs p-3.5 rounded-xl border border-gray-200/80 shadow-2xs">
              <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 block mb-0.5">
                Total Planned
              </span>
              <div className="flex items-baseline gap-1">
                <span className="text-lg font-black text-gray-900 font-mono">
                  {totalCredits}
                </span>
                <span className="text-[10px] font-medium text-gray-400">/ 120 ECTS</span>
              </div>
            </div>

            {/* Metric 2 */}
            <div className="bg-white/90 backdrop-blur-xs p-3.5 rounded-xl border border-gray-200/80 shadow-2xs">
              <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 block mb-0.5">
                Passed Credits
              </span>
              <div className="flex items-baseline gap-1">
                <span className="text-lg font-black text-emerald-600 font-mono">
                  {passedCredits}
                </span>
                <span className="text-[10px] font-medium text-gray-400">ECTS</span>
              </div>
            </div>

            {/* Metric 3 */}
            <div className="bg-white/90 backdrop-blur-xs p-3.5 rounded-xl border border-gray-200/80 shadow-2xs">
              <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 block mb-0.5 flex items-center gap-1">
                <Award className="w-3 h-3 text-amber-500" />
                Weighted GPA
              </span>
              <div className="flex items-baseline gap-1">
                <span className="text-lg font-black text-gray-900 font-mono">
                  {gpa !== null ? gpa : '—'}
                </span>
                <span className="text-[10px] font-medium text-gray-400">/ 10</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Filter and Search Controls Bar */}
      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative w-full sm:flex-1">
          <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Filter courses by code or title..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9.5 pr-8 py-2 bg-white border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-tue-red/20 focus:border-tue-red shadow-2xs transition-all"
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

        <div className="flex gap-2 w-full sm:w-auto">
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="flex-1 sm:flex-initial px-3 py-2 bg-white border border-gray-200 rounded-xl text-xs font-semibold text-gray-700 focus:ring-2 focus:ring-tue-red/20 focus:border-tue-red shadow-2xs transition-all cursor-pointer"
          >
            <option value="all">All Categories</option>
            {CATEGORIES.map((cat) => (
              <option key={cat} value={cat}>
                {CATEGORY_META[cat].label}
              </option>
            ))}
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="flex-1 sm:flex-initial px-3 py-2 bg-white border border-gray-200 rounded-xl text-xs font-semibold text-gray-700 focus:ring-2 focus:ring-tue-red/20 focus:border-tue-red shadow-2xs transition-all cursor-pointer"
          >
            <option value="all">All Statuses</option>
            <option value="planned">📅 Planned</option>
            <option value="in_progress">🔄 In Progress</option>
            <option value="passed">✅ Passed</option>
            <option value="failed">❌ Failed</option>
          </select>

          {hasActiveFilters && (
            <button
              onClick={handleClearFilters}
              className="px-3 py-2 text-xs font-semibold text-tue-red hover:bg-red-50 rounded-xl border border-red-200 transition-colors flex items-center gap-1"
              title="Reset all filters"
            >
              <X className="w-3.5 h-3.5" />
              Reset
            </button>
          )}
        </div>
      </div>

      {/* Main Table Card */}
      <div className="rounded-2xl overflow-hidden bg-white border border-gray-200/90 shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="bg-gray-50/90 border-b border-gray-200/90 text-[11px] font-bold uppercase tracking-wider text-gray-500 select-none">
                <th
                  onClick={() => handleSort('code')}
                  className="py-3.5 px-4 cursor-pointer hover:bg-gray-100/70 transition-colors"
                >
                  <div className="flex items-center gap-1.5">
                    <span>Code</span>
                    {renderSortIcon('code')}
                  </div>
                </th>

                <th
                  onClick={() => handleSort('category')}
                  className="py-3.5 px-4 cursor-pointer hover:bg-gray-100/70 transition-colors"
                >
                  <div className="flex items-center gap-1.5">
                    <span>Category</span>
                    {renderSortIcon('category')}
                  </div>
                </th>

                <th
                  onClick={() => handleSort('name')}
                  className="py-3.5 px-4 cursor-pointer hover:bg-gray-100/70 transition-colors"
                >
                  <div className="flex items-center gap-1.5">
                    <span>Course Name</span>
                    {renderSortIcon('name')}
                  </div>
                </th>

                <th
                  onClick={() => handleSort('credits')}
                  className="py-3.5 px-4 cursor-pointer hover:bg-gray-100/70 transition-colors text-right"
                >
                  <div className="flex items-center justify-end gap-1.5">
                    <span>Credits</span>
                    {renderSortIcon('credits')}
                  </div>
                </th>

                <th
                  onClick={() => handleSort('term')}
                  className="py-3.5 px-4 cursor-pointer hover:bg-gray-100/70 transition-colors"
                >
                  <div className="flex items-center gap-1.5">
                    <span>Term</span>
                    {renderSortIcon('term')}
                  </div>
                </th>

                <th
                  onClick={() => handleSort('status')}
                  className="py-3.5 px-4 cursor-pointer hover:bg-gray-100/70 transition-colors"
                >
                  <div className="flex items-center gap-1.5">
                    <span>Status</span>
                    {renderSortIcon('status')}
                  </div>
                </th>

                <th
                  onClick={() => handleSort('grade')}
                  className="py-3.5 px-4 cursor-pointer hover:bg-gray-100/70 transition-colors text-center"
                >
                  <div className="flex items-center justify-center gap-1.5">
                    <span>Grade</span>
                    {renderSortIcon('grade')}
                  </div>
                </th>

                <th className="py-3.5 px-4 text-center">Actions</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-gray-100">
              {processedEntries.map((entry) => {
                const catMeta = CATEGORY_META[entry.category];
                const termLabel =
                  entry.year && entry.quarter
                    ? `Y${entry.year} · Q${entry.quarter}`
                    : entry.quarter
                    ? `Q${entry.quarter}`
                    : 'Unassigned';

                const isEditingGrade = editingGrades[entry.id] !== undefined;
                const gradeDisplay = isEditingGrade
                  ? editingGrades[entry.id]
                  : entry.grade !== null
                  ? String(entry.grade)
                  : '';

                return (
                  <tr
                    key={entry.id}
                    className="hover:bg-slate-50/70 transition-colors duration-150"
                  >
                    {/* Code */}
                    <td className="py-3 px-4 font-mono font-bold text-xs text-gray-900 whitespace-nowrap">
                      <span className="bg-gray-100/80 px-2 py-0.5 rounded-md border border-gray-200/70">
                        {entry.course?.code}
                      </span>
                    </td>

                    {/* Category */}
                    <td className="py-3 px-4 whitespace-nowrap">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-gray-50 border border-gray-200/80">
                        <span
                          className="w-2 h-2 rounded-full flex-shrink-0"
                          style={{ backgroundColor: catMeta?.color }}
                        />
                        <span className="text-gray-700">{catMeta?.label}</span>
                      </span>
                    </td>

                    {/* Course Name */}
                    <td className="py-3 px-4 font-semibold text-gray-900 text-xs sm:text-sm">
                      {entry.course?.name}
                    </td>

                    {/* Credits */}
                    <td className="py-3 px-4 text-right font-mono font-bold text-xs text-gray-800 whitespace-nowrap">
                      {entry.course?.credits} ECTS
                    </td>

                    {/* Term */}
                    <td className="py-3 px-4 text-xs font-medium text-gray-600 whitespace-nowrap">
                      <span className="bg-gray-100/90 text-gray-700 px-2 py-0.5 rounded-md border border-gray-200/60 font-mono text-[11px]">
                        {termLabel}
                      </span>
                    </td>

                    {/* Inline Status Dropdown */}
                    <td className="py-3 px-4 whitespace-nowrap">
                      <select
                        value={entry.status}
                        onChange={(e) =>
                          handleStatusChange(entry.id, e.target.value as CourseStatus)
                        }
                        className={`text-xs font-semibold px-2.5 py-1 rounded-lg border transition-all cursor-pointer shadow-2xs ${
                          entry.status === 'passed'
                            ? 'bg-emerald-50 border-emerald-300 text-emerald-800'
                            : entry.status === 'in_progress'
                            ? 'bg-blue-50 border-blue-300 text-blue-800'
                            : entry.status === 'failed'
                            ? 'bg-red-50 border-red-300 text-red-800'
                            : 'bg-gray-50 border-gray-200 text-gray-700'
                        }`}
                      >
                        <option value="planned">📅 Planned</option>
                        <option value="in_progress">🔄 In Progress</option>
                        <option value="passed">✅ Passed</option>
                        <option value="failed">❌ Failed</option>
                      </select>
                    </td>

                    {/* Inline Grade Input */}
                    <td className="py-3 px-4 text-center whitespace-nowrap">
                      {entry.status === 'passed' ? (
                        <input
                          type="number"
                          step="0.1"
                          min="1"
                          max="10"
                          placeholder="—"
                          value={gradeDisplay}
                          onChange={(e) =>
                            setEditingGrades({
                              ...editingGrades,
                              [entry.id]: e.target.value,
                            })
                          }
                          onBlur={() => handleGradeBlur(entry.id, entry.grade)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              (e.target as HTMLInputElement).blur();
                            }
                          }}
                          className="w-16 px-2 py-1 text-center font-mono font-bold text-xs bg-emerald-50/50 border border-emerald-200 text-emerald-900 rounded-lg focus:bg-white focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 transition-all"
                          title="Enter grade between 1.0 and 10.0"
                        />
                      ) : (
                        <span className="text-gray-300 text-xs font-mono">—</span>
                      )}
                    </td>

                    {/* Actions */}
                    <td className="py-3 px-4 text-center whitespace-nowrap">
                      <button
                        onClick={() => handleRemove(entry.id)}
                        className="text-gray-400 hover:text-red-600 p-1.5 rounded-lg hover:bg-red-50 transition-colors"
                        title="Remove from plan"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                );
              })}

              {processedEntries.length === 0 && (
                <tr>
                  <td colSpan={8} className="py-16 text-center text-gray-400 text-xs">
                    <div className="max-w-xs mx-auto space-y-2">
                      <BookOpen className="w-8 h-8 text-gray-300 mx-auto" />
                      <p className="font-semibold text-gray-600">No matching entries found</p>
                      <p className="text-[11px] text-gray-400">
                        Adjust your filters or add courses to your plan.
                      </p>
                      {hasActiveFilters && (
                        <button
                          onClick={handleClearFilters}
                          className="text-xs font-semibold text-tue-red hover:underline pt-1 block mx-auto"
                        >
                          Clear filters
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              )}
            </tbody>

            {/* Footer Summary Row */}
            <tfoot className="bg-gray-50/95 border-t-2 border-gray-200/90 font-semibold text-xs text-gray-700">
              <tr>
                <td colSpan={3} className="py-4 px-4">
                  <div className="flex items-center gap-3 flex-wrap">
                    <span className="font-bold text-gray-900 tracking-tight text-xs">
                      Category Progress:
                    </span>
                    {CATEGORIES.map((cat) => {
                      const sumCredits = plan
                        .filter((e) => e.category === cat)
                        .reduce((acc, e) => acc + (e.course?.credits || 0), 0);
                      const target = CATEGORY_META[cat].targetCredits;
                      const isComplete = sumCredits >= target;

                      return (
                        <span
                          key={cat}
                          className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[11px] border font-mono ${
                            isComplete
                              ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                              : 'bg-white text-gray-700 border-gray-200'
                          }`}
                        >
                          <span
                            className="w-2 h-2 rounded-full"
                            style={{ backgroundColor: CATEGORY_META[cat].color }}
                          />
                          <span>
                            {CATEGORY_META[cat].label}:{' '}
                            <strong>{sumCredits}</strong>/{target}
                          </span>
                        </span>
                      );
                    })}
                  </div>
                </td>
                <td className="py-4 px-4 text-right font-mono font-black text-gray-900 text-sm whitespace-nowrap">
                  {totalCredits} ECTS
                </td>
                <td colSpan={4} className="py-4 px-4 text-gray-500 text-[11px] text-right font-mono font-medium">
                  Degree Goal: 120 ECTS
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Summary;
