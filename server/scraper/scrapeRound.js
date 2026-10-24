import { pool } from '../src/db/pool.js';
import { fetchStandingsHtml } from './kattis.js';
import { parseStandings } from './parseStandings.js';
import { saveResults } from './saveResults.js';

// Scrapes one round: fetch its standings page, parse it, save the results.
export async function scrapeRound(round) {
  const html = await fetchStandingsHtml(round.kattis_url);
  const rows = parseStandings(html);
  // An empty table usually means the page changed or the contest hasn't started.
  // Keep whatever we saved last time rather than wiping the round.
  if (rows.length === 0) {
    console.warn(`round ${round.number}: no teams found, keeping previous results`);
    return 0;
  }
  await saveResults(round.id, rows);
  console.log(`round ${round.number}: saved ${rows.length} teams`);
  return rows.length;
}

// Rounds worth checking: started already, and ended less than 48 hours ago.
// Older rounds are final, so we leave Kattis alone.
export async function recentRounds() {
  const { rows } = await pool.query(`
    SELECT * FROM rounds
    WHERE starts_at <= now()
      AND starts_at + make_interval(mins => duration_min) + interval '48 hours' >= now()
    ORDER BY starts_at
  `);
  return rows;
}

// Scrapes rounds one at a time with a pause between requests, to stay gentle on Kattis.
export async function scrapeRounds(rounds, pauseMs = 5000) {
  for (const [i, round] of rounds.entries()) {
    if (i > 0) await new Promise((resolve) => setTimeout(resolve, pauseMs));
    try {
      await scrapeRound(round);
    } catch (err) {
      console.error(`round ${round.number}: ${err.message}`);
    }
  }
}
