import { Router } from 'express';
import { pool } from '../db/pool.js';

export const roundsRouter = Router();

// League times are shown as wall-clock times in this zone. Postgres converts them
// here, so visitors' browsers never need up-to-date time zone rules (Alberta's
// changed in 2026, and older browsers don't know yet).
const leagueTimeZone = 'America/Edmonton';
const local = (expr) => `to_char((${expr}) AT TIME ZONE $1, 'YYYY-MM-DD"T"HH24:MI')`;

// GET /api/rounds: the schedule for the current season.
roundsRouter.get('/', async (req, res) => {
  const { rows } = await pool.query(
    `SELECT r.id, r.number, r.starts_at, r.format, r.kattis_url, r.upsolve_kattis_url,
            ${local('r.starts_at')} AS starts_local,
            ${local("r.starts_at + make_interval(mins => r.duration_min)")} AS ends_local,
            ${local('r.upsolve_ends_at')} AS upsolve_ends_local,
            r.last_scraped_at, EXISTS (SELECT 1 FROM results WHERE round_id = r.id) AS has_results
     FROM rounds r
     WHERE r.season_id = (SELECT id FROM seasons ORDER BY starts_on DESC LIMIT 1)
     ORDER BY r.number`,
    [leagueTimeZone],
  );
  res.json(rows);
});

// GET /api/rounds/:id/results: standings for a single round.
roundsRouter.get('/:id/results', async (req, res) => {
  const { rows } = await pool.query(
    `SELECT t.id AS team_id, COALESCE(t.display_name, t.kattis_name) AS team, t.school,
            res.rank, res.solved, res.penalty
     FROM results res JOIN teams t ON t.id = res.team_id
     WHERE res.round_id = $1
     ORDER BY res.rank, t.kattis_name`,
    [req.params.id],
  );
  res.json(rows);
});
