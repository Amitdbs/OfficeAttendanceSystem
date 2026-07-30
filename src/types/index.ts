export interface UserProfile {
  email: string;
  name: string;
  picture?: string;
}

export type WorkingDaysPreset = 'mon-fri' | 'mon-sat';

export interface UserSettings {
  monthlyTarget: number;
  workingDays: WorkingDaysPreset;
}

export type AttendanceStatus = 'Present';

export interface AttendanceRecord {
  date: string; // YYYY-MM-DD
  status: AttendanceStatus;
  timestamp: string;
}

export interface MonthSummary {
  visited: number;
  target: number;
  remaining: number;
  percentage: number;
  streak: number;
}

export interface AuthContextValue {
  user: UserProfile | null;
  idToken: string | null;
  isAuthenticating: boolean;
  login: (idToken: string, profile: UserProfile) => void;
  logout: () => void;
}
