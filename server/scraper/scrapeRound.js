import { pool } from '../src/db/pool.js';
import { fetchStandingsHtml, fetchTeamHtml } from './kattis.js';
import { parseStandings, parseTeamMembers } from './parseStandings.js';
import { saveMembers, saveResults, teamsWithoutMembers } from './saveResults.js';

// Each round has two Kattis contests. A "job" is one of them:
//   { round, kind: 'contest' | 'upsolve', url }
export function jobsFor(round) {
  const jobs = [];
  if (round.kattis_url) jobs.push({ round, kind: 'contest', url: round.kattis_url });
  if (round.upsolve_kattis_url) jobs.push({ round, kind: 'upsolve', url: round.upsolve_kattis_url });
  return jobs;
}

const label = ({ round, kind }) => `contest ${round.number}${kind === 'upsolve' ? ' upsolve' : ''}`;

const pause = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// Scrapes one contest: fetch its standings page, parse it, save the results,
// then read the members of any team we haven't seen before.
export async function scrapeJob(job, pauseMs = 5000) {
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
  await scrapeMembers(job, pauseMs);
  return rows.length;
}

// Each team's members are on its own page, so this is one request per team. Members
// rarely change, so each team is read once per contest; new teams (for example people
// joining the upsolve during the week) are picked up on later runs.
async function scrapeMembers(job, pauseMs) {
  const teamIds = await teamsWithoutMembers(job.round.id, job.kind);
  let read = 0;
  for (const teamId of teamIds) {
    await pause(pauseMs);
    try {
      const members = parseTeamMembers(await fetchTeamHtml(job.url, teamId));
      await saveMembers(job.round.id, job.kind, teamId, members);
      read += 1;
    } catch (err) {
      console.error(`${label(job)}: team ${teamId} members: ${err.message}`);
    }
  }
  if (teamIds.length) console.log(`${label(job)}: read members of ${read} of ${teamIds.length} new teams`);
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
    if (i > 0) await pause(pauseMs);
    try {
      await scrapeJob(job, pauseMs);
    } catch (err) {
      failures += 1;
      console.error(`${label(job)}: ${err.message}`);
    }
  }
  return failures;
}
