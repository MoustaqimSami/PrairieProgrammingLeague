import pg from 'pg';

// A pool keeps a few database connections open and hands them out per query,
// so each request doesn't pay the cost of connecting to Postgres.
export const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
});
