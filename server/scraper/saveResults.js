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
        `INSERT INTO results (round_id, kind, team_id, rank, solved, penalty)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [roundId, kind, team.id, row.rank, row.solved, row.penalty],
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
