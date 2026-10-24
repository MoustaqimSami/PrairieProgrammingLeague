// Fills an empty database with the 2026–27 season schedule.
// Run with: npm run db:seed (safe to re-run; it skips if a season already exists).
//
// Contests are on the second Saturday of each month, November to April:
// in person 11:00 a.m. to 1:30 p.m., then upsolving until noon the next Friday.
// Kattis links are added later, once each contest is created on Kattis:
//   UPDATE rounds SET kattis_url = '...', upsolve_kattis_url = '...' WHERE number = 1;
import { pool } from './pool.js';

const { rows: existing } = await pool.query('SELECT 1 FROM seasons LIMIT 1');
if (existing.length) {
  console.log('database already has a season, skipping seed');
  await pool.end();
  process.exit(0);
}

const {
  rows: [season],
} = await pool.query(
  `INSERT INTO seasons (name, starts_on) VALUES ('2026–27', '2026-11-14') RETURNING id`,
);

const contestDays = ['2026-11-14', '2026-12-12', '2027-01-09', '2027-02-13', '2027-03-13', '2027-04-10'];

for (const [i, day] of contestDays.entries()) {
  // Times are Alberta time. AT TIME ZONE turns a local time into an exact moment.
  await pool.query(
    `INSERT INTO rounds (season_id, number, starts_at, duration_min, format, upsolve_ends_at)
     VALUES ($1, $2,
             ($3::date + time '11:00') AT TIME ZONE 'America/Edmonton',
             150, 'In person',
             ($3::date + 6 + time '12:00') AT TIME ZONE 'America/Edmonton')`,
    [season.id, i + 1, day],
  );
}

console.log(`seeded the ${contestDays.length}-contest 2026–27 season`);
await pool.end();
