-- People, so the leaderboard can show names (and later count each person's tickets).
-- A person is identified by their Kattis username, which never changes; `name` is the
-- name they show on Kattis and is refreshed on each scrape.
CREATE TABLE people (
  id               SERIAL PRIMARY KEY,
  kattis_username  TEXT NOT NULL UNIQUE,
  name             TEXT NOT NULL
);

-- Kattis's id for the team in that contest, from the standings page. Team ids are new
-- in every contest, so they only mean something together with round_id and kind.
ALTER TABLE results ADD COLUMN kattis_team_id INT;

-- Who was on each team, per contest. Filled from each team's page on Kattis, once per team.
CREATE TABLE team_members (
  round_id        INT  NOT NULL REFERENCES rounds(id) ON DELETE CASCADE,
  kind            TEXT NOT NULL CHECK (kind IN ('contest', 'upsolve')),
  kattis_team_id  INT  NOT NULL,
  person_id       INT  NOT NULL REFERENCES people(id),
  PRIMARY KEY (round_id, kind, kattis_team_id, person_id)
);
