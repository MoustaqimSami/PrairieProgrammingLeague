import { pool } from '../src/db/pool.js';
import { fetchStandingsHtml } from './kattis.js';
import { parseStandings } from './parseStandings.js';
import { saveResults } from './saveResults.js';

// Each round has two Kattis contests. A "job" is one of them:
//   { round, kind: 'contest' | 'upsolve', url }
export function jobsFor(round) {
  const jobs = [];
  if (round.kattis_url) jobs.push({ round, kind: 'contest', url: round.kattis_url });
  if (round.upsolve_kattis_url) jobs.push({ round, kind: 'upsolve', url: round.upsolve_kattis_url });
  return jobs;
}

const label = ({ round, kind }) => `contest ${round.number}${kind === 'upsolve' ? ' upsolve' : ''}`;

// Scrapes one contest: fetch its standings page, parse it, save the results.
export async function scrapeJob(job) {
  const html = await fetchStandingsHtml(job.url);
  const rows = parseStandings(html);
  // An empty table usually means the page changed or the contest hasn't started.
  // Keep whatever we saved last time rather than wiping the round.
  if (rows.length === 0) {
    console.warn(`${label(job)}: no teams found, keeping previous results`);
    return 0;
  }
  await saveResults(job.round.id, job.kind, rows);
  console.log(`${label(job)}: saved ${rows.length} teams`);
  return rows.length;
}

// Contests worth checking right now. A contest is checked while it runs and for
// 6 hours after it ends (in case Kattis updates late), and once more later if we
// never managed to read it after it ended. After that its results are final and
// we leave Kattis alone.
//   in-person contest: starts_at  until  starts_at + duration
//   upsolve contest:   end of the in-person contest  until  upsolve_ends_at
export async function recentJobs() {
  const { rows } = await pool.query(`
    SELECT *,
           starts_at + make_interval(mins => duration_min) AS ends_at
    FROM rounds
    WHERE kattis_url IS NOT NULL OR upsolve_kattis_url IS NOT NULL
    ORDER BY starts_at
  `);
  const now = Date.now();
  const hours = (h) => h * 3600 * 1000;
  const due = (start, end, lastScraped) =>
    start != null &&
    end != null &&
    now >= start.getTime() &&
    (now <= end.getTime() + hours(6) || !lastScraped || lastScraped < end);

  return rows.flatMap((round) =>
    jobsFor(round).filter(({ kind }) =>
      kind === 'contest'
        ? due(round.starts_at, round.ends_at, round.last_scraped_at)
        : due(round.ends_at, round.upsolve_ends_at, round.upsolve_last_scraped_at),
    ),
  );
}

// Scrapes contests one at a time with a pause between requests, to stay gentle on Kattis.
// Returns how many failed, so the command can exit with an error.
export async function scrapeJobs(jobs, pauseMs = 5000) {
  let failures = 0;
  for (const [i, job] of jobs.entries()) {
    if (i > 0) await new Promise((resolve) => setTimeout(resolve, pauseMs));
    try {
      await scrapeJob(job);
    } catch (err) {
      failures += 1;
      console.error(`${label(job)}: ${err.message}`);
    }
  }
  return failures;
}
