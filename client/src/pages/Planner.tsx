import React, { useState, useMemo } from 'react';
import {
  DndContext,
  DragOverlay,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragStartEvent,
  DragEndEvent,
  useDroppable,
} from '@dnd-kit/core';
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
  sortableKeyboardCoordinates,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useAppContext } from '@/context/AppContext';
import {
  PlanEntryWithCourse,
  CATEGORY_META,
  STATUS_META,
} from '@/types';
import {
  GripVertical,
  X,
  AlertTriangle,
  GraduationCap,
  Inbox,
  Sparkles,
  CheckCircle2,
  Calendar,
} from 'lucide-react';

type ColumnKey =
  | 'y1_q1'
  | 'y1_q2'
  | 'y1_q3'
  | 'y1_q4'
  | 'y2_q1'
  | 'y2_q2'
  | 'unassigned';

interface ColumnConfig {
  key: ColumnKey;
  label: string;
  sublabel: string;
  quarterCode: string;
  year: number | null;
  quarter: number | null;
}

const YEAR1_COLUMNS: ColumnConfig[] = [
  { key: 'y1_q1', label: 'Quarter 1', sublabel: 'Fall (Sept - Nov)', quarterCode: 'Q1', year: 1, quarter: 1 },
  { key: 'y1_q2', label: 'Quarter 2', sublabel: 'Winter (Nov - Feb)', quarterCode: 'Q2', year: 1, quarter: 2 },
  { key: 'y1_q3', label: 'Quarter 3', sublabel: 'Spring (Feb - Apr)', quarterCode: 'Q3', year: 1, quarter: 3 },
  { key: 'y1_q4', label: 'Quarter 4', sublabel: 'Summer (Apr - Jul)', quarterCode: 'Q4', year: 1, quarter: 4 },
];

const YEAR2_COLUMNS: ColumnConfig[] = [
  { key: 'y2_q1', label: 'Quarter 1', sublabel: 'Fall (Sept - Nov)', quarterCode: 'Q1', year: 2, quarter: 1 },
  { key: 'y2_q2', label: 'Quarter 2', sublabel: 'Winter (Nov - Feb)', quarterCode: 'Q2', year: 2, quarter: 2 },
];

const UNASSIGNED_CONFIG: ColumnConfig = {
  key: 'unassigned',
  label: 'Unassigned Pool',
  sublabel: 'Courses awaiting term placement',
  quarterCode: 'POOL',
  year: null,
  quarter: null,
};

// --- Draggable Course Card Component ---
interface CourseCardProps {
  entry: PlanEntryWithCourse;
  onRemove: (id: number) => void;
  isOverlay?: boolean;
}

const CourseCard: React.FC<CourseCardProps> = ({ entry, onRemove, isOverlay = false }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: `item:${entry.id}`,
    data: { entry },
  });

  const style: React.CSSProperties = {
    transform: CSS.Translate.toString(transform),
    transition,
    opacity: isDragging ? 0.35 : 1,
  };

  const catMeta = CATEGORY_META[entry.category];
  const statusMeta = STATUS_META[entry.status];

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`group bg-white border rounded-xl p-3 shadow-xs hover:shadow-md transition-all ${
        isOverlay
          ? 'shadow-2xl border-tue-red ring-2 ring-tue-red/30 rotate-1 scale-102 cursor-grabbing bg-white/95 backdrop-blur-sm z-50'
          : 'border-slate-200/90 hover:border-slate-300'
      }`}
    >
      <div className="flex items-start justify-between gap-1.5">
        <div className="flex items-center gap-1.5 flex-1 min-w-0">
          <button
            {...attributes}
            {...listeners}
            className="text-slate-300 group-hover:text-slate-500 cursor-grab active:cursor-grabbing p-0.5 -ml-1 rounded hover:bg-slate-100 transition-colors"
            title="Drag to reorder"
            type="button"
          >
            <GripVertical className="w-3.5 h-3.5" />
          </button>
          <span className="font-mono font-bold text-xs text-slate-900 truncate">
            {entry.course?.code}
          </span>
        </div>

        <div className="flex items-center gap-1.5 flex-shrink-0">
          <span
            className="w-2 h-2 rounded-full flex-shrink-0"
            style={{ backgroundColor: catMeta?.color }}
            title={catMeta?.label}
          />
          <span className="text-[11px] font-mono font-semibold text-slate-700 bg-slate-100 border border-slate-200/60 px-1.5 py-0.5 rounded-md">
            {entry.course?.credits} ECTS
          </span>
          <button
            onClick={() => onRemove(entry.id)}
            className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-red-600 p-0.5 rounded transition-all"
            title="Remove from plan"
            type="button"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      <div className="pl-4 mt-1.5">
        <h5 className="text-xs font-semibold text-slate-800 line-clamp-1 leading-snug">
          {entry.course?.name}
        </h5>
        <div className="flex items-center justify-between text-[10px] text-slate-400 mt-1.5">
          <span className="truncate font-medium">{catMeta?.label}</span>
          <span
            className="inline-flex items-center gap-1 text-[10px] text-slate-500 font-medium"
            title={statusMeta?.label}
          >
            <span>{statusMeta?.icon}</span>
            <span>{statusMeta?.label}</span>
          </span>
        </div>
      </div>
    </div>
  );
};

// --- Droppable Column Component ---
interface QuarterColumnProps {
  config: ColumnConfig;
  entries: PlanEntryWithCourse[];
  onRemove: (id: number) => void;
}

const QuarterColumn: React.FC<QuarterColumnProps> = ({ config, entries, onRemove }) => {
  const { setNodeRef, isOver } = useDroppable({
    id: `col:${config.key}`,
    data: { config },
  });

  const totalCredits = entries.reduce(
    (sum, entry) => sum + (entry.course?.credits || 0),
    0
  );
  const isOverloaded = totalCredits > 20;
  const isOptimal = totalCredits >= 15 && totalCredits <= 20;
  const loadPercentage = Math.min(100, Math.round((totalCredits / 20) * 100));

  const itemIds = entries.map((e) => `item:${e.id}`);

  return (
    <div
      ref={setNodeRef}
      className={`flex flex-col h-full rounded-2xl border transition-all duration-150 ${
        isOver
          ? 'bg-red-50/50 border-tue-red/70 ring-4 ring-tue-red/15 shadow-md'
          : 'bg-slate-50/70 border-slate-200/90 shadow-2xs hover:border-slate-300'
      }`}
    >
      {/* Prominent Column Header */}
      <div className="p-3.5 border-b border-slate-200/80 bg-white/70 backdrop-blur-xs rounded-t-2xl flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="w-7 h-7 rounded-lg bg-slate-100 border border-slate-200/80 text-slate-700 font-mono font-bold text-xs flex items-center justify-center">
            {config.quarterCode}
          </span>
          <div>
            <h4 className="font-bold text-slate-900 text-xs tracking-tight">
              {config.label}
            </h4>
            <span className="text-[10px] text-slate-400 font-medium block">
              {config.sublabel}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <span className="text-[11px] font-mono font-semibold px-2 py-0.5 rounded-full bg-slate-100 border border-slate-200/70 text-slate-700">
            {entries.length}
          </span>
        </div>
      </div>

      {/* Sortable Drop Area */}
      <div className="flex-1 p-2.5 space-y-2 min-h-[160px] overflow-y-auto">
        <SortableContext items={itemIds} strategy={verticalListSortingStrategy}>
          {entries.map((entry) => (
            <CourseCard key={entry.id} entry={entry} onRemove={onRemove} />
          ))}
        </SortableContext>
        {entries.length === 0 && (
          <div className="h-full min-h-[130px] flex flex-col items-center justify-center border-2 border-dashed border-slate-200 rounded-xl p-4 text-center group">
            <Calendar className="w-5 h-5 text-slate-300 mb-1" />
            <span className="text-xs font-medium text-slate-400">Drop courses here</span>
            <span className="text-[10px] text-slate-300 mt-0.5">Target: ~15 ECTS</span>
          </div>
        )}
      </div>

      {/* Column Footer: Credit counter (Showing max 20 ECTS limit) */}
      <div
        className={`p-3 border-t text-xs rounded-b-2xl flex flex-col gap-1.5 transition-colors ${
          isOverloaded
            ? 'bg-red-50/90 border-red-200 text-red-800'
            : isOptimal
            ? 'bg-emerald-50/80 border-emerald-200 text-emerald-800'
            : 'bg-white border-slate-200/80 text-slate-600'
        }`}
      >
        <div className="flex items-center justify-between">
          <span className="flex items-center gap-1.5 font-medium text-[11px]">
            {isOverloaded ? (
              <span className="flex items-center gap-1 text-red-700 font-bold">
                <AlertTriangle className="w-3.5 h-3.5" />
                Overloaded
              </span>
            ) : isOptimal ? (
              <span className="flex items-center gap-1 text-emerald-700 font-bold">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Target Load
              </span>
            ) : (
              <span>Total Load:</span>
            )}
          </span>

          {/* Corrected limit to 20 ECTS */}
          <span className="font-extrabold font-mono text-xs">
            {totalCredits}{' '}
            <span className="font-medium text-[10px] opacity-75">/ 20 ECTS</span>
          </span>
        </div>

        {/* Mini progress bar towards 20 ECTS */}
        <div className="w-full bg-black/5 rounded-full h-1 overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-300 ${
              isOverloaded
                ? 'bg-red-600'
                : isOptimal
                ? 'bg-emerald-600'
                : 'bg-slate-400'
            }`}
            style={{ width: `${loadPercentage}%` }}
          />
        </div>
      </div>
    </div>
  );
};

// --- Main Planner Page ---
const Planner: React.FC = () => {
  const { plan, updatePlanEntry, removePlanEntry, reorderPlan } = useAppContext();
  const [activeEntry, setActiveEntry] = useState<PlanEntryWithCourse | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Filter graduation entries vs draggable entries
  const graduationEntries = useMemo(
    () => plan.filter((e) => e.category === 'graduation' || e.course?.course_type === 'graduation'),
    [plan]
  );

  const draggableEntries = useMemo(
    () => plan.filter((e) => e.category !== 'graduation' && e.course?.course_type !== 'graduation'),
    [plan]
  );

  // Group draggable entries into columns
  const columnData = useMemo(() => {
    const map: Record<ColumnKey, PlanEntryWithCourse[]> = {
      y1_q1: [],
      y1_q2: [],
      y1_q3: [],
      y1_q4: [],
      y2_q1: [],
      y2_q2: [],
      unassigned: [],
    };

    draggableEntries.forEach((entry) => {
      if (entry.year === 1) {
        if (entry.quarter === 1) map.y1_q1.push(entry);
        else if (entry.quarter === 2) map.y1_q2.push(entry);
        else if (entry.quarter === 3) map.y1_q3.push(entry);
        else if (entry.quarter === 4) map.y1_q4.push(entry);
        else map.unassigned.push(entry);
      } else if (entry.year === 2) {
        if (entry.quarter === 1) map.y2_q1.push(entry);
        else if (entry.quarter === 2) map.y2_q2.push(entry);
        else map.unassigned.push(entry);
      } else {
        map.unassigned.push(entry);
      }
    });

    // Sort entries within each column by sort_order
    Object.keys(map).forEach((key) => {
      map[key as ColumnKey].sort((a, b) => a.sort_order - b.sort_order);
    });

    return map;
  }, [draggableEntries]);

  // Helper to find which column an item currently belongs to
  const findColumnOfItem = (itemIdString: string): ColumnKey | null => {
    const id = Number(itemIdString.replace('item:', ''));
    for (const key of Object.keys(columnData) as ColumnKey[]) {
      if (columnData[key].some((e) => e.id === id)) {
        return key;
      }
    }
    return null;
  };

  const handleDragStart = (event: DragStartEvent) => {
    const id = Number(String(event.active.id).replace('item:', ''));
    const entry = plan.find((e) => e.id === id);
    if (entry) {
      setActiveEntry(entry);
    }
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveEntry(null);

    if (!over) return;

    const activeIdStr = String(active.id);
    const overIdStr = String(over.id);

    const sourceCol = findColumnOfItem(activeIdStr);
    if (!sourceCol) return;

    let targetCol: ColumnKey | null = null;

    if (overIdStr.startsWith('col:')) {
      targetCol = overIdStr.replace('col:', '') as ColumnKey;
    } else if (overIdStr.startsWith('item:')) {
      targetCol = findColumnOfItem(overIdStr);
    }

    if (!targetCol) return;

    const activeCourseId = Number(activeIdStr.replace('item:', ''));

    // Determine target year & quarter based on targetCol
    let newYear: number | null = null;
    let newQuarter: number | null = null;

    if (targetCol === 'y1_q1') { newYear = 1; newQuarter = 1; }
    else if (targetCol === 'y1_q2') { newYear = 1; newQuarter = 2; }
    else if (targetCol === 'y1_q3') { newYear = 1; newQuarter = 3; }
    else if (targetCol === 'y1_q4') { newYear = 1; newQuarter = 4; }
    else if (targetCol === 'y2_q1') { newYear = 2; newQuarter = 1; }
    else if (targetCol === 'y2_q2') { newYear = 2; newQuarter = 2; }
    else { newYear = null; newQuarter = null; }

    const targetList = [...columnData[targetCol]];

    // If moved to a different column or reordered in same column
    if (sourceCol !== targetCol) {
      // Find insert position
      let insertIndex = targetList.length;
      if (overIdStr.startsWith('item:')) {
        const overCourseId = Number(overIdStr.replace('item:', ''));
        const idx = targetList.findIndex((e) => e.id === overCourseId);
        if (idx !== -1) insertIndex = idx;
      }

      const activeItem = plan.find((e) => e.id === activeCourseId);
      if (!activeItem) return;

      targetList.splice(insertIndex, 0, activeItem);

      // Build reorder batch
      const reorderPayload = targetList.map((entry, index) => ({
        id: entry.id,
        sort_order: index,
        year: newYear,
        quarter: newQuarter,
      }));

      try {
        await updatePlanEntry(activeCourseId, {
          year: newYear,
          quarter: newQuarter,
          sort_order: insertIndex,
        });
        await reorderPlan(reorderPayload);
      } catch (err) {
        console.error('Failed to move course:', err);
      }
    } else {
      // Reordering in the same column
      if (overIdStr.startsWith('item:')) {
        const oldIndex = targetList.findIndex((e) => e.id === activeCourseId);
        const overCourseId = Number(overIdStr.replace('item:', ''));
        const newIndex = targetList.findIndex((e) => e.id === overCourseId);

        if (oldIndex !== -1 && newIndex !== -1 && oldIndex !== newIndex) {
          const [movedItem] = targetList.splice(oldIndex, 1);
          targetList.splice(newIndex, 0, movedItem);

          const reorderPayload = targetList.map((entry, index) => ({
            id: entry.id,
            sort_order: index,
            year: newYear,
            quarter: newQuarter,
          }));

          try {
            await reorderPlan(reorderPayload);
          } catch (err) {
            console.error('Failed to reorder courses:', err);
          }
        }
      }
    }
  };

  const handleRemove = async (id: number) => {
    try {
      await removePlanEntry(id);
    } catch (err) {
      console.error('Failed to remove course:', err);
    }
  };

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200/90">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-red-50 text-tue-red border border-red-100 shadow-2xs">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">
              Interactive Quarter Planner
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Drag and drop courses between academic quarters. Aim for 15 ECTS per quarter (maximum allowed: 20 ECTS).
            </p>
          </div>
        </div>
      </div>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        {/* YEAR 1 SECTION */}
        <div className="space-y-3.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <span className="w-7 h-7 rounded-lg bg-gradient-to-br from-tue-red to-tue-red-dark text-white flex items-center justify-center text-xs font-bold font-mono shadow-xs">
                Y1
              </span>
              <h3 className="font-bold text-slate-900 text-base tracking-tight">
                Year 1 — Core Courses & Electives
              </h3>
            </div>
            <span className="text-xs text-slate-400 font-semibold font-mono">
              4 Quarters · 60 ECTS Target
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {YEAR1_COLUMNS.map((col) => (
              <QuarterColumn
                key={col.key}
                config={col}
                entries={columnData[col.key]}
                onRemove={handleRemove}
              />
            ))}
          </div>
        </div>

        {/* YEAR 2 SECTION + GRADUATION PHASE */}
        <div className="space-y-3.5 pt-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <span className="w-7 h-7 rounded-lg bg-slate-900 text-white flex items-center justify-center text-xs font-bold font-mono shadow-xs">
                Y2
              </span>
              <h3 className="font-bold text-slate-900 text-base tracking-tight">
                Year 2 — Seminars & Graduation Phase
              </h3>
            </div>
            <span className="text-xs text-slate-400 font-semibold font-mono">
              60 ECTS Target
            </span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
            {/* Year 2 Quarter 1 & Quarter 2 (6 columns) */}
            <div className="lg:col-span-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
              {YEAR2_COLUMNS.map((col) => (
                <QuarterColumn
                  key={col.key}
                  config={col}
                  entries={columnData[col.key]}
                  onRemove={handleRemove}
                />
              ))}
            </div>

            {/* Premium Graduation Phase Display Panel (6 columns) */}
            <div className="lg:col-span-6 rounded-2xl border border-red-200/90 bg-gradient-to-br from-red-50/50 via-white to-amber-50/30 p-5 flex flex-col justify-between shadow-2xs">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2.5">
                    <div className="p-1.5 rounded-lg bg-red-100/70 text-tue-red">
                      <GraduationCap className="w-5 h-5" />
                    </div>
                    <h4 className="font-bold text-slate-900 text-sm tracking-tight">
                      Graduation Phase (Semesters 3 & 4)
                    </h4>
                  </div>
                  <span className="badge bg-red-100/90 text-tue-red font-bold font-mono text-xs border border-red-200">
                    40 ECTS Total
                  </span>
                </div>
                <p className="text-xs text-slate-500 mb-3.5 leading-relaxed">
                  Fixed degree milestone components. These are mandatory non-draggable graduation requirements.
                </p>

                <div className="space-y-2.5">
                  {graduationEntries.length > 0 ? (
                    graduationEntries.map((entry) => (
                      <div
                        key={entry.id}
                        className="bg-white border border-slate-200/90 rounded-xl p-3.5 flex items-center justify-between shadow-xs hover:border-slate-300 transition-all"
                      >
                        <div className="flex items-center gap-3">
                          <span className="w-2.5 h-2.5 rounded-full bg-red-500 flex-shrink-0" />
                          <div>
                            <div className="font-mono font-bold text-xs text-slate-900">
                              {entry.course?.code}
                            </div>
                            <div className="text-xs font-semibold text-slate-700">
                              {entry.course?.name}
                            </div>
                          </div>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <span className="badge bg-slate-100 border border-slate-200/60 text-slate-800 font-mono font-bold text-xs">
                            {entry.course?.credits} ECTS
                          </span>
                          <span className="block text-[10px] text-slate-400 mt-0.5 font-medium">
                            {STATUS_META[entry.status]?.label}
                          </span>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="p-4 bg-white/90 rounded-xl border border-dashed border-red-200 text-xs text-slate-500 italic text-center">
                      Graduation components (2IMC05 Preparation 10 ECTS, 2IMC00 Master Project 30 ECTS) will appear here once added to your plan.
                    </div>
                  )}
                </div>
              </div>

              <div className="mt-4 pt-3.5 border-t border-red-100 flex items-center justify-between text-xs text-slate-500 font-medium">
                <span>Includes SCOP/e Professional Orientation (2IMR10)</span>
                <span className="font-semibold text-tue-red">Semesters 3 & 4</span>
              </div>
            </div>
          </div>
        </div>

        {/* UNASSIGNED POOL */}
        <div className="pt-4">
          <div className="card bg-slate-50/60 border-dashed border-slate-300 p-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-3.5 gap-2">
              <div className="flex items-center gap-2.5">
                <div className="p-1.5 rounded-lg bg-slate-200/70 text-slate-600">
                  <Inbox className="w-4 h-4" />
                </div>
                <h4 className="font-bold text-slate-800 text-sm tracking-tight">
                  Unassigned Courses Pool
                </h4>
                <span className="badge bg-slate-200 border border-slate-300 text-slate-700 text-xs font-mono font-bold">
                  {columnData.unassigned.length}
                </span>
              </div>
              <p className="text-xs text-slate-400 hidden sm:block">
                Drag courses into any quarter above when you decide your scheduling.
              </p>
            </div>

            <QuarterColumn
              config={UNASSIGNED_CONFIG}
              entries={columnData.unassigned}
              onRemove={handleRemove}
            />
          </div>
        </div>

        {/* Drag Overlay for smooth preview while dragging */}
        <DragOverlay>
          {activeEntry ? (
            <CourseCard entry={activeEntry} onRemove={() => {}} isOverlay />
          ) : null}
        </DragOverlay>
      </DndContext>
    </div>
  );
};

export default Planner;
