import type { AttendanceRecord } from '../types';

interface Props {
  year: number;
  month: number; // 0-indexed
  records: AttendanceRecord[];
  pendingDate: string | null;
  onSelectDate: (iso: string) => void;
  onNavigate: (year: number, month: number) => void;
}

const WEEKDAYS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

function toISO(year: number, month: number, day: number): string {
  const mm = String(month + 1).padStart(2, '0');
  const dd = String(day).padStart(2, '0');
  return `${year}-${mm}-${dd}`;
}

export function Calendar({ year, month, records, pendingDate, onSelectDate, onNavigate }: Props) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayISO = toISO(today.getFullYear(), today.getMonth(), today.getDate());

  const marked = new Set(records.map((r) => r.date));
  const firstDayOfMonth = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const isCurrentOrFutureMonth = year > today.getFullYear() || (year === today.getFullYear() && month >= today.getMonth());
  const canGoNext = !isCurrentOrFutureMonth;

  const goPrev = () => {
    if (month === 0) onNavigate(year - 1, 11);
    else onNavigate(year, month - 1);
  };
  const goNext = () => {
    if (!canGoNext) return;
    if (month === 11) onNavigate(year + 1, 0);
    else onNavigate(year, month + 1);
  };

  const cells: (number | null)[] = [
    ...Array(firstDayOfMonth).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1)
  ];

  return (
    <div className="px-5">
      <div className="rounded-lg border border-line dark:border-line-dark bg-white dark:bg-[#211F1C] p-4 shadow-card">
        <div className="flex items-center justify-between mb-3">
          <button
            onClick={goPrev}
            aria-label="Previous month"
            className="h-8 w-8 flex items-center justify-center rounded-full text-ink-dim hover:bg-ink/5 dark:hover:bg-white/5 active:scale-95 transition"
          >
            ‹
          </button>
          <p className="font-display font-semibold text-sm text-ink dark:text-ink-light">
            {MONTH_NAMES[month]} {year}
          </p>
          <button
            onClick={goNext}
            disabled={!canGoNext}
            aria-label="Next month"
            className="h-8 w-8 flex items-center justify-center rounded-full text-ink-dim hover:bg-ink/5 dark:hover:bg-white/5 active:scale-95 transition disabled:opacity-25 disabled:pointer-events-none"
          >
            ›
          </button>
        </div>

        <div className="grid grid-cols-7 mb-1">
          {WEEKDAYS.map((d, i) => (
            <div key={i} className="text-center text-[11px] font-medium text-ink-dim py-1">
              {d}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-y-1">
          {cells.map((day, idx) => {
            if (day === null) return <div key={`empty-${idx}`} />;
            const iso = toISO(year, month, day);
            const isFuture = iso > todayISO;
            const isToday = iso === todayISO;
            const isMarked = marked.has(iso);
            const isPending = pendingDate === iso;

            return (
              <div key={iso} className="flex items-center justify-center py-0.5">
                <button
                  onClick={() => !isFuture && onSelectDate(iso)}
                  disabled={isFuture}
                  aria-label={`${MONTH_NAMES[month]} ${day}, ${year}${isMarked ? ', marked present' : ''}`}
                  className={[
                    'relative h-10 w-10 rounded-full flex items-center justify-center font-mono text-sm transition active:scale-95',
                    isFuture ? 'text-ink-dim/40 cursor-not-allowed' : 'text-ink dark:text-ink-light',
                    !isFuture && !isMarked ? 'hover:bg-ink/5 dark:hover:bg-white/5' : '',
                    isToday && !isMarked ? 'ring-1 ring-rust' : '',
                    isPending ? 'opacity-50' : ''
                  ].join(' ')}
                >
                  {isMarked ? (
                    <span
                      className={`absolute inset-0 rounded-full border-2 border-stamp -rotate-6 flex items-center justify-center text-stamp font-bold ${isPending ? '' : 'animate-stamp'}`}
                    >
                      <span className="text-xs">✓</span>
                    </span>
                  ) : (
                    day
                  )}
                </button>
              </div>
            );
          })}
        </div>
      </div>

      <p className="mt-2.5 text-center text-xs text-ink-dim">
        Tap any past or today's date to mark attendance
      </p>
    </div>
  );
}
