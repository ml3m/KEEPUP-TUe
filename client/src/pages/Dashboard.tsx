import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
} from 'recharts';
import {
  CATEGORY_META,
  PlanCategory,
  STATUS_META,
  CourseStatus,
  FOCUS_AREA_META,
} from '@/types';
import { useAppContext } from '@/context/AppContext';
import {
  AlertTriangle,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Calendar,
  BookOpen,
  ArrowRight,
  Sparkles,
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

interface ChartSegment {
  name: string;
  category: PlanCategory;
  credits: number;
  color: string;
  isFilled: boolean;
}

// Custom Recharts Tooltip with dark background, crisp white text & tabular numbers
interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{
    payload: ChartSegment;
  }>;
}

const CustomTooltip: React.FC<CustomTooltipProps> = ({ active, payload }) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    const meta = CATEGORY_META[data.category];

    return (
      <div className="bg-slate-800/95 backdrop-blur-md border border-slate-700/80 rounded-xl p-3.5 shadow-2xl text-white min-w-[180px] pointer-events-none select-none">
        <div className="flex items-center gap-2 mb-2">
          <span
            className="w-2.5 h-2.5 rounded-full shrink-0"
            style={{ backgroundColor: data.color }}
          />
          <span className="text-xs font-semibold text-white tracking-tight">
            {meta?.label || data.name}
          </span>
        </div>

        <div className="flex items-baseline justify-between gap-3 text-xs mb-1.5">
          <span className="text-slate-300 font-medium">
            {data.isFilled ? 'Scheduled:' : 'Remaining:'}
          </span>
          <span className="font-bold text-xs text-white tabular-nums">
            {data.credits} ECTS
          </span>
        </div>

        <div className="flex items-center justify-between text-xs text-slate-300 pt-2 border-t border-slate-700/60 font-medium">
          <span>Target Requirement</span>
          <span className="text-white tabular-nums font-semibold">
            {meta?.targetCredits} ECTS
          </span>
        </div>
      </div>
    );
  }
  return null;
};

const Dashboard: React.FC = () => {
  const { plan, validation, settings, updatePlanEntry } = useAppContext();
  const [isValidationExpanded, setIsValidationExpanded] = useState<boolean>(false);

  // Calculate credits per category
  const categoryCredits = CATEGORIES.reduce((acc, cat) => {
    const credits = plan
      .filter((entry) => entry.category === cat)
      .reduce((sum, entry) => sum + (entry.course?.credits || 0), 0);
    acc[cat] = credits;
    return acc;
  }, {} as Record<PlanCategory, number>);

  const totalCredits = Object.values(categoryCredits).reduce((a, b) => a + b, 0);

  // Prepare Pie Chart data: Two segments per category (filled & remaining)
  const chartData: ChartSegment[] = [];

  CATEGORIES.forEach((cat) => {
    const filled = categoryCredits[cat] || 0;
    const target = CATEGORY_META[cat].targetCredits;
    const remaining = Math.max(0, target - filled);
    const baseColor = CATEGORY_META[cat].color;

    if (filled > 0) {
      chartData.push({
        name: `${CATEGORY_META[cat].label} (Filled)`,
        category: cat,
        credits: filled,
        color: baseColor,
        isFilled: true,
      });
    }

    if (remaining > 0) {
      chartData.push({
        name: `${CATEGORY_META[cat].label} (Remaining)`,
        category: cat,
        credits: remaining,
        // 20% opacity for clean faded contrast
        color: `${baseColor}33`,
        isFilled: false,
      });
    }
  });

  // Current Quarter spotlight: Year 1, Quarter 1
  const currentQuarterCourses = plan.filter(
    (entry) => entry.year === 1 && entry.quarter === 1
  );
  const currentQuarterCredits = currentQuarterCourses.reduce(
    (sum, entry) => sum + (entry.course?.credits || 0),
    0
  );

  // Quick status toggle
  const handleStatusChange = async (entryId: number, newStatus: CourseStatus) => {
    try {
      await updatePlanEntry(entryId, { status: newStatus });
    } catch (err) {
      console.error('Failed to change status:', err);
    }
  };

  // Determine open degree requirements
  const openRequirements = validation?.rules?.filter((r) => r.status !== 'pass') || [];
  const openCount = openRequirements.length;
  const isPlanComplete = validation?.overall_status === 'pass';

  // Banner colors: warm amber for in-progress audit, emerald for fully satisfied
  const bannerBg = isPlanComplete
    ? 'bg-emerald-50/80 border-emerald-200 text-emerald-950'
    : 'bg-amber-50/80 border-amber-200/80 text-amber-950';

  const bannerIcon = isPlanComplete ? (
    <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
  ) : (
    <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />
  );

  return (
    <div className="space-y-6">
      {/* 1. Degree Audit Summary Banner — Clean Two-Line Block, Amber/Neutral semantics */}
      <div className={`rounded-xl border p-5 transition-all shadow-sm ${bannerBg}`}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start sm:items-center gap-3.5 min-w-0">
            <div className="p-2 rounded-lg bg-white/80 shadow-xs border border-current/10 shrink-0">
              {bannerIcon}
            </div>
            <div className="min-w-0">
              {/* Line 1: Title and Badges */}
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="font-bold text-sm tracking-tight">
                  {isPlanComplete
                    ? 'Degree Audit: All Requirements Fulfilled'
                    : `Degree Audit: ${openCount} ${openCount === 1 ? 'requirement' : 'requirements'} still open`}
                </h3>
                {settings?.specialization_area && (
                  <span className="badge bg-purple-50 text-purple-700 border border-purple-200/80 text-xs font-semibold">
                    Track: {FOCUS_AREA_META[settings.specialization_area]?.shortLabel}
                  </span>
                )}
              </div>
              {/* Line 2: Informative Subtitle */}
              <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                {isPlanComplete
                  ? 'All curriculum requirements and credit minimums are satisfied by your plan.'
                  : 'Review your course distribution and prerequisites below to complete your CSE degree plan.'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 self-end sm:self-auto shrink-0">
            <Link
              to="/checklist"
              className="text-xs font-semibold flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/90 hover:bg-white border border-current/10 shadow-xs transition-all"
            >
              Full Checklist <ArrowRight className="w-3.5 h-3.5" />
            </Link>
            <button
              onClick={() => setIsValidationExpanded(!isValidationExpanded)}
              className="p-1.5 rounded-lg hover:bg-black/5 text-current transition-colors"
              aria-label="Toggle validation rules details"
            >
              {isValidationExpanded ? (
                <ChevronUp className="w-4 h-4" />
              ) : (
                <ChevronDown className="w-4 h-4" />
              )}
            </button>
          </div>
        </div>

        {/* Expanded Rule List */}
        {isValidationExpanded && validation?.rules && (
          <div className="mt-4 pt-4 border-t border-current/10 space-y-2.5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
              {validation.rules.map((rule) => {
                const ruleBg =
                  rule.status === 'pass'
                    ? 'bg-emerald-50/90 text-emerald-950 border-emerald-200/80'
                    : rule.status === 'warning'
                    ? 'bg-amber-50/90 text-amber-950 border-amber-200/80'
                    : 'bg-red-50/90 text-red-950 border-red-200/80';
                return (
                  <div
                    key={rule.id}
                    className={`p-3 rounded-lg border text-xs flex items-start gap-2.5 shadow-xs ${ruleBg}`}
                  >
                    <span className="mt-0.5 text-xs shrink-0">
                      {rule.status === 'pass' ? '✅' : rule.status === 'warning' ? '⚠️' : '❌'}
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-xs">{rule.name}</div>
                      <div className="text-xs opacity-90 mt-0.5 leading-snug">{rule.message}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* 2. Main Grid: Donut Chart + Category Breakdown */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
        {/* Left: Donut Chart Overview (5 cols on xl, full width when stacked) */}
        <div className="xl:col-span-5 bg-white rounded-xl border border-slate-200/80 p-5 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-1">
              <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-tue-red" />
                ECTS Distribution
              </h3>
              <span className="text-xs font-medium text-slate-500 tabular-nums">
                Target: 120 ECTS
              </span>
            </div>
            <p className="text-xs text-slate-500 mb-2">
              Solid segments represent scheduled courses; transparent segments show remaining credits.
            </p>
          </div>

          {/* Donut Chart Container with Center Overlay Behind Tooltip */}
          <div className="relative w-full h-64 flex items-center justify-center my-2 select-none">
            {/* Center Text Overlay (Rendered at z-0, behind Recharts Tooltip) */}
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none select-none z-0">
              <span className="text-3xl font-bold text-slate-900 tracking-tight tabular-nums">
                {totalCredits}
              </span>
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                / 120 ECTS
              </span>
              <div className="mt-1 px-2.5 py-0.5 rounded-full bg-slate-100 border border-slate-200 text-xs font-semibold text-slate-600 tabular-nums">
                {Math.round((totalCredits / 120) * 100)}% Complete
              </div>
            </div>

            {/* ResponsiveContainer layer with Tooltip at z-1000 */}
            <div className="relative z-10 w-full h-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={chartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={72}
                    outerRadius={104}
                    paddingAngle={1.5}
                    dataKey="credits"
                    animationDuration={600}
                    animationEasing="ease-out"
                  >
                    {chartData.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={entry.color}
                        stroke={entry.isFilled ? '#ffffff' : 'transparent'}
                        strokeWidth={1.5}
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    content={<CustomTooltip />}
                    wrapperStyle={{ zIndex: 1000, pointerEvents: 'none' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* 2-Column Legend with Full Category Names and Aligned Counts */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2 pt-4 border-t border-slate-100 text-xs">
            {CATEGORIES.map((cat) => {
              const meta = CATEGORY_META[cat];
              const filled = categoryCredits[cat] || 0;
              return (
                <div
                  key={cat}
                  className="flex items-center justify-between gap-3 py-1 px-1 rounded-md hover:bg-slate-50 transition-colors min-w-0"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span
                      className="w-2.5 h-2.5 rounded-full shrink-0"
                      style={{ backgroundColor: meta.color }}
                    />
                    <span className="text-slate-700 font-medium text-xs whitespace-nowrap">
                      {meta.label}
                    </span>
                  </div>
                  <span className="text-xs tabular-nums text-slate-500 font-medium shrink-0 ml-1">
                    {filled}/{meta.targetCredits}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right: Grid of 6 Category Progress Cards (7 cols on xl, 2 cols on lg, 1 col on mobile/tablet) */}
        <div className="xl:col-span-7 grid grid-cols-1 lg:grid-cols-2 gap-4">
          {CATEGORIES.map((catKey) => {
            const meta = CATEGORY_META[catKey];
            const filled = categoryCredits[catKey] || 0;
            const target = meta.targetCredits;
            const percentage = Math.min(100, Math.round((filled / target) * 100));
            const count = plan.filter((e) => e.category === catKey).length;
            const isComplete = filled >= target;
            const isEmpty = filled === 0;

            return (
              <div
                key={catKey}
                className={`bg-white rounded-xl border p-5 shadow-sm transition-all duration-200 group flex flex-col justify-between ${
                  isEmpty
                    ? 'border-slate-200/70 bg-slate-50/30'
                    : 'border-slate-200/80 hover:border-slate-300 hover:shadow-md'
                }`}
              >
                <div>
                  {/* Category Header Row: Fixed 24px height ensures baseline alignment across grid */}
                  <div className="h-6 flex items-center justify-between gap-2 min-w-0">
                    <span className="text-xs font-semibold tracking-wider text-slate-700 uppercase flex items-center gap-2 truncate">
                      <span
                        className="w-2.5 h-2.5 rounded-full shrink-0"
                        style={{ backgroundColor: meta.color }}
                      />
                      {meta.label}
                    </span>
                    {isComplete ? (
                      <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200/80 px-2 py-0.5 rounded-md shrink-0">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Met
                      </span>
                    ) : (
                      <span className="text-xs text-slate-500 tabular-nums shrink-0">
                        {target - filled} ECTS left
                      </span>
                    )}
                  </div>

                  {/* Big Number and Percentage */}
                  <div className="mt-3 flex items-baseline justify-between">
                    <div className={`text-2xl font-bold tracking-tight tabular-nums ${isEmpty ? 'text-slate-500' : 'text-slate-900'}`}>
                      {filled}{' '}
                      <span className="text-xs font-normal text-slate-500">
                        / {target} ECTS
                      </span>
                    </div>
                    <span className="text-xs font-semibold text-slate-600 tabular-nums">
                      {percentage}%
                    </span>
                  </div>

                  {/* Progress Bar with Category Color Accent */}
                  <div className="w-full bg-slate-100 rounded-full h-2 mt-2.5 overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${percentage}%`,
                        backgroundColor: meta.color,
                      }}
                    />
                  </div>
                </div>

                {/* Footer directly below progress bar separated by divider */}
                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                  <span className="tabular-nums">
                    {count} {count === 1 ? 'course' : 'courses'} scheduled
                  </span>
                  <Link
                    to="/checklist"
                    className="text-slate-600 hover:text-tue-red font-medium flex items-center gap-1 transition-colors"
                  >
                    View <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 3. Current Quarter Spotlight (Y1Q1) */}
      <div className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-100 gap-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-red-50 border border-red-100 text-tue-red flex items-center justify-center font-bold text-xs shrink-0">
              Y1Q1
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-sm">
                Current Quarter Spotlight — Year 1, Quarter 1
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Manage your active courses, grades, and progression for the upcoming term.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2.5">
            <span
              className={`badge text-xs tabular-nums font-semibold ${
                currentQuarterCredits > 20
                  ? 'bg-red-100 text-red-700 border border-red-200'
                  : currentQuarterCredits >= 15
                  ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                  : 'bg-slate-100 text-slate-700 border border-slate-200/70'
              }`}
            >
              Quarter Load: {currentQuarterCredits} / 20 ECTS
            </span>
            <Link
              to="/planner"
              className="btn-secondary text-xs flex items-center gap-1.5 py-1.5 px-3"
            >
              <Calendar className="w-3.5 h-3.5 text-slate-500" />
              Open Planner
            </Link>
          </div>
        </div>

        {currentQuarterCourses.length === 0 ? (
          <div className="py-12 text-center space-y-3.5 max-w-md mx-auto">
            <div className="w-12 h-12 rounded-xl bg-red-50 text-tue-red flex items-center justify-center mx-auto border border-red-100">
              <Layers className="w-6 h-6 text-tue-red" />
            </div>
            <div>
              <h4 className="font-bold text-slate-800 text-sm">
                No Courses Scheduled for Quarter 1
              </h4>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                Start structuring your degree by browsing courses from the catalog or placing planned courses into Year 1, Quarter 1 in the Planner.
              </p>
            </div>
            <div className="flex justify-center gap-3 pt-2">
              <Link to="/courses" className="btn-primary text-xs flex items-center gap-1.5">
                <BookOpen className="w-3.5 h-3.5" />
                Browse Catalog
              </Link>
              <Link to="/planner" className="btn-secondary text-xs flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5" />
                Open Planner
              </Link>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 mt-5">
            {currentQuarterCourses.map((entry) => {
              const catMeta = CATEGORY_META[entry.category];

              return (
                <div
                  key={entry.id}
                  className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-sm hover:border-slate-300 hover:shadow-md transition-all flex flex-col justify-between"
                >
                  <div>
                    {/* Course Code and Credits Badge */}
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-semibold text-slate-900 text-sm tracking-tight">
                        {entry.course?.code}
                      </span>
                      <div className="flex items-center gap-1.5">
                        <span
                          className="w-2 h-2 rounded-full shrink-0"
                          style={{ backgroundColor: catMeta?.color }}
                        />
                        <span className="badge bg-slate-100 border border-slate-200/70 text-slate-700 text-xs tabular-nums">
                          {entry.course?.credits} ECTS
                        </span>
                      </div>
                    </div>

                    {/* Course Title */}
                    <h4 className="font-medium text-slate-900 text-sm mt-1.5 line-clamp-1">
                      {entry.course?.name}
                    </h4>

                    {/* Category Label and Optional Grade */}
                    <div className="text-xs text-slate-500 mt-1 flex items-center gap-2">
                      <span className="font-medium">{catMeta?.label}</span>
                      {entry.grade !== null && (
                        <span className="badge bg-emerald-50 text-emerald-700 border border-emerald-200/70 font-semibold text-xs tabular-nums">
                          Grade: {entry.grade}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Clean Full-Width Segmented Status Control without duplicate label */}
                  <div className="mt-3.5 pt-3 border-t border-slate-100">
                    <div className="grid grid-cols-3 gap-1 bg-slate-100 p-1 rounded-lg w-full">
                      {(['planned', 'in_progress', 'passed'] as CourseStatus[]).map(
                        (st) => {
                          const isActive = entry.status === st;
                          return (
                            <button
                              key={st}
                              type="button"
                              onClick={() => handleStatusChange(entry.id, st)}
                              className={`py-1.5 px-2 rounded-md text-xs font-medium text-center transition-all ${
                                isActive
                                  ? 'bg-white text-slate-900 shadow-sm font-semibold'
                                  : 'text-slate-600 hover:text-slate-900'
                              }`}
                            >
                              {STATUS_META[st].label}
                            </button>
                          );
                        }
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
