export interface GoogleIdTokenPayload {
  email: string;
  name: string;
  picture?: string;
  exp: number;
}

/**
 * Decodes the payload of a Google ID token (JWT) on the client purely to
 * read display fields (email/name/picture). This is NOT signature
 * verification — the Apps Script backend re-verifies the token server-side
 * before trusting the email on every request.
 */
export function decodeGoogleIdToken(idToken: string): GoogleIdTokenPayload {
  const payload = idToken.split('.')[1];
  const normalized = payload.replace(/-/g, '+').replace(/_/g, '/');
  const padded = normalized.padEnd(normalized.length + ((4 - (normalized.length % 4)) % 4), '=');
  const json = decodeURIComponent(
    atob(padded)
      .split('')
      .map((c) => '%' + c.charCodeAt(0).toString(16).padStart(2, '0'))
      .join('')
  );
  return JSON.parse(json);
}
