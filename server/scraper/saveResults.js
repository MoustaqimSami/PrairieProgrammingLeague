import { pool } from '../src/db/pool.js';
import { uniqueNames } from './parseStandings.js';

// Saves the standings of one of a round's Kattis contests (kind is 'contest' for the
// in-person round, 'upsolve' for the upsolve round). Runs in a transaction: teams are
// created if new, and that contest's results are replaced as a whole, so the database
// never holds a half-written round.
export async function saveResults(roundId, kind, rows) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await client.query('DELETE FROM results WHERE round_id = $1 AND kind = $2', [roundId, kind]);
    for (const row of uniqueNames(rows)) {
      // Insert the team if we haven't seen it, and get its id either way.
      const {
        rows: [team],
      } = await client.query(
        `INSERT INTO teams (kattis_name) VALUES ($1)
         ON CONFLICT (kattis_name) DO UPDATE SET kattis_name = EXCLUDED.kattis_name
         RETURNING id`,
        [row.team],
      );
      await client.query(
        `INSERT INTO results (round_id, kind, team_id, kattis_team_id, rank, solved, penalty)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [roundId, kind, team.id, row.teamId, row.rank, row.solved, row.penalty],
      );
    }
    const column = kind === 'upsolve' ? 'upsolve_last_scraped_at' : 'last_scraped_at';
    await client.query(`UPDATE rounds SET ${column} = now() WHERE id = $1`, [roundId]);
    await client.query('COMMIT');
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

// Teams in this contest whose members we haven't read yet.
export async function teamsWithoutMembers(roundId, kind) {
  const { rows } = await pool.query(
    `SELECT res.kattis_team_id FROM results res
     WHERE res.round_id = $1 AND res.kind = $2 AND res.kattis_team_id IS NOT NULL
       AND NOT EXISTS (SELECT 1 FROM team_members tm
                       WHERE tm.round_id = res.round_id AND tm.kind = res.kind
                         AND tm.kattis_team_id = res.kattis_team_id)
     ORDER BY res.rank`,
    [roundId, kind],
  );
  return rows.map((r) => r.kattis_team_id);
}

// Saves one team's members, adding new people and updating names that changed.
export async function saveMembers(roundId, kind, kattisTeamId, members) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await client.query(
      'DELETE FROM team_members WHERE round_id = $1 AND kind = $2 AND kattis_team_id = $3',
      [roundId, kind, kattisTeamId],
    );
    for (const member of members) {
      const {
        rows: [person],
      } = await client.query(
        `INSERT INTO people (kattis_username, name) VALUES ($1, $2)
         ON CONFLICT (kattis_username) DO UPDATE SET name = EXCLUDED.name
         RETURNING id`,
        [member.username, member.name],
      );
      await client.query(
        `INSERT INTO team_members (round_id, kind, kattis_team_id, person_id) VALUES ($1, $2, $3, $4)
         ON CONFLICT DO NOTHING`,
        [roundId, kind, kattisTeamId, person.id],
      );
    }
    await client.query('COMMIT');
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}
