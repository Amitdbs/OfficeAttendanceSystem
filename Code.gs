/**
 * Office Attendance — Google Apps Script backend.
 *
 * Deploy this as a Web App (Deploy > New deployment > Web app).
 *   - Execute as: Me
 *   - Who has access: Anyone
 *
 * The frontend POSTs a single JSON body: { action, email, idToken, ...params }
 * to this script's /exec URL for every request (avoids CORS preflights,
 * which Apps Script does not support).
 */

const USERS_SHEET = 'Users';
const ATTENDANCE_SHEET = 'Attendance';
const DEFAULT_TARGET = 12;
const DEFAULT_WORKING_DAYS = 'mon-fri';

function doGet() {
  return jsonResponse({ ok: true, data: 'Office Attendance API is running.' });
}

function doPost(e) {
  try {
    const body = JSON.parse(e.postData.contents);
    const { action, email, idToken } = body;

    if (!action) return jsonResponse({ ok: false, error: 'Missing action' });
    if (!email || !idToken) return jsonResponse({ ok: false, error: 'Missing email or idToken' });

    // Verify the Google ID token server-side and confirm it belongs to `email`.
    // This is the one place we actually trust the caller's identity.
    const verifiedEmail = verifyGoogleIdToken(idToken);
    if (!verifiedEmail || verifiedEmail.toLowerCase() !== String(email).toLowerCase()) {
      return jsonResponse({ ok: false, error: 'Token verification failed' });
    }

    switch (action) {
      case 'getDashboard':
        return jsonResponse({
          ok: true,
          data: {
            settings: getSettings(email),
            attendance: getAttendance(email, body.year, body.month)
          }
        });
      case 'getSettings':
        return jsonResponse({ ok: true, data: getSettings(email) });
      case 'saveSettings':
        return jsonResponse({ ok: true, data: saveSettings(email, body.settings) });
      case 'getAttendance':
        return jsonResponse({ ok: true, data: getAttendance(email, body.year, body.month) });
      case 'markAttendance':
        return jsonResponse({ ok: true, data: markAttendance(email, body.date) });
      case 'removeAttendance':
        removeAttendance(email, body.date);
        return jsonResponse({ ok: true, data: null });
      default:
        return jsonResponse({ ok: false, error: 'Unknown action: ' + action });
    }
  } catch (err) {
    return jsonResponse({ ok: false, error: String(err) });
  }
}

// ---------------------------------------------------------------------------
// Auth
// ---------------------------------------------------------------------------

function verifyGoogleIdToken(idToken) {
  // Verifying against Google is the slowest part of every request (an extra
  // network round trip). Cache the result for a few minutes so marking
  // several dates in a row, or a mark-then-reload, doesn't re-pay that cost
  // every time. Cache TTL is short and well under the token's own ~1hr life.
  const cache = CacheService.getScriptCache();
  const cacheKey = 'tok_' + Utilities.base64EncodeWebSafe(
    Utilities.computeDigest(Utilities.DigestAlgorithm.MD5, idToken)
  );
  const cached = cache.get(cacheKey);
  if (cached) return cached === '__invalid__' ? null : cached;

  const res = UrlFetchApp.fetch(
    'https://oauth2.googleapis.com/tokeninfo?id_token=' + encodeURIComponent(idToken),
    { muteHttpExceptions: true }
  );
  if (res.getResponseCode() !== 200) {
    cache.put(cacheKey, '__invalid__', 60);
    return null;
  }
  const payload = JSON.parse(res.getContentText());
  // Optionally pin your OAuth client ID here for extra safety:
  // if (payload.aud !== 'YOUR_CLIENT_ID.apps.googleusercontent.com') return null;
  if (payload.exp && Number(payload.exp) * 1000 < Date.now()) {
    cache.put(cacheKey, '__invalid__', 60);
    return null;
  }
  const email = payload.email || null;
  if (email) cache.put(cacheKey, email, 300); // 5 minutes
  return email;
}

// ---------------------------------------------------------------------------
// Users / Settings
// ---------------------------------------------------------------------------

function getSettings(email) {
  const sheet = getSheet(USERS_SHEET, ['Email', 'Name', 'Monthly Target', 'Working Days']);
  const row = findRowByEmail(sheet, email);
  if (!row) {
    return { monthlyTarget: DEFAULT_TARGET, workingDays: DEFAULT_WORKING_DAYS };
  }
  return {
    monthlyTarget: Number(row.values[2]) || DEFAULT_TARGET,
    workingDays: row.values[3] || DEFAULT_WORKING_DAYS
  };
}

function saveSettings(email, settings) {
  const sheet = getSheet(USERS_SHEET, ['Email', 'Name', 'Monthly Target', 'Working Days']);
  const row = findRowByEmail(sheet, email);
  const target = Number(settings.monthlyTarget) || DEFAULT_TARGET;
  const workingDays = settings.workingDays || DEFAULT_WORKING_DAYS;

  if (row) {
    sheet.getRange(row.index, 3, 1, 2).setValues([[target, workingDays]]);
  } else {
    sheet.appendRow([email, '', target, workingDays]);
  }
  return { monthlyTarget: target, workingDays };
}

// ---------------------------------------------------------------------------
// Attendance
// ---------------------------------------------------------------------------

function getAttendance(email, year, month) {
  const sheet = getSheet(ATTENDANCE_SHEET, ['Email', 'Date', 'Status', 'Timestamp']);
  const data = sheet.getDataRange().getValues();
  const prefix = year + '-' + String(month).padStart(2, '0');

  // Keep only the latest row per date, in case older duplicate rows exist
  // (e.g. from before duplicate-checking was fixed) so counts stay accurate.
  const byDate = {};
  for (let i = 1; i < data.length; i++) {
    const [rowEmail, rawDate, status, timestamp] = data[i];
    if (String(rowEmail).toLowerCase() !== email.toLowerCase()) continue;
    const date = normalizeDate(rawDate);
    if (date.indexOf(prefix) !== 0) continue;
    const existing = byDate[date];
    if (!existing || String(timestamp) > existing.timestamp) {
      byDate[date] = { date, status, timestamp: String(timestamp) };
    }
  }
  return Object.values(byDate);
}

function markAttendance(email, date) {
  if (!date) throw new Error('Missing date');
  const todayISO = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'yyyy-MM-dd');
  if (date > todayISO) throw new Error('Cannot mark attendance for a future date');

  const sheet = getSheet(ATTENDANCE_SHEET, ['Email', 'Date', 'Status', 'Timestamp']);
  const data = sheet.getDataRange().getValues();

  // Prevent duplicate entries for the same email + date.
  for (let i = 1; i < data.length; i++) {
    if (String(data[i][0]).toLowerCase() === email.toLowerCase() && normalizeDate(data[i][1]) === date) {
      return { date, status: data[i][2], timestamp: String(data[i][3]) };
    }
  }

  const timestamp = new Date().toISOString();
  const nextRow = sheet.getLastRow() + 1;
  // Force the Date column to plain text BEFORE writing the value, otherwise
  // Sheets auto-detects "2026-07-30"-style strings and silently converts the
  // cell to a real Date, which then breaks string-prefix matching on read.
  sheet.getRange(nextRow, 2).setNumberFormat('@');
  sheet.getRange(nextRow, 1, 1, 4).setValues([[email, date, 'Present', timestamp]]);
  return { date, status: 'Present', timestamp };
}

function removeAttendance(email, date) {
  const sheet = getSheet(ATTENDANCE_SHEET, ['Email', 'Date', 'Status', 'Timestamp']);
  const data = sheet.getDataRange().getValues();
  // Delete every matching row (bottom-up so row indices stay valid), in case
  // duplicate rows exist for this date from before duplicate-checking was fixed.
  for (let i = data.length - 1; i >= 1; i--) {
    if (String(data[i][0]).toLowerCase() === email.toLowerCase() && normalizeDate(data[i][1]) === date) {
      sheet.deleteRow(i + 1);
    }
  }
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getSheet(name, headerRow) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(name);
  if (!sheet) {
    sheet = ss.insertSheet(name);
    sheet.appendRow(headerRow);
  }
  return sheet;
}

function findRowByEmail(sheet, email) {
  const data = sheet.getDataRange().getValues();
  for (let i = 1; i < data.length; i++) {
    if (String(data[i][0]).toLowerCase() === String(email).toLowerCase()) {
      return { index: i + 1, values: data[i] };
    }
  }
  return null;
}

function normalizeDate(value) {
  // Google Sheets sometimes stores date-looking strings as real Date objects
  // (auto-detection on write). This converts either form back to a plain
  // 'yyyy-MM-dd' string so date comparisons always work regardless of how
  // the cell happens to be stored.
  if (Object.prototype.toString.call(value) === '[object Date]') {
    return Utilities.formatDate(value, Session.getScriptTimeZone(), 'yyyy-MM-dd');
  }
  return String(value);
}

function jsonResponse(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}

// ---------------------------------------------------------------------------
// Manual debug helper — run this directly from the Apps Script editor
// (select testGetAttendance from the function dropdown, click Run), then
// check View \u2192 Logs (or Executions \u2192 this run \u2192 Log). This bypasses the
// frontend and network entirely, so it tells you definitively whether the
// backend code + sheet data are correct.
// ---------------------------------------------------------------------------
function testGetAttendance() {
  const email = 'YOUR_EMAIL_HERE@gmail.com'; // <-- change this
  const year = 2026;                          // <-- change this
  const month = 7;                            // <-- change this (1 = Jan ... 12 = Dec)

  const sheet = getSheet(ATTENDANCE_SHEET, ['Email', 'Date', 'Status', 'Timestamp']);
  const raw = sheet.getDataRange().getValues();
  Logger.log('Raw row count (including header): %s', raw.length);
  Logger.log('Raw rows: %s', JSON.stringify(raw));

  const result = getAttendance(email, year, month);
  Logger.log('getAttendance(%s, %s, %s) => %s', email, year, month, JSON.stringify(result));
}
