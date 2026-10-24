-- One row per league season (e.g. "Fall 2026").
CREATE TABLE seasons (
  id         SERIAL PRIMARY KEY,
  name       TEXT NOT NULL,
  starts_on  DATE NOT NULL
);

-- One row per contest round. Each round is a Kattis contest.
CREATE TABLE rounds (
  id              SERIAL PRIMARY KEY,
  season_id       INT NOT NULL REFERENCES seasons(id),
  number          INT NOT NULL,
  starts_at       TIMESTAMPTZ NOT NULL,
  duration_min    INT NOT NULL DEFAULT 180,
  format          TEXT NOT NULL,
  kattis_url      TEXT NOT NULL,       -- https://<host>.kattis.com/contests/<id>
  last_scraped_at TIMESTAMPTZ,
  UNIQUE (season_id, number)
);

-- Teams are identified by the name they use on Kattis.
CREATE TABLE teams (
  id           SERIAL PRIMARY KEY,
  kattis_name  TEXT NOT NULL UNIQUE,
  display_name TEXT,
  school       TEXT
);

-- One row per team per round. The primary key means re-scraping a round
-- updates existing rows instead of creating duplicates.
CREATE TABLE results (
  round_id  INT NOT NULL REFERENCES rounds(id) ON DELETE CASCADE,
  team_id   INT NOT NULL REFERENCES teams(id),
  rank      INT NOT NULL,
  solved    INT NOT NULL,
  penalty   INT NOT NULL,              -- minutes
  PRIMARY KEY (round_id, team_id)
);
