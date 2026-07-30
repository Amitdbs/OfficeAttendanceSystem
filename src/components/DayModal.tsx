interface Props {
  dateISO: string;
  isMarked: boolean;
  onConfirm: () => void;
  onRemove: () => void;
  onCancel: () => void;
}

function formatDate(iso: string): string {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, m - 1, d).toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric'
  });
}

export function DayModal({ dateISO, isMarked, onConfirm, onRemove, onCancel }: Props) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-ink/40 dark:bg-black/60 backdrop-blur-[2px] px-4 pb-4 sm:pb-0"
      onClick={onCancel}
    >
      <div
        className="w-full max-w-sm rounded-lg border border-line dark:border-line-dark bg-white dark:bg-[#211F1C] p-5 shadow-card"
        onClick={(e) => e.stopPropagation()}
      >
        <p className="text-[11px] uppercase tracking-wide text-ink-dim font-medium mb-1">
          {isMarked ? 'Already marked' : 'Mark attendance'}
        </p>
        <p className="font-display text-lg font-semibold text-ink dark:text-ink-light mb-5">
          {isMarked ? `Remove attendance for ${formatDate(dateISO)}?` : `Mark attendance for ${formatDate(dateISO)}?`}
        </p>

        <div className="flex gap-2.5">
          <button
            onClick={onCancel}
            className="flex-1 h-11 rounded-full border border-line dark:border-line-dark text-sm font-medium text-ink dark:text-ink-light active:scale-95 transition"
          >
            Cancel
          </button>
          {isMarked ? (
            <button
              onClick={onRemove}
              className="flex-1 h-11 rounded-full bg-rust text-white text-sm font-medium active:scale-95 transition"
            >
              Remove
            </button>
          ) : (
            <button
              onClick={onConfirm}
              className="flex-1 h-11 rounded-full bg-stamp text-white text-sm font-medium active:scale-95 transition"
            >
              Confirm
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
