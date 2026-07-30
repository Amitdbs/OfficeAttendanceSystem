import { useTheme } from '../context/ThemeContext';
import type { UserProfile } from '../types';

interface Props {
  user: UserProfile;
  onOpenSettings: () => void;
  onLogout: () => void;
}

export function Header({ user, onOpenSettings, onLogout }: Props) {
  const { theme, toggleTheme } = useTheme();
  const initial = user.name?.[0]?.toUpperCase() ?? user.email[0].toUpperCase();

  return (
    <header className="flex items-center justify-between px-5 pt-5 pb-3">
      <div className="flex items-center gap-2.5 min-w-0">
        {user.picture ? (
          <img src={user.picture} alt="" className="h-9 w-9 rounded-full border border-line dark:border-line-dark" />
        ) : (
          <div className="h-9 w-9 shrink-0 rounded-full bg-stamp-soft dark:bg-stamp/20 text-stamp flex items-center justify-center font-display font-semibold">
            {initial}
          </div>
        )}
        <div className="min-w-0">
          <p className="text-sm font-medium text-ink dark:text-ink-light truncate">{user.name}</p>
          <p className="text-xs text-ink-dim truncate">{user.email}</p>
        </div>
      </div>

      <div className="flex items-center gap-1">
        <button
          onClick={toggleTheme}
          aria-label="Toggle dark mode"
          className="h-9 w-9 flex items-center justify-center rounded-full text-ink-dim hover:bg-ink/5 dark:hover:bg-white/5 active:scale-95 transition"
        >
          {theme === 'dark' ? '☀' : '☾'}
        </button>
        <button
          onClick={onOpenSettings}
          aria-label="Settings"
          className="h-9 w-9 flex items-center justify-center rounded-full text-ink-dim hover:bg-ink/5 dark:hover:bg-white/5 active:scale-95 transition"
        >
          ⚙
        </button>
        <button
          onClick={onLogout}
          aria-label="Sign out"
          className="h-9 w-9 flex items-center justify-center rounded-full text-ink-dim hover:bg-ink/5 dark:hover:bg-white/5 active:scale-95 transition"
        >
          ⏻
        </button>
      </div>
    </header>
  );
}
