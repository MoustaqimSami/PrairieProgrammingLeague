// Command-line entry point for the scraper.
//
//   npm run scrape -- --round 3          scrape round 3 of the current season
//   npm run scrape -- --recent           scrape every round from the last 48 hours
//   npm run scrape -- --file page.html   parse a saved standings page and print it
//                                        (no network, no database: good for testing)
import { readFile } from 'node:fs/promises';
import { parseArgs } from 'node:util';
import { pool } from '../src/db/pool.js';
import { parseStandings } from './parseStandings.js';
import { recentRounds, scrapeRounds } from './scrapeRound.js';

const { values } = parseArgs({
  options: {
    round: { type: 'string' },
    recent: { type: 'boolean' },
    file: { type: 'string' },
  },
});

if (values.file) {
  console.table(parseStandings(await readFile(values.file, 'utf8')));
  process.exit(0);
}

let rounds;
if (values.round) {
  const { rows } = await pool.query(
    `SELECT * FROM rounds
     WHERE number = $1 AND season_id = (SELECT id FROM seasons ORDER BY starts_on DESC LIMIT 1)`,
    [values.round],
  );
  rounds = rows;
} else if (values.recent) {
  rounds = await recentRounds();
} else {
  console.log('Usage: npm run scrape -- --round <n> | --recent | --file <page.html>');
  process.exit(1);
}

if (rounds.length === 0) console.log('no matching rounds');
await scrapeRounds(rounds);
await pool.end();
