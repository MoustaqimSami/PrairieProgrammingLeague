// Reads a private Google Sheet with a Google service account, using only Node's
// built-in crypto (no Google library needed).
//
// A service account is a robot Google account. You share the sheet with its email
// address as a Viewer, and it can read the sheet but never change it. Its key is a JSON
// file from Google Cloud; we keep the whole JSON in the GOOGLE_SERVICE_ACCOUNT_JSON
// secret. See docs/DEPLOY.md, "Connecting the attendance sheet".
import { createSign } from 'node:crypto';

const READ_ONLY_SCOPE = 'https://www.googleapis.com/auth/spreadsheets.readonly';

// Google's OAuth flow for service accounts: sign a short-lived JWT with the account's
// private key and trade it for an access token.
async function accessToken(serviceAccount) {
  const now = Math.floor(Date.now() / 1000);
  const encode = (obj) => Buffer.from(JSON.stringify(obj)).toString('base64url');
  const unsigned = `${encode({ alg: 'RS256', typ: 'JWT' })}.${encode({
    iss: serviceAccount.client_email,
    scope: READ_ONLY_SCOPE,
    aud: serviceAccount.token_uri || 'https://oauth2.googleapis.com/token',
    iat: now,
    exp: now + 600,
  })}`;
  const signature = createSign('RSA-SHA256').update(unsigned).sign(serviceAccount.private_key, 'base64url');

  const res = await fetch(serviceAccount.token_uri || 'https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion: `${unsigned}.${signature}`,
    }),
  });
  const body = await res.json();
  if (!res.ok) throw new Error(`Google sign-in failed: ${body.error_description || body.error || res.status}`);
  return body.access_token;
}

// Returns { [tabName]: rows } where rows is an array of arrays of cell text,
// exactly as the sheet shows them. Tabs are read in one request.
export async function readSheetTabs(sheetId, tabNames, serviceAccount) {
  const token = await accessToken(serviceAccount);
  // Tab names go in quotes ('Contest Links'), percent-encoded so spaces survive.
  const ranges = tabNames.map((name) => `ranges=${encodeURIComponent(`'${name.replace(/'/g, "''")}'`)}`);
  const params = ['majorDimension=ROWS', 'valueRenderOption=FORMATTED_VALUE', ...ranges].join('&');
  const res = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values:batchGet?${params}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const body = await res.json();
  if (!res.ok) {
    const hint = res.status === 403 ? ' (is the sheet shared with the service account email?)' : '';
    throw new Error(`Google Sheets returned ${res.status}: ${body.error?.message ?? ''}${hint}`);
  }
  return Object.fromEntries(tabNames.map((name, i) => [name, body.valueRanges[i]?.values ?? []]));
}
