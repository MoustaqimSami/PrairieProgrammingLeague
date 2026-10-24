// Keeps running and scrapes recent rounds every 15 minutes.
// Use this on a machine that stays on. On a host with built-in cron jobs
// (like Render), schedule `npm run scrape -- --recent` there instead.
import cron from 'node-cron';
import { recentRounds, scrapeRounds } from './scrapeRound.js';

async function tick() {
  const rounds = await recentRounds();
  if (rounds.length) await scrapeRounds(rounds);
}

cron.schedule('*/15 * * * *', () => tick().catch((err) => console.error(err)));
console.log('scraper scheduled: every 15 minutes');
tick().catch((err) => console.error(err));
