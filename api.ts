import type { AttendanceRecord, UserSettings } from '../types';

// ---------------------------------------------------------------------------
// Repository interface. Swap the implementation below (AppsScriptRepository)
// for a real backend (e.g. Spring Boot + PostgreSQL) later without touching
// any component code — everything in the app talks to this interface only.
// ---------------------------------------------------------------------------
export interface AttendanceRepository {
  getDashboard(
    email: string,
    idToken: string,
    year: number,
    month: number
  ): Promise<{ settings: UserSettings; attendance: AttendanceRecord[] }>;
  getSettings(email: string, idToken: string): Promise<UserSettings>;
  saveSettings(email: string, idToken: string, settings: UserSettings): Promise<UserSettings>;
  getAttendance(email: string, idToken: string, year: number, month: number): Promise<AttendanceRecord[]>;
  markAttendance(email: string, idToken: string, date: string): Promise<AttendanceRecord>;
  removeAttendance(email: string, idToken: string, date: string): Promise<void>;
}

const APPS_SCRIPT_URL = import.meta.env.VITE_APPS_SCRIPT_URL as string | undefined;

class ApiError extends Error {}

async function callAppsScript<T>(action: string, payload: Record<string, unknown>): Promise<T> {
  if (!APPS_SCRIPT_URL) {
    throw new ApiError(
      'VITE_APPS_SCRIPT_URL is not set. Add it to your .env file — see README.md for setup instructions.'
    );
  }
  // Apps Script web apps only reliably accept simple POST requests, so the
  // action + payload are both sent in a single JSON body (no custom headers,
  // which would trigger a CORS preflight Apps Script does not handle well).
  const res = await fetch(APPS_SCRIPT_URL, {
    method: 'POST',
    body: JSON.stringify({ action, ...payload })
  });

  if (!res.ok) {
    throw new ApiError(`Request failed (${res.status})`);
  }
  const json = await res.json();
  if (!json.ok) {
    throw new ApiError(json.error || 'Unknown error from backend');
  }
  return json.data as T;
}

class AppsScriptRepository implements AttendanceRepository {
  getDashboard(email: string, idToken: string, year: number, month: number) {
    return callAppsScript<{ settings: UserSettings; attendance: AttendanceRecord[] }>('getDashboard', {
      email,
      idToken,
      year,
      month
    });
  }
  getSettings(email: string, idToken: string) {
    return callAppsScript<UserSettings>('getSettings', { email, idToken });
  }
  saveSettings(email: string, idToken: string, settings: UserSettings) {
    return callAppsScript<UserSettings>('saveSettings', { email, idToken, settings });
  }
  getAttendance(email: string, idToken: string, year: number, month: number) {
    return callAppsScript<AttendanceRecord[]>('getAttendance', { email, idToken, year, month });
  }
  markAttendance(email: string, idToken: string, date: string) {
    return callAppsScript<AttendanceRecord>('markAttendance', { email, idToken, date });
  }
  removeAttendance(email: string, idToken: string, date: string) {
    return callAppsScript<void>('removeAttendance', { email, idToken, date });
  }
}

export const attendanceRepository: AttendanceRepository = new AppsScriptRepository();
