import pg from 'pg';

if (!process.env.DATABASE_URL) {
  // Without this, pg quietly connects to a Postgres on localhost, which makes it
  // easy to migrate the wrong database by accident.
  throw new Error('DATABASE_URL is not set. Add it to server/.env (see server/.env.example).');
}

// A pool keeps a few database connections open and hands them out per query,
// so each request doesn't pay the cost of connecting to Postgres.
//
// On Vercel each serverless function instance gets its own pool, so we keep it
// to one connection there and let the database's pooler share connections.
export const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
  max: process.env.VERCEL ? 1 : 10,
});
