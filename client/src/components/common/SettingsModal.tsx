import React, { useState, useEffect } from 'react';
import Modal from './Modal';
import { useAppContext } from '@/context/AppContext';
import { FOCUS_AREA_META, FocusArea } from '@/types';
import { CheckCircle2, Sparkles, BookOpen } from 'lucide-react';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const FOCUS_AREAS: FocusArea[] = ['algo_theory', 'arch_systems', 'soft_analytics'];

const FOCUS_AREA_DESCRIPTIONS: Record<FocusArea, string> = {
  algo_theory: 'Focus on algorithms, data structures, complexity theory, and formal reasoning.',
  arch_systems: 'Focus on distributed systems, cyber-physical systems, IoT, real-time systems, and validation.',
  soft_analytics: 'Focus on software engineering, process mining, data analytics, and machine learning.',
};

const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose }) => {
  const { settings, updateSpecialization } = useAppContext();
  const [selectedArea, setSelectedArea] = useState<FocusArea | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setSelectedArea(settings?.specialization_area ?? null);
    }
  }, [isOpen, settings]);

  const handleSave = async () => {
    setIsSubmitting(true);
    try {
      await updateSpecialization(selectedArea);
      onClose();
    } catch (err) {
      console.error('Failed to update specialization settings:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Study Plan Settings">
      <div className="space-y-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Sparkles className="w-4 h-4 text-tue-red" />
            <h4 className="font-semibold text-gray-900">Choose Specialization Area</h4>
          </div>
          <p className="text-sm text-gray-500">
            Select your primary CSE Master specialization. You must complete at least 15 ECTS (3 deepening or foundational courses) within this track.
          </p>
        </div>

        <div className="space-y-3">
          {FOCUS_AREAS.map((areaKey) => {
            const meta = FOCUS_AREA_META[areaKey];
            const isSelected = selectedArea === areaKey;
            return (
              <label
                key={areaKey}
                className={`relative flex items-start p-4 rounded-xl border cursor-pointer transition-all ${
                  isSelected
                    ? 'border-tue-red bg-red-50/40 shadow-sm ring-1 ring-tue-red/20'
                    : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50/60'
                }`}
              >
                <input
                  type="radio"
                  name="specialization_area"
                  value={areaKey}
                  checked={isSelected}
                  onChange={() => setSelectedArea(areaKey)}
                  className="mt-1 h-4 w-4 text-tue-red focus:ring-tue-red border-gray-300"
                />
                <div className="ml-3 flex-1">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-gray-900 flex items-center gap-2">
                      {meta.label}
                      <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-600 font-mono font-normal">
                        {meta.shortLabel}
                      </span>
                    </span>
                    {isSelected && (
                      <CheckCircle2 className="w-5 h-5 text-tue-red" />
                    )}
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    {FOCUS_AREA_DESCRIPTIONS[areaKey]}
                  </p>
                </div>
              </label>
            );
          })}

          <label
            className={`flex items-center p-3 rounded-xl border cursor-pointer transition-all ${
              selectedArea === null
                ? 'border-gray-400 bg-gray-50'
                : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50/50'
            }`}
          >
            <input
              type="radio"
              name="specialization_area"
              value="none"
              checked={selectedArea === null}
              onChange={() => setSelectedArea(null)}
              className="h-4 w-4 text-gray-600 focus:ring-gray-400 border-gray-300"
            />
            <span className="ml-3 text-sm text-gray-600 italic">
              Undecided / No specialization selected
            </span>
          </label>
        </div>

        <div className="bg-blue-50 border border-blue-100 rounded-xl p-3 flex items-start gap-3 text-xs text-blue-800">
          <BookOpen className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
          <p>
            TU/e CSE requires at least one foundational course from <strong>each</strong> of the three focus areas (15 ECTS total), plus 15 ECTS of specialization courses in your chosen area.
          </p>
        </div>

        <div className="flex justify-end gap-3 pt-3 border-t border-gray-100">
          <button
            type="button"
            onClick={onClose}
            className="btn-secondary"
            disabled={isSubmitting}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="btn-primary flex items-center gap-2"
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default SettingsModal;
