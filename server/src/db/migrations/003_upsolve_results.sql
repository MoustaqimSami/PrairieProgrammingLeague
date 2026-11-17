-- Results now come from two Kattis contests per round: the in-person contest and the
-- week-long upsolve contest. `kind` says which one a row came from.
ALTER TABLE results ADD COLUMN kind TEXT NOT NULL DEFAULT 'contest'
  CHECK (kind IN ('contest', 'upsolve'));
ALTER TABLE results DROP CONSTRAINT results_pkey;
ALTER TABLE results ADD PRIMARY KEY (round_id, kind, team_id);

-- Upsolve standings on Kattis have no penalty time.
ALTER TABLE results ALTER COLUMN penalty DROP NOT NULL;

-- When each contest was last read from Kattis (last_scraped_at is the in-person one).
ALTER TABLE rounds ADD COLUMN upsolve_last_scraped_at TIMESTAMPTZ;
