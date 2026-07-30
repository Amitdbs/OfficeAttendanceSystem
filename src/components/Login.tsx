import { GoogleLogin, type CredentialResponse } from '@react-oauth/google';
import { useAuth } from '../context/AuthContext';
import { decodeGoogleIdToken } from '../lib/jwt';

export function Login() {
  const { login } = useAuth();

  const handleSuccess = (response: CredentialResponse) => {
    if (!response.credential) return;
    const payload = decodeGoogleIdToken(response.credential);
    login(response.credential, {
      email: payload.email,
      name: payload.name,
      picture: payload.picture
    });
  };

  return (
    <div className="min-h-dvh flex flex-col items-center justify-center px-6 bg-paper dark:bg-paper-dark">
      <div className="w-full max-w-sm">
        <div className="mb-10 text-center">
          <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-full border-2 border-stamp text-stamp -rotate-6">
            <span className="font-mono font-bold text-xl">IN</span>
          </div>
          <h1 className="font-display text-2xl font-semibold text-ink dark:text-ink-light">
            Office Attendance
          </h1>
          <p className="mt-2 text-sm text-ink-dim">
            Tap a date, mark yourself present. That's the whole app.
          </p>
        </div>

        <div className="rounded-lg border border-line dark:border-line-dark bg-white dark:bg-[#211F1C] p-6 shadow-card flex flex-col items-center gap-4">
          <GoogleLogin
            onSuccess={handleSuccess}
            onError={() => console.error('Google sign-in failed')}
            theme="outline"
            shape="pill"
            text="continue_with"
          />
          <p className="text-xs text-ink-dim text-center">
            Sign in with your Google account. Your attendance is saved under your email — nothing else is shared.
          </p>
        </div>
      </div>
    </div>
  );
}
