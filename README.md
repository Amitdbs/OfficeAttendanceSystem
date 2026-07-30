# Office Attendance

A lightweight, mobile-first web app for marking office attendance on a calendar, backed by a Google Sheet instead of a traditional database.

- **Frontend:** React + TypeScript + Vite + Tailwind CSS
- **Backend:** Google Apps Script (REST-style JSON API)
- **Database:** Google Sheets
- **Auth:** Google Sign-In (OAuth)

---

## 1. Create the Google Sheet

1. Create a new Google Sheet (any name, e.g. "Office Attendance DB").
2. You don't need to create tabs manually — the backend creates `Users` and `Attendance` sheets automatically on first use, with these columns:

   **Users**: `Email | Name | Monthly Target | Working Days`
   **Attendance**: `Email | Date | Status | Timestamp`

3. Note the Sheet's URL — you'll open its Apps Script editor from inside it.

---

## 2. Deploy the Apps Script backend

1. In your Google Sheet, go to **Extensions → Apps Script**.
2. Delete the default `Code.gs` contents and paste in the contents of [`apps-script/Code.gs`](./apps-script/Code.gs) from this repo.
3. Click **Deploy → New deployment**.
   - Type: **Web app**
   - Execute as: **Me**
   - Who has access: **Anyone**
4. Click **Deploy**, authorize the requested permissions, and copy the **Web app URL** (it ends in `/exec`). This is your `VITE_APPS_SCRIPT_URL`.

> Whenever you edit `Code.gs`, you must create a **new deployment version** (Deploy → Manage deployments → Edit → New version) for changes to take effect on the live URL.

---

## 3. Set up Google Sign-In (OAuth)

1. Go to the [Google Cloud Console](https://console.cloud.google.com/) → create or select a project.
2. Go to **APIs & Services → OAuth consent screen** and configure it (External is fine for personal use; add your own email as a test user if it stays in "Testing" mode).
3. Go to **APIs & Services → Credentials → Create Credentials → OAuth client ID**.
   - Application type: **Web application**
   - Authorized JavaScript origins: add `http://localhost:5173` (for local dev) and your production URL (e.g. `https://your-app.vercel.app`) once you have it.
4. Copy the generated **Client ID** — this is your `VITE_GOOGLE_CLIENT_ID`.

---

## 4. Configure environment variables

Copy `.env.example` to `.env` and fill in the two values from steps above:

```bash
cp .env.example .env
```

```
VITE_GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
VITE_APPS_SCRIPT_URL=https://script.google.com/macros/s/XXXXXXXXXXXX/exec
```

---

## 5. Run locally

```bash
npm install
npm run dev
```

Open `http://localhost:5173`, sign in with Google, and start marking attendance.

---

## 6. Deploy to Vercel

1. Push this project to a GitHub repo.
2. In Vercel, **Import Project** from that repo (framework preset: Vite).
3. Add the two environment variables (`VITE_GOOGLE_CLIENT_ID`, `VITE_APPS_SCRIPT_URL`) in Vercel's Project Settings → Environment Variables.
4. Deploy. Once you have the production URL, add it to the OAuth client's **Authorized JavaScript origins** in Google Cloud Console (step 3).

---

## How it works

- The frontend never talks to Google Sheets directly. Every read/write goes through `src/lib/api.ts`, which implements an `AttendanceRepository` interface and currently calls the Apps Script web app.
- On sign-in, the frontend gets a Google ID token. Every API call includes it, and the Apps Script backend re-verifies it server-side against Google before trusting the caller's email — so nobody can write attendance under someone else's name just by editing the request.
- Because everything is behind the `AttendanceRepository` interface, migrating to a real backend later (e.g. Spring Boot + PostgreSQL) means writing one new class that implements the same interface — no component code changes.

## Project structure

```
src/
  components/     UI components (Login, Header, Calendar, DashboardCards, modals)
  context/        AuthContext (session), ThemeContext (dark mode)
  hooks/          useAttendance — loads settings/attendance, exposes mark/unmark/save actions
  lib/            api.ts (repository/service layer), jwt.ts (ID token decoding)
  types/          shared TypeScript types
apps-script/
  Code.gs         Apps Script backend — deploy this into your Sheet's script editor
```

## Notes

- Future dates cannot be marked (enforced both in the UI and the backend).
- Marking the same date twice is a no-op — duplicate entries are prevented server-side.
- PWA support is wired up via `vite-plugin-pwa`; replace `public/icon-192.png` and `public/icon-512.png` with real app icons before shipping (currently referenced but not included).
- Dark mode, monthly target, working-days preset, streak, and CSV export are all included; percentage and streak are computed client-side from the attendance records already being fetched, no extra API calls needed.
