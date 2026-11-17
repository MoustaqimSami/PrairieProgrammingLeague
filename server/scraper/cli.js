// Command-line entry point for the scraper.
//
//   npm run scrape -- --recent           scrape every contest that is running or just ended
//                                        (this is what the scheduled job runs)
//   npm run scrape -- --round 3          scrape both Kattis contests of round 3 now
//   npm run scrape -- --file page.html   parse a saved standings page and print it
//                                        (no network, no database: good for testing)
//   npm run scrape -- --links --round 2 --contest <url> --upsolve <url>
//                                        save a round's Kattis links (either one is fine alone)
import { readFile } from 'node:fs/promises';
import { parseArgs } from 'node:util';
import { parseStandings } from './parseStandings.js';

const { values } = parseArgs({
  options: {
    round: { type: 'string' },
    recent: { type: 'boolean' },
    file: { type: 'string' },
    links: { type: 'boolean' },
    contest: { type: 'string' },
    upsolve: { type: 'string' },
  },
});

if (values.file) {
  console.table(parseStandings(await readFile(values.file, 'utf8')));
  process.exit(0);
}

// Imported here, not at the top, so --file works without a database.
const { pool } = await import('../src/db/pool.js');
const { jobsFor, recentJobs, scrapeJobs } = await import('./scrapeRound.js');

const currentRound = `number = $1 AND season_id = (SELECT id FROM seasons ORDER BY starts_on DESC LIMIT 1)`;
let exitCode = 0;

if (values.links) {
  if (!values.round || !(values.contest || values.upsolve)) {
    console.log('Usage: npm run scrape -- --links --round <n> --contest <url> --upsolve <url>');
    process.exit(1);
  }
  for (const url of [values.contest, values.upsolve].filter(Boolean)) {
    if (!/^https:\/\/[\w.-]+\.kattis\.com\/contests\/\w+\/?$/.test(url)) {
      console.error(`not a Kattis contest link: ${url}`);
      process.exit(1);
    }
  }
  const { rowCount } = await pool.query(
    `UPDATE rounds SET kattis_url = COALESCE($2, kattis_url),
                       upsolve_kattis_url = COALESCE($3, upsolve_kattis_url)
     WHERE ${currentRound}`,
    [values.round, values.contest?.replace(/\/$/, ''), values.upsolve?.replace(/\/$/, '')],
  );
  console.log(rowCount ? `saved links for round ${values.round}` : `no round ${values.round} this season`);
} else if (values.round) {
  const { rows } = await pool.query(`SELECT * FROM rounds WHERE ${currentRound}`, [values.round]);
  const jobs = rows.flatMap(jobsFor);
  if (jobs.length === 0) console.log(`round ${values.round} has no Kattis links yet`);
  if (await scrapeJobs(jobs)) exitCode = 1;
} else if (values.recent) {
  const jobs = await recentJobs();
  if (jobs.length === 0) console.log('nothing running right now, no contests to check');
  if (await scrapeJobs(jobs)) exitCode = 1;
} else {
  console.log('Usage: npm run scrape -- --recent | --round <n> | --file <page.html> | --links ...');
  exitCode = 1;
}

await pool.end();
process.exit(exitCode);
