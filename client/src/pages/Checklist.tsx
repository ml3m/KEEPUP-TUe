import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAppContext } from '@/context/AppContext';
import {
  CATEGORY_META,
  PlanCategory,
  STATUS_META,
  FOCUS_AREA_META,
  PlanEntryWithCourse,
} from '@/types';
import {
  CheckSquare,
  ChevronDown,
  ChevronUp,
  Plus,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  GraduationCap,
  Sparkles,
  Trash2,
  ShieldCheck,
  Calendar,
  Layers,
} from 'lucide-react';

const CATEGORIES: PlanCategory[] = [
  'foundational',
  'specialization',
  'cse_elective',
  'free_elective',
  'seminar',
  'graduation',
];

const CATEGORY_DESCRIPTIONS: Record<PlanCategory, string> = {
  foundational:
    'Requires exactly 15 ECTS: one 5-ECTS foundational course from each of the three focus areas (Algorithms & Theory, Architecture & Systems, Software & Analytics).',
  specialization:
    'Requires 15 ECTS of deepening or foundational courses belonging to your selected Specialization Focus Area.',
  cse_elective:
    'Requires 30 ECTS of deepening courses, CSE electives, or up to 15 ECTS for an academic/industry internship (2IMC10).',
  free_elective:
    'Requires 15 ECTS of master-level courses, language courses (max 5 ECTS Dutch/English), or homologation/external subjects.',
  seminar:
    'Requires 5 ECTS: one advanced CSE seminar with literature survey, oral presentation, and active participation.',
  graduation:
    'Requires 40 ECTS: Preparation Graduation Project (10 ECTS, 2IMC05), Master Project (30 ECTS, 2IMC00), and SCOP/e orientation (2IMR10).',
};

const Checklist: React.FC = () => {
  const { plan, validation, settings, removePlanEntry } = useAppContext();

  // Collapsed state for sections (defaults: all expanded)
  const [collapsed, setCollapsed] = useState<Record<PlanCategory, boolean>>({
    foundational: false,
    specialization: false,
    cse_elective: false,
    free_elective: false,
    seminar: false,
    graduation: false,
  });

  const toggleCollapse = (cat: PlanCategory) => {
    setCollapsed((prev) => ({ ...prev, [cat]: !prev[cat] }));
  };

  // Group entries by category
  const entriesByCategory = CATEGORIES.reduce((acc, cat) => {
    acc[cat] = plan.filter((e) => e.category === cat);
    return acc;
  }, {} as Record<PlanCategory, PlanEntryWithCourse[]>);

  // Calculate totals
  const totalCredits = plan.reduce(
    (sum, entry) => sum + (entry.course?.credits || 0),
    0
  );
  const totalPercentage = Math.min(100, Math.round((totalCredits / 120) * 100));

  const handleRemove = async (id: number) => {
    try {
      await removePlanEntry(id);
    } catch (err) {
      console.error('Failed to remove entry:', err);
    }
  };

  const overallStatus = validation?.overall_status || 'warning';

  return (
    <div className="space-y-8 pb-12">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-2.5">
          <div className="p-2 bg-red-50 text-tue-red rounded-xl">
            <CheckSquare className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900 tracking-tight">
              Degree Requirements Audit
            </h2>
            <p className="text-xs text-gray-500 mt-0.5">
              Verify your curriculum plan against TU/e Computer Science examination regulations.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {overallStatus === 'pass' ? (
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              Degree Audit Passed
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-amber-50 text-amber-800 border border-amber-200">
              <AlertTriangle className="w-4 h-4 text-amber-600" />
              Requirements Pending ({120 - totalCredits > 0 ? `${120 - totalCredits} ECTS left` : 'Review rules'})
            </span>
          )}
        </div>
      </div>

      {/* Overall Progress Card */}
      <div className="relative overflow-hidden bg-gradient-to-br from-white via-slate-50/40 to-red-50/10 rounded-2xl border border-gray-200/90 p-6 shadow-sm">
        {/* Subtle decorative background glow */}
        <div className="absolute top-0 right-0 -mt-10 -mr-10 w-48 h-48 bg-red-100/40 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pb-5 border-b border-gray-100">
            {/* Metric 1: Total Credits */}
            <div className="bg-white/80 backdrop-blur-xs p-4 rounded-xl border border-gray-200/70 shadow-2xs">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-gray-400 block mb-1">
                Total Planned ECTS
              </span>
              <div className="flex items-baseline gap-1.5">
                <span className="text-2xl font-black text-gray-900 font-mono tracking-tight">
                  {totalCredits}
                </span>
                <span className="text-xs font-medium text-gray-400">/ 120 ECTS</span>
              </div>
            </div>

            {/* Metric 2: Completion Percentage */}
            <div className="bg-white/80 backdrop-blur-xs p-4 rounded-xl border border-gray-200/70 shadow-2xs">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-gray-400 block mb-1">
                Program Completion
              </span>
              <div className="flex items-baseline gap-1.5">
                <span className="text-2xl font-black text-gray-900 font-mono tracking-tight">
                  {totalPercentage}%
                </span>
                <span className="text-xs font-medium text-gray-400">of curriculum</span>
              </div>
            </div>

            {/* Metric 3: Specialization Track */}
            <div className="bg-white/80 backdrop-blur-xs p-4 rounded-xl border border-gray-200/70 shadow-2xs">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-gray-400 block mb-1">
                Specialization Track
              </span>
              {settings?.specialization_area ? (
                <span className="inline-flex items-center gap-1.5 text-xs font-bold text-purple-700 bg-purple-50 border border-purple-200/70 px-2.5 py-1 rounded-lg truncate max-w-full">
                  <span className="w-2 h-2 rounded-full bg-purple-600 flex-shrink-0" />
                  <span className="truncate">{FOCUS_AREA_META[settings.specialization_area]?.label}</span>
                </span>
              ) : (
                <span className="text-xs font-medium text-amber-700 bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-lg inline-block">
                  Not Configured
                </span>
              )}
            </div>

            {/* Metric 4: Graduation Readiness */}
            <div className="bg-white/80 backdrop-blur-xs p-4 rounded-xl border border-gray-200/70 shadow-2xs">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-gray-400 block mb-1">
                Graduation Status
              </span>
              <div className="flex items-center gap-1.5 mt-0.5">
                <GraduationCap className="w-5 h-5 text-tue-red flex-shrink-0" />
                <span className="text-xs font-bold text-gray-800">
                  {totalCredits >= 120 ? 'Degree Goal Met' : `${Math.max(0, 120 - totalCredits)} ECTS Remaining`}
                </span>
              </div>
            </div>
          </div>

          {/* Big Progress Bar with Milestones */}
          <div className="mt-5 space-y-2">
            <div className="flex justify-between items-center text-xs font-semibold text-gray-600">
              <span>Overall Progress</span>
              <span className="font-mono">{totalCredits} / 120 ECTS ({totalPercentage}%)</span>
            </div>

            <div className="w-full bg-gray-200/80 rounded-full h-3 overflow-hidden shadow-inner p-0.5">
              <div
                className="h-full bg-gradient-to-r from-blue-600 via-purple-600 to-tue-red rounded-full transition-all duration-500 shadow-sm"
                style={{ width: `${totalPercentage}%` }}
              />
            </div>

            <div className="flex justify-between text-[10px] font-medium text-gray-400 pt-0.5">
              <span>Year 1 Start (0 ECTS)</span>
              <span>Year 1 Complete (60 ECTS)</span>
              <span>Master Thesis Defense (120 ECTS)</span>
            </div>
          </div>
        </div>
      </div>

      {/* Category Sections */}
      <div className="space-y-4">
        {CATEGORIES.map((catKey) => {
          const meta = CATEGORY_META[catKey];
          const entries = entriesByCategory[catKey] || [];
          const currentCredits = entries.reduce(
            (sum, e) => sum + (e.course?.credits || 0),
            0
          );
          const targetCredits = meta.targetCredits;
          const remainingCredits = Math.max(0, targetCredits - currentCredits);
          const isComplete = currentCredits >= targetCredits;
          const isPartiallyFilled = currentCredits > 0 && !isComplete;
          const isSectionCollapsed = collapsed[catKey];
          const percentage = Math.min(
            100,
            Math.round((currentCredits / targetCredits) * 100)
          );

          // Find associated validation rule
          const relevantRule = validation?.rules?.find(
            (r) =>
              r.id.toLowerCase().includes(catKey.replace('_', '')) ||
              r.name.toLowerCase().includes(meta.label.toLowerCase())
          );

          return (
            <div
              key={catKey}
              className={`rounded-2xl border transition-all duration-200 bg-white overflow-hidden ${
                isComplete
                  ? 'border-emerald-200/80 shadow-2xs'
                  : isPartiallyFilled
                  ? 'border-amber-200/90 shadow-2xs'
                  : 'border-gray-200 shadow-2xs'
              }`}
            >
              {/* Category Header */}
              <div
                className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 cursor-pointer hover:bg-gray-50/60 transition-colors select-none"
                onClick={() => toggleCollapse(catKey)}
              >
                <div className="flex items-start sm:items-center gap-3.5">
                  <div className="mt-0.5 sm:mt-0 flex-shrink-0">
                    {isComplete ? (
                      <div className="w-8 h-8 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600">
                        <CheckCircle2 className="w-5 h-5 stroke-[2.2]" />
                      </div>
                    ) : isPartiallyFilled ? (
                      <div className="w-8 h-8 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600">
                        <AlertTriangle className="w-4 h-4 stroke-[2.2]" />
                      </div>
                    ) : (
                      <div className="w-8 h-8 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-400">
                        <XCircle className="w-4 h-4" />
                      </div>
                    )}
                  </div>

                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                        style={{ backgroundColor: meta.color }}
                      />
                      <h3 className="font-bold text-gray-900 text-base tracking-tight">
                        {meta.label}
                      </h3>
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-mono font-bold border ${
                          isComplete
                            ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                            : 'bg-gray-100 text-gray-700 border-gray-200'
                        }`}
                      >
                        {currentCredits} / {targetCredits} ECTS
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 mt-1 max-w-2xl leading-relaxed">
                      {CATEGORY_DESCRIPTIONS[catKey]}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-4 self-end sm:self-auto">
                  {/* Category Progress Bar */}
                  <div className="w-32 hidden sm:block">
                    <div className="flex justify-between text-[11px] font-semibold text-gray-500 mb-1">
                      <span>{percentage}%</span>
                      <span>
                        {isComplete ? 'Fulfilled' : `${remainingCredits} ECTS left`}
                      </span>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-300"
                        style={{
                          width: `${percentage}%`,
                          backgroundColor: meta.color,
                        }}
                      />
                    </div>
                  </div>

                  <button
                    type="button"
                    className="p-1.5 rounded-xl text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
                    aria-label="Toggle section"
                  >
                    {isSectionCollapsed ? (
                      <ChevronDown className="w-5 h-5" />
                    ) : (
                      <ChevronUp className="w-5 h-5" />
                    )}
                  </button>
                </div>
              </div>

              {/* Collapsible Content */}
              {!isSectionCollapsed && (
                <div className="px-5 pb-5 pt-1 border-t border-gray-100 space-y-3.5">
                  {/* Validation message if available */}
                  {relevantRule && relevantRule.status !== 'pass' && (
                    <div className="p-3 rounded-xl bg-amber-50/90 border border-amber-200 text-amber-900 text-xs flex items-center gap-2.5">
                      <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0" />
                      <span className="font-medium">{relevantRule.message}</span>
                    </div>
                  )}

                  {/* Course Entries within Category */}
                  {entries.length > 0 && (
                    <div className="divide-y divide-gray-100 border border-gray-200/80 rounded-xl overflow-hidden bg-white shadow-2xs">
                      {entries.map((entry) => {
                        const statusMeta = STATUS_META[entry.status];
                        const termLabel =
                          entry.year && entry.quarter
                            ? `Y${entry.year} · Q${entry.quarter}`
                            : entry.quarter
                            ? `Q${entry.quarter}`
                            : 'Unassigned';

                        return (
                          <div
                            key={entry.id}
                            className="p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-gray-50/70 transition-colors"
                          >
                            <div className="flex items-center gap-3">
                              <span className="font-mono font-bold text-xs text-gray-900 bg-gray-100 px-2 py-1 rounded-md border border-gray-200/80 w-20 text-center flex-shrink-0">
                                {entry.course?.code}
                              </span>
                              <div>
                                <h5 className="font-semibold text-gray-900 text-sm">
                                  {entry.course?.name}
                                </h5>
                                <div className="flex flex-wrap items-center gap-2 text-xs text-gray-400 mt-0.5">
                                  <span className="inline-flex items-center gap-1 font-medium text-gray-600">
                                    <Calendar className="w-3 h-3 text-gray-400" />
                                    {termLabel}
                                  </span>
                                  <span>•</span>
                                  <span className="font-mono font-semibold text-gray-700">
                                    {entry.course?.credits} ECTS
                                  </span>
                                  {entry.grade !== null && (
                                    <>
                                      <span>•</span>
                                      <span className="text-emerald-700 font-bold bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200/60 font-mono text-[11px]">
                                        Grade: {entry.grade}
                                      </span>
                                    </>
                                  )}
                                </div>
                              </div>
                            </div>

                            <div className="flex items-center gap-3 self-end sm:self-auto">
                              <span
                                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium border ${
                                  entry.status === 'passed'
                                    ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                                    : entry.status === 'in_progress'
                                    ? 'bg-blue-50 text-blue-800 border-blue-200'
                                    : entry.status === 'failed'
                                    ? 'bg-red-50 text-red-800 border-red-200'
                                    : 'bg-gray-50 text-gray-700 border-gray-200'
                                }`}
                              >
                                <span>{statusMeta?.icon}</span>
                                <span>{statusMeta?.label}</span>
                              </span>

                              <button
                                onClick={() => handleRemove(entry.id)}
                                className="p-1 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                title="Remove course from plan"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* Empty Slot / "Need X more credits" Card */}
                  {!isComplete && (
                    <div className="p-4 border-2 border-dashed border-gray-200 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-gradient-to-r from-gray-50/60 to-white hover:border-gray-300 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600 flex-shrink-0">
                          <Sparkles className="w-4.5 h-4.5" />
                        </div>
                        <div>
                          <div className="text-xs font-bold text-gray-900">
                            Need {remainingCredits} more ECTS for {meta.label}
                          </div>
                          <p className="text-[11px] text-gray-500 mt-0.5">
                            Search matching subjects in the catalog to schedule this degree requirement.
                          </p>
                        </div>
                      </div>

                      <Link
                        to="/courses"
                        className="btn-primary text-xs py-2 px-3.5 flex items-center justify-center gap-1.5 rounded-xl self-start sm:self-auto shadow-2xs active:scale-[0.99] font-semibold"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        Browse Catalog
                      </Link>
                    </div>
                  )}

                  {isComplete && entries.length === 0 && (
                    <div className="p-3.5 bg-emerald-50 text-emerald-800 text-xs rounded-xl flex items-center gap-2 border border-emerald-200 font-medium">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      <span>This requirement is fully satisfied.</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default Checklist;
