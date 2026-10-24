import { pool } from '../src/db/pool.js';

// Saves one round's standings. Runs in a transaction: teams are created if new,
// and the round's results are replaced as a whole, so the database never holds
// a half-written round.
export async function saveResults(roundId, rows) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await client.query('DELETE FROM results WHERE round_id = $1', [roundId]);
    for (const row of rows) {
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
        `INSERT INTO results (round_id, team_id, rank, solved, penalty)
         VALUES ($1, $2, $3, $4, $5)
         ON CONFLICT (round_id, team_id) DO UPDATE
           SET rank = EXCLUDED.rank, solved = EXCLUDED.solved, penalty = EXCLUDED.penalty`,
        [roundId, team.id, row.rank, row.solved, row.penalty],
      );
    }
    await client.query('UPDATE rounds SET last_scraped_at = now() WHERE id = $1', [roundId]);
    await client.query('COMMIT');
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}
