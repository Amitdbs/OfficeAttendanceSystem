import { useState } from 'react';
import { useAuth } from './context/AuthContext';
import { useAttendance } from './hooks/useAttendance';
import { Login } from './components/Login';
import { Header } from './components/Header';
import { DashboardCards } from './components/DashboardCards';
import { Calendar } from './components/Calendar';
import { DayModal } from './components/DayModal';
import { SettingsModal } from './components/SettingsModal';

export default function App() {
  const { user, idToken, logout } = useAuth();
  const {
    year, month, settings, records, summary, loading, error, pendingDate,
    goToMonth, mark, unmark, saveSettings, clearError
  } = useAttendance(user?.email, idToken ?? undefined);

  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [showSettings, setShowSettings] = useState(false);

  if (!user || !idToken) {
    return <Login />;
  }

  const isSelectedMarked = selectedDate ? records.some((r) => r.date === selectedDate) : false;

  return (
    <div className="min-h-dvh bg-paper dark:bg-paper-dark pb-10">
      <Header user={user} onOpenSettings={() => setShowSettings(true)} onLogout={logout} />

      {error && (
        <div className="mx-5 mb-3 rounded-md border border-rust/30 bg-rust-soft dark:bg-rust/10 px-3 py-2 flex items-center justify-between gap-2">
          <p className="text-xs text-rust">{error}</p>
          <button onClick={clearError} className="text-xs text-rust font-medium shrink-0">
            Dismiss
          </button>
        </div>
      )}

      <div className="mb-4">
        <DashboardCards summary={summary} />
      </div>

      {loading ? (
        <div className="px-5">
          <div className="rounded-lg border border-line dark:border-line-dark bg-white dark:bg-[#211F1C] p-8 shadow-card flex items-center justify-center">
            <p className="text-sm text-ink-dim">Loading calendar…</p>
          </div>
        </div>
      ) : (
        <Calendar
          year={year}
          month={month}
          records={records}
          pendingDate={pendingDate}
          onSelectDate={setSelectedDate}
          onNavigate={goToMonth}
        />
      )}

      {selectedDate && (
        <DayModal
          dateISO={selectedDate}
          isMarked={isSelectedMarked}
          onConfirm={() => {
            mark(selectedDate);
            setSelectedDate(null);
          }}
          onRemove={() => {
            unmark(selectedDate);
            setSelectedDate(null);
          }}
          onCancel={() => setSelectedDate(null)}
        />
      )}

      {showSettings && (
        <SettingsModal
          settings={settings}
          records={records}
          onSave={saveSettings}
          onClose={() => setShowSettings(false)}
        />
      )}
    </div>
  );
}
