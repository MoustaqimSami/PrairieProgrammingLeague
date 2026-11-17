import { Router } from 'express';
import { pool } from '../db/pool.js';
import { locationOf } from '../locations.js';

export const leaderboardRouter = Router();

// GET /api/leaderboard: season standings per person, from the in-person contests only
// (upsolve standings are shown per round, see routes/rounds.js).
//
// Every member of a team gets the team's result for that contest. If we couldn't read a
// team's members from Kattis, the team appears under its team name instead.
//
// Scoring rule (a placeholder until tickets replace it): most problems solved over the
// season, ties broken by least total penalty time. To change the rule, change the SUM()s
// and the ORDER BY below; the tables stay the same.
leaderboardRouter.get('/', async (req, res) => {
  const { rows } = await pool.query(`
    WITH season AS (SELECT id FROM seasons ORDER BY starts_on DESC LIMIT 1),
    entries AS (
      SELECT 'p' || p.id AS key, p.name, t.kattis_name AS team,
             -- school from the attendance sheet, matched on Kattis username
             (SELECT ro.university FROM roster ro
              WHERE ro.kattis_id = lower(p.kattis_username) AND ro.university IS NOT NULL
              ORDER BY ro.sheet_row LIMIT 1) AS university,
             r.number, res.rank, res.solved, res.penalty
      FROM results res
      JOIN rounds r ON r.id = res.round_id
      JOIN teams t ON t.id = res.team_id
      JOIN team_members tm ON tm.round_id = res.round_id AND tm.kind = res.kind
                          AND tm.kattis_team_id = res.kattis_team_id
      JOIN people p ON p.id = tm.person_id
      WHERE r.season_id = (SELECT id FROM season) AND res.kind = 'contest'
      UNION ALL
      SELECT 't' || t.id, COALESCE(t.display_name, t.kattis_name), t.kattis_name, NULL,
             r.number, res.rank, res.solved, res.penalty
      FROM results res
      JOIN rounds r ON r.id = res.round_id
      JOIN teams t ON t.id = res.team_id
      WHERE r.season_id = (SELECT id FROM season) AND res.kind = 'contest'
        AND NOT EXISTS (SELECT 1 FROM team_members tm
                        WHERE tm.round_id = res.round_id AND tm.kind = res.kind
                          AND tm.kattis_team_id = res.kattis_team_id)
    )
    SELECT key, name, MAX(university) AS university,
           SUM(solved)::int  AS solved,
           SUM(penalty)::int AS penalty,
           COUNT(*)::int     AS rounds_played,
           json_object_agg(number, json_build_object(
             'rank', rank, 'solved', solved, 'penalty', penalty, 'team', team
           )) AS by_round
    FROM entries
    GROUP BY key, name
    ORDER BY solved DESC, penalty ASC, lower(name)
  `);

  // Standard competition ranking: tied people share a rank, and the next rank skips.
  let rank = 0;
  const ranked = rows.map((row, i) => {
    const prev = rows[i - 1];
    if (!prev || prev.solved !== row.solved || prev.penalty !== row.penalty) rank = i + 1;
    return { rank, ...row, location: locationOf(row.university) };
  });
  res.json(ranked);
});
