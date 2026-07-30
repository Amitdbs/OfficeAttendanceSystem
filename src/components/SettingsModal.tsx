import { useState } from 'react';
import type { AttendanceRecord, UserSettings, WorkingDaysPreset } from '../types';

interface Props {
  settings: UserSettings;
  records: AttendanceRecord[];
  onSave: (settings: UserSettings) => void;
  onClose: () => void;
}

export function SettingsModal({ settings, records, onSave, onClose }: Props) {
  const [target, setTarget] = useState(settings.monthlyTarget);
  const [workingDays, setWorkingDays] = useState<WorkingDaysPreset>(settings.workingDays);

  const handleSave = () => {
    onSave({ monthlyTarget: Math.max(1, target), workingDays });
    onClose();
  };

  const exportCSV = () => {
    const header = 'Date,Status\n';
    const rows = records
      .slice()
      .sort((a, b) => a.date.localeCompare(b.date))
      .map((r) => `${r.date},${r.status}`)
      .join('\n');
    const blob = new Blob([header + rows], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'attendance.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-ink/40 dark:bg-black/60 backdrop-blur-[2px] px-4 pb-4 sm:pb-0"
      onClick={onClose}
    >
      <div
        className="w-full max-w-sm rounded-lg border border-line dark:border-line-dark bg-white dark:bg-[#211F1C] p-5 shadow-card"
        onClick={(e) => e.stopPropagation()}
      >
        <p className="font-display text-lg font-semibold text-ink dark:text-ink-light mb-4">Settings</p>

        <label className="block text-xs font-medium text-ink-dim mb-1.5">Monthly office target</label>
        <input
          type="number"
          min={1}
          max={31}
          value={target}
          onChange={(e) => setTarget(Number(e.target.value))}
          className="w-full h-11 rounded-md border border-line dark:border-line-dark bg-transparent px-3 font-mono text-sm text-ink dark:text-ink-light mb-4"
        />

        <label className="block text-xs font-medium text-ink-dim mb-1.5">Working days</label>
        <div className="flex gap-2 mb-5">
          <button
            onClick={() => setWorkingDays('mon-fri')}
            className={`flex-1 h-11 rounded-md border text-sm font-medium transition ${
              workingDays === 'mon-fri'
                ? 'border-stamp bg-stamp-soft dark:bg-stamp/20 text-stamp'
                : 'border-line dark:border-line-dark text-ink dark:text-ink-light'
            }`}
          >
            Mon – Fri
          </button>
          <button
            onClick={() => setWorkingDays('mon-sat')}
            className={`flex-1 h-11 rounded-md border text-sm font-medium transition ${
              workingDays === 'mon-sat'
                ? 'border-stamp bg-stamp-soft dark:bg-stamp/20 text-stamp'
                : 'border-line dark:border-line-dark text-ink dark:text-ink-light'
            }`}
          >
            Mon – Sat
          </button>
        </div>

        <button
          onClick={exportCSV}
          className="w-full h-11 rounded-full border border-line dark:border-line-dark text-sm font-medium text-ink dark:text-ink-light active:scale-95 transition mb-2.5"
        >
          Export attendance to CSV
        </button>

        <div className="flex gap-2.5">
          <button
            onClick={onClose}
            className="flex-1 h-11 rounded-full border border-line dark:border-line-dark text-sm font-medium text-ink dark:text-ink-light active:scale-95 transition"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="flex-1 h-11 rounded-full bg-stamp text-white text-sm font-medium active:scale-95 transition"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
}
