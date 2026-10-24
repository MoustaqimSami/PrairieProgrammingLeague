import { Router } from 'express';
import { pool } from '../db/pool.js';

export const leaderboardRouter = Router();

// GET /api/leaderboard: season standings across all rounds.
//
// Scoring rule (a placeholder until the league picks one): most problems solved
// over the season, ties broken by least total penalty time. To change the rule,
// change the SUM()s and the ORDER BY below; the tables stay the same.
leaderboardRouter.get('/', async (req, res) => {
  const { rows } = await pool.query(`
    WITH season AS (SELECT id FROM seasons ORDER BY starts_on DESC LIMIT 1)
    SELECT t.id AS team_id,
           COALESCE(t.display_name, t.kattis_name) AS team,
           t.school,
           SUM(res.solved)::int  AS solved,
           SUM(res.penalty)::int AS penalty,
           COUNT(*)::int         AS rounds_played,
           json_object_agg(r.number, json_build_object(
             'rank', res.rank, 'solved', res.solved, 'penalty', res.penalty
           )) AS by_round
    FROM results res
    JOIN rounds r ON r.id = res.round_id
    JOIN teams t  ON t.id = res.team_id
    WHERE r.season_id = (SELECT id FROM season)
    GROUP BY t.id
    ORDER BY solved DESC, penalty ASC, team
  `);

  // Standard competition ranking: tied teams share a rank, and the next rank skips.
  let rank = 0;
  const ranked = rows.map((row, i) => {
    const prev = rows[i - 1];
    if (!prev || prev.solved !== row.solved || prev.penalty !== row.penalty) rank = i + 1;
    return { rank, ...row };
  });
  res.json(ranked);
});
