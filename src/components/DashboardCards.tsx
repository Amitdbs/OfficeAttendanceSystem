import type { MonthSummary } from '../types';

export function DashboardCards({ summary }: { summary: MonthSummary }) {
  return (
    <div className="px-5 grid grid-cols-2 gap-3">
      <div className="rounded-lg border border-line dark:border-line-dark bg-white dark:bg-[#211F1C] p-4 shadow-card">
        <p className="text-[11px] uppercase tracking-wide text-ink-dim font-medium">Visited Office</p>
        <p className="mt-1 font-mono text-3xl font-bold text-stamp">
          {summary.visited}
          <span className="text-base font-medium text-ink-dim ml-1">days</span>
        </p>
        {summary.streak > 1 && (
          <p className="mt-1 text-xs text-ink-dim">🔥 {summary.streak}-day streak</p>
        )}
      </div>

      <div className="rounded-lg border border-line dark:border-line-dark bg-white dark:bg-[#211F1C] p-4 shadow-card">
        <p className="text-[11px] uppercase tracking-wide text-ink-dim font-medium">Remaining</p>
        <p className="mt-1 font-mono text-3xl font-bold text-rust">
          {summary.remaining}
          <span className="text-base font-medium text-ink-dim ml-1">days</span>
        </p>
        <p className="mt-1 text-xs text-ink-dim">of {summary.target} target · {summary.percentage}%</p>
      </div>
    </div>
  );
}
