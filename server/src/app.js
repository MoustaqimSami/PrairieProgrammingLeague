import express from 'express';
import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { roundsRouter } from './routes/rounds.js';
import { leaderboardRouter } from './routes/leaderboard.js';

export const app = express();

app.use('/api/rounds', roundsRouter);
app.use('/api/leaderboard', leaderboardRouter);
app.get('/api/health', (req, res) => res.json({ ok: true }));

// In production, Express also serves the built React app from client/dist.
// In development, Vite serves it instead and forwards /api requests here.
const clientDist = fileURLToPath(new URL('../../client/dist', import.meta.url));
if (existsSync(clientDist)) {
  app.use(express.static(clientDist));
  // Any other path is a React page, so send index.html and let React Router decide.
  app.get(/^(?!\/api).*/, (req, res) => res.sendFile('index.html', { root: clientDist }));
}

// Express 5 forwards errors from async routes here automatically.
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: 'Something went wrong' });
});
