// Copies the attendance Google Sheet into the database. Run with: npm run sheet:sync
// The scheduled GitHub job runs this before every scrape, so an edit to the sheet
// reaches the site within about 15 minutes. The sheet is only read, never changed.
//
// Needs two settings (GitHub secrets on the live site, server/.env locally):
//   GOOGLE_SHEET_ID              the long id in the sheet's URL (.../spreadsheets/d/<id>/edit)
//   GOOGLE_SERVICE_ACCOUNT_JSON  the service account's JSON key, pasted whole
// Without them it prints a note and does nothing, so the scraper keeps working.
import { readSheetTabs } from './google.js';
import { parseAttendance, parseContestLinks } from './parseSheet.js';

const ATTENDANCE_TAB = 'Attendance';
const LINKS_TAB = 'Contest Links';

const { GOOGLE_SHEET_ID: sheetId, GOOGLE_SERVICE_ACCOUNT_JSON: keyJson } = process.env;
if (!sheetId || !keyJson) {
  console.log('sheet sync skipped: GOOGLE_SHEET_ID and GOOGLE_SERVICE_ACCOUNT_JSON are not set');
  process.exit(0);
}

const { pool } = await import('../src/db/pool.js');
const tabs = await readSheetTabs(sheetId, [ATTENDANCE_TAB, LINKS_TAB], JSON.parse(keyJson));
const people = parseAttendance(tabs[ATTENDANCE_TAB]);
const links = parseContestLinks(tabs[LINKS_TAB]);

const client = await pool.connect();
try {
  await client.query('BEGIN');

  // Rounds of the current season, by the month they're held in (league time).
  const { rows: rounds } = await client.query(`
    SELECT id, number, kattis_url, upsolve_kattis_url,
           EXTRACT(MONTH FROM starts_at AT TIME ZONE 'America/Edmonton')::int AS month
    FROM rounds
    WHERE season_id = (SELECT id FROM seasons ORDER BY starts_on DESC LIMIT 1)`);
  const roundByMonth = new Map(rounds.map((r) => [r.month, r]));
  const warnings = [];

  // Contest links: a link in the sheet replaces the saved one. An empty cell leaves
  // the saved link alone, so a half-filled sheet never wipes a working contest.
  for (const link of links) {
    const round = roundByMonth.get(link.month);
    if (!round || !(link.main || link.upsolve)) continue;
    const { rowCount } = await client.query(
      `UPDATE rounds SET kattis_url = COALESCE($2, kattis_url), upsolve_kattis_url = COALESCE($3, upsolve_kattis_url)
       WHERE id = $1 AND (kattis_url IS DISTINCT FROM COALESCE($2, kattis_url)
                          OR upsolve_kattis_url IS DISTINCT FROM COALESCE($3, upsolve_kattis_url))`,
      [round.id, link.main, link.upsolve],
    );
    if (rowCount) console.log(`contest ${round.number}: links updated from the sheet`);
  }

  // Roster and attendance: replaced as a whole, so rows deleted in the sheet disappear here too.
  await client.query('DELETE FROM roster');
  let marks = 0;
  for (const person of people) {
    if (!person.kattisId) warnings.push(`row ${person.sheetRow} (${person.name}): no Kattis ID`);
    else if (person.kattisId.includes('@')) {
      warnings.push(`row ${person.sheetRow} (${person.name}): Kattis ID is an email address, not a username`);
    }
    const {
      rows: [row],
    } = await client.query(
      'INSERT INTO roster (sheet_row, name, university, kattis_id) VALUES ($1, $2, $3, $4) RETURNING id',
      [person.sheetRow, person.name, person.university, person.kattisId],
    );
    for (const { month, initials } of person.attended) {
      const round = roundByMonth.get(month);
      if (!round) continue;
      await client.query('INSERT INTO attendance (roster_id, round_id, initials) VALUES ($1, $2, $3)', [
        row.id,
        round.id,
        initials,
      ]);
      marks += 1;
    }
  }

  // Kattis IDs that don't match anyone the scraper has seen (typos, or not on a team yet).
  const { rows: unmatched } = await client.query(`
    SELECT r.sheet_row, r.name, r.kattis_id FROM roster r
    WHERE r.kattis_id IS NOT NULL AND r.kattis_id NOT LIKE '%@%'
      AND NOT EXISTS (SELECT 1 FROM people p WHERE lower(p.kattis_username) = r.kattis_id)
    ORDER BY r.sheet_row`);
  for (const r of unmatched) {
    warnings.push(`row ${r.sheet_row} (${r.name}): no Kattis user "${r.kattis_id}" in any contest yet`);
  }

  await client.query(
    `INSERT INTO sheet_sync (id, synced_at, warnings) VALUES (1, now(), $1)
     ON CONFLICT (id) DO UPDATE SET synced_at = now(), warnings = EXCLUDED.warnings`,
    [JSON.stringify(warnings)],
  );
  await client.query('COMMIT');
  console.log(`sheet: ${people.length} people, ${marks} attendance marks`);
  for (const w of warnings) console.log(`  check ${w}`);
} catch (err) {
  await client.query('ROLLBACK');
  throw err;
} finally {
  client.release();
  await pool.end();
}
