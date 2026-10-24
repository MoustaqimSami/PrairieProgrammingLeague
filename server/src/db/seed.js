// Fills an empty database with a sample season so the site has something to show.
// Run with: npm run db:seed (safe to re-run; it skips if a season already exists).
import { pool } from './pool.js';
import { saveResults } from '../../scraper/saveResults.js';

const { rows: existing } = await pool.query('SELECT 1 FROM seasons LIMIT 1');
if (existing.length) {
  console.log('database already has a season, skipping seed');
  await pool.end();
  process.exit(0);
}

const {
  rows: [season],
} = await pool.query(
  `INSERT INTO seasons (name, starts_on) VALUES ('Fall 2026', '2026-09-12') RETURNING id`,
);

// Placeholder rounds. Replace the dates and Kattis links with the real ones.
const rounds = [
  [1, '2026-09-12 13:00-05', 'Full', 'https://open.kattis.com/contests/example1'],
  [2, '2026-10-03 13:00-05', 'Sprint', 'https://open.kattis.com/contests/example2'],
  [3, '2026-10-24 13:00-05', 'Full', 'https://open.kattis.com/contests/example3'],
  [4, '2026-11-14 13:00-06', 'Full', 'https://open.kattis.com/contests/example4'],
];
const roundIds = [];
for (const [number, startsAt, format, url] of rounds) {
  const { rows } = await pool.query(
    `INSERT INTO rounds (season_id, number, starts_at, format, kattis_url)
     VALUES ($1, $2, $3, $4, $5) RETURNING id`,
    [season.id, number, startsAt, format, url],
  );
  roundIds.push(rows[0].id);
}

// Made-up results for the first two rounds, in the same shape the scraper produces.
await saveResults(roundIds[0], [
  { team: 'Segfault Saskatoon', rank: 1, solved: 7, penalty: 612 },
  { team: 'Prairie Dogs', rank: 2, solved: 6, penalty: 501 },
  { team: 'Off By One', rank: 3, solved: 6, penalty: 688 },
  { team: 'Bison Search', rank: 4, solved: 4, penalty: 390 },
]);
await saveResults(roundIds[1], [
  { team: 'Prairie Dogs', rank: 1, solved: 5, penalty: 280 },
  { team: 'Bison Search', rank: 2, solved: 5, penalty: 331 },
  { team: 'Segfault Saskatoon', rank: 3, solved: 4, penalty: 210 },
  { team: 'Off By One', rank: 4, solved: 2, penalty: 95 },
]);

console.log('seeded sample season');
await pool.end();
