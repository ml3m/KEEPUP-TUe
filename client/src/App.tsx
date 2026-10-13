import React, { useState } from 'react';
import { Routes, Route, NavLink, Navigate, useLocation } from 'react-router-dom';
import { AppProvider, useAppContext } from '@/context/AppContext';
import Dashboard from '@/pages/Dashboard';
import Planner from '@/pages/Planner';
import CoursesCatalog from '@/pages/CoursesCatalog';
import Checklist from '@/pages/Checklist';
import Summary from '@/pages/Summary';
import SettingsModal from '@/components/common/SettingsModal';
import { FOCUS_AREA_META } from '@/types';
import {
  LayoutDashboard,
  Calendar,
  BookOpen,
  CheckSquare,
  Table,
  Settings,
  GraduationCap,
  Sparkles,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  ChevronRight,
  Menu,
} from 'lucide-react';

const NavItems = [
  { path: '/', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/planner', label: 'Planner', icon: Calendar },
  { path: '/courses', label: 'Course Catalog', icon: BookOpen },
  { path: '/checklist', label: 'Checklist', icon: CheckSquare },
  { path: '/summary', label: 'Summary Table', icon: Table },
];

const LoadingSkeleton: React.FC = () => (
  <div className="space-y-6 animate-pulse">
    {/* Banner Skeleton */}
    <div className="h-20 bg-slate-200/70 rounded-2xl" />

    {/* Metric Cards Grid Skeleton */}
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
      <div className="h-44 bg-slate-200/60 rounded-2xl" />
      <div className="h-44 bg-slate-200/60 rounded-2xl" />
      <div className="h-44 bg-slate-200/60 rounded-2xl" />
    </div>

    {/* Content Skeleton */}
    <div className="h-80 bg-slate-200/50 rounded-2xl" />
  </div>
);

const MainLayout: React.FC = () => {
  const { settings, validation, plan, loading, error } = useAppContext();
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);
  const location = useLocation();

  const totalCredits = plan.reduce(
    (sum, entry) => sum + (entry.course?.credits || 0),
    0
  );
  const percentage = Math.min(100, Math.round((totalCredits / 120) * 100));

  const validationStatus = validation?.overall_status || 'warning';

  return (
    <div className="min-h-screen flex bg-slate-50/70 text-slate-900 font-sans antialiased">
      {/* Mobile backdrop */}
      {isMobileNavOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-xs md:hidden"
          onClick={() => setIsMobileNavOpen(false)}
        />
      )}

      {/* ── Premium Sidebar Navigation (w-64) ────────────────────── */}
      <aside
        className={`w-64 h-screen fixed left-0 top-0 flex flex-col justify-between bg-gradient-to-b from-white via-slate-50/75 to-slate-100/60 border-r border-slate-200/80 shadow-[1px_0_12px_rgba(0,0,0,0.02)] z-50 select-none transition-transform duration-200 ease-in-out md:translate-x-0 ${
          isMobileNavOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div>
          {/* Brand Header */}
          <div className="p-5 border-b border-slate-100/90 flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-tue-red to-tue-red-dark text-white flex items-center justify-center shadow-md shadow-red-600/20 font-black text-base ring-1 ring-white/20">
              K
            </div>
            <div>
              <h1 className="font-extrabold text-sm tracking-tight text-slate-900 flex items-center gap-1.5">
                KEEPUP
                <span className="text-[10px] font-bold text-tue-red bg-red-50 border border-red-200/70 px-1.5 py-0.2 rounded-md shadow-2xs">
                  TU/e
                </span>
              </h1>
              <p className="text-[11px] font-medium text-slate-400">
                CSE Master Study Planner
              </p>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="p-3 space-y-1.5">
            {NavItems.map((item) => {
              const Icon = item.icon;
              const isActive =
                item.path === '/'
                  ? location.pathname === '/' || location.pathname === '/dashboard'
                  : location.pathname.startsWith(item.path);

              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  onClick={() => setIsMobileNavOpen(false)}
                  className={`relative flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all group ${
                    isActive
                      ? 'bg-red-50/90 text-tue-red font-bold shadow-xs border border-red-100/80'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/80 border border-transparent'
                  }`}
                >
                  {/* Subtle active left pill indicator */}
                  {isActive && (
                    <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 bg-tue-red rounded-r-full" />
                  )}

                  <Icon
                    className={`w-4 h-4 transition-colors ${
                      isActive ? 'text-tue-red' : 'text-slate-400 group-hover:text-slate-600'
                    }`}
                  />
                  <span>{item.label}</span>
                </NavLink>
              );
            })}
          </nav>
        </div>

        {/* Mini Validation Status Panel with Card Depth */}
        <div className="p-4 border-t border-slate-200/60 bg-gradient-to-t from-slate-100/60 to-transparent">
          <NavLink
            to="/checklist"
            className="block p-3.5 rounded-2xl bg-white border border-slate-200/90 shadow-[0_2px_8px_rgba(0,0,0,0.03)] hover:shadow-md hover:border-slate-300 transition-all group"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Degree Audit
              </span>
              <span className="inline-flex items-center gap-1 text-xs font-semibold">
                {validationStatus === 'pass' ? (
                  <span className="inline-flex items-center gap-1 text-emerald-600">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span className="text-xs uppercase font-bold">Pass</span>
                  </span>
                ) : validationStatus === 'warning' ? (
                  <span className="inline-flex items-center gap-1 text-amber-600">
                    <AlertTriangle className="w-3.5 h-3.5" />
                    <span className="text-xs uppercase font-bold">Review</span>
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-amber-700">
                    <AlertTriangle className="w-3.5 h-3.5" />
                    <span className="text-xs uppercase font-bold">Open</span>
                  </span>
                )}
              </span>
            </div>

            <div className="flex items-baseline justify-between mb-1.5">
              <span className="tabular-nums font-bold text-sm text-slate-900">
                {totalCredits}{' '}
                <span className="text-xs font-normal text-slate-500">
                  / 120 ECTS
                </span>
              </span>
              <span className="text-xs font-semibold text-slate-700 tabular-nums">
                {percentage}%
              </span>
            </div>

            {/* Mini Progress Bar */}
            <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-tue-red to-tue-red-dark rounded-full transition-all duration-500"
                style={{ width: `${percentage}%` }}
              />
            </div>

            <div className="flex items-center justify-between text-xs text-slate-500 group-hover:text-tue-red mt-2.5 pt-2 border-t border-slate-100 font-medium transition-colors">
              <span>View requirements</span>
              <ChevronRight className="w-3.5 h-3.5 transform group-hover:translate-x-0.5 transition-transform" />
            </div>
          </NavLink>
        </div>
      </aside>

      {/* ── Main Workspace Area (ml-0 md:ml-64) ────────────────────────── */}
      <div className="ml-0 md:ml-64 flex-1 flex flex-col min-h-screen min-w-0">
        {/* Top Header Bar with Glassmorphism */}
        <header className="sticky top-0 z-20 bg-white/80 backdrop-blur-md border-b border-slate-200/80 px-4 sm:px-6 lg:px-8 py-3.5 flex items-center justify-between shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
          <div className="flex items-center gap-3">
            {/* Mobile Menu Hamburger */}
            <button
              onClick={() => setIsMobileNavOpen(true)}
              className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 md:hidden"
              aria-label="Open navigation menu"
            >
              <Menu className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-red-50 text-tue-red">
                <GraduationCap className="w-4 h-4" />
              </div>
              <span className="font-bold text-sm text-slate-800 tracking-tight">
                TU Eindhoven CSE Master
              </span>
            </div>
            {settings?.specialization_area && (
              <span className="badge bg-purple-50 text-purple-700 border border-purple-200/80 text-xs font-semibold shadow-2xs">
                Track: {FOCUS_AREA_META[settings.specialization_area]?.shortLabel}
              </span>
            )}
          </div>

          <div className="flex items-center gap-3">
            {/* Quick ECTS Counter */}
            <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-slate-100/90 border border-slate-200/60 rounded-xl text-xs tabular-nums font-semibold text-slate-700 shadow-2xs">
              <Sparkles className="w-3.5 h-3.5 text-tue-red" />
              <span>{totalCredits} / 120 ECTS</span>
            </div>

            {/* Settings Button */}
            <button
              onClick={() => setIsSettingsOpen(true)}
              className="btn-ghost text-xs group"
              title="Configure specialization and options"
            >
              <Settings className="w-4 h-4 text-slate-500 group-hover:rotate-45 transition-transform duration-200" />
              <span className="hidden sm:inline">Settings</span>
            </button>
          </div>
        </header>

        {/* Content Body with Page Transition and Responsive Padding */}
        <main className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full flex-1 min-w-0">
          {error && (
            <div className="mb-6 p-4 rounded-2xl bg-red-50/90 border border-red-200 text-red-800 text-xs flex items-center gap-2.5 shadow-sm">
              <AlertTriangle className="w-4 h-4 flex-shrink-0 text-red-600" />
              <span className="font-medium">{error}</span>
            </div>
          )}

          {loading ? (
            <LoadingSkeleton />
          ) : (
            <div key={location.pathname} className="animate-fade-in">
              <Routes>
                <Route path="/" element={<Dashboard />} />
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/planner" element={<Planner />} />
                <Route path="/courses" element={<CoursesCatalog />} />
                <Route path="/checklist" element={<Checklist />} />
                <Route path="/summary" element={<Summary />} />
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </div>
          )}
        </main>
      </div>

      {/* Global Settings Modal */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
      />
    </div>
  );
};

const App: React.FC = () => {
  return (
    <AppProvider>
      <MainLayout />
    </AppProvider>
  );
};

export default App;
