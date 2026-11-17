// Keeps running and checks Kattis every 10 minutes. Use this on a machine that stays on.
// The live site doesn't need it: a GitHub Actions workflow (.github/workflows/scrape.yml)
// runs `npm run scrape -- --recent` on a schedule instead.
import cron from 'node-cron';
import { recentJobs, scrapeJobs } from './scrapeRound.js';

async function tick() {
  const jobs = await recentJobs();
  if (jobs.length) await scrapeJobs(jobs);
}

cron.schedule('*/10 * * * *', () => tick().catch((err) => console.error(err)));
console.log('scraper scheduled: every 10 minutes');
tick().catch((err) => console.error(err));
