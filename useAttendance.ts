import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { attendanceRepository } from '../lib/api';
import type { AttendanceRecord, MonthSummary, UserSettings, WorkingDaysPreset } from '../types';

const DEFAULT_SETTINGS: UserSettings = { monthlyTarget: 12, workingDays: 'mon-fri' };

function isWorkingDay(date: Date, preset: WorkingDaysPreset): boolean {
  const day = date.getDay(); // 0 = Sun ... 6 = Sat
  if (preset === 'mon-sat') return day !== 0;
  return day !== 0 && day !== 6;
}

function toISODate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function computeStreak(records: AttendanceRecord[], settings: UserSettings): number {
  const marked = new Set(records.map((r) => r.date));
  let streak = 0;
  const cursor = new Date();
  cursor.setHours(0, 0, 0, 0);
  // Walk backward from today counting consecutive working days that are marked,
  // skipping non-working days without breaking the streak.
  for (let i = 0; i < 60; i++) {
    if (isWorkingDay(cursor, settings.workingDays)) {
      if (marked.has(toISODate(cursor))) {
        streak++;
      } else {
        break;
      }
    }
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
}

export function useAttendance(email: string | undefined, idToken: string | undefined) {
  const [year, setYear] = useState(() => new Date().getFullYear());
  const [month, setMonth] = useState(() => new Date().getMonth()); // 0-indexed
  const [settings, setSettings] = useState<UserSettings>(DEFAULT_SETTINGS);
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pendingDate, setPendingDate] = useState<string | null>(null);
  const monthCache = useRef<Map<string, AttendanceRecord[]>>(new Map());

  const load = useCallback(async () => {
    if (!email || !idToken) return;
    const cacheKey = `${year}-${month}`;
    const cached = monthCache.current.get(cacheKey);
    // Show cached data immediately (no spinner) while refreshing in the
    // background, so switching between already-visited months feels instant.
    if (cached) {
      setRecords(cached);
      setLoading(false);
    } else {
      setLoading(true);
    }
    setError(null);
    try {
      const { settings: s, attendance: r } = await attendanceRepository.getDashboard(email, idToken, year, month + 1);
      setSettings(s ?? DEFAULT_SETTINGS);
      setRecords(r ?? []);
      monthCache.current.set(cacheKey, r ?? []);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load attendance');
    } finally {
      setLoading(false);
    }
  }, [email, idToken, year, month]);

  useEffect(() => {
    load();
  }, [load]);

  const goToMonth = (nextYear: number, nextMonth: number) => {
    setYear(nextYear);
    setMonth(nextMonth);
  };

  const mark = async (date: string) => {
    if (!email || !idToken) return;
    setPendingDate(date);
    const optimistic: AttendanceRecord = { date, status: 'Present', timestamp: new Date().toISOString() };
    setRecords((prev) => {
      const next = [...prev.filter((r) => r.date !== date), optimistic];
      monthCache.current.set(`${year}-${month}`, next);
      return next;
    });
    try {
      const saved = await attendanceRepository.markAttendance(email, idToken, date);
      setRecords((prev) => {
        const next = [...prev.filter((r) => r.date !== date), saved];
        monthCache.current.set(`${year}-${month}`, next);
        return next;
      });
    } catch (e) {
      setRecords((prev) => {
        const next = prev.filter((r) => r.date !== date);
        monthCache.current.set(`${year}-${month}`, next);
        return next;
      });
      setError(e instanceof Error ? e.message : 'Failed to save attendance');
    } finally {
      setPendingDate(null);
    }
  };

  const unmark = async (date: string) => {
    if (!email || !idToken) return;
    setPendingDate(date);
    const previous = records;
    setRecords((prev) => {
      const next = prev.filter((r) => r.date !== date);
      monthCache.current.set(`${year}-${month}`, next);
      return next;
    });
    try {
      await attendanceRepository.removeAttendance(email, idToken, date);
    } catch (e) {
      setRecords(previous);
      monthCache.current.set(`${year}-${month}`, previous);
      setError(e instanceof Error ? e.message : 'Failed to remove attendance');
    } finally {
      setPendingDate(null);
    }
  };

  const saveSettings = async (next: UserSettings) => {
    if (!email || !idToken) return;
    const previous = settings;
    setSettings(next);
    try {
      const saved = await attendanceRepository.saveSettings(email, idToken, next);
      setSettings(saved);
    } catch (e) {
      setSettings(previous);
      setError(e instanceof Error ? e.message : 'Failed to save settings');
    }
  };

  const summary: MonthSummary = useMemo(() => {
    const visited = records.length;
    const target = settings.monthlyTarget;
    const remaining = Math.max(target - visited, 0);
    const percentage = target > 0 ? Math.min(Math.round((visited / target) * 100), 100) : 0;
    return { visited, target, remaining, percentage, streak: computeStreak(records, settings) };
  }, [records, settings]);

  return {
    year,
    month,
    settings,
    records,
    summary,
    loading,
    error,
    pendingDate,
    goToMonth,
    mark,
    unmark,
    saveSettings,
    reload: load,
    clearError: () => setError(null)
  };
}
