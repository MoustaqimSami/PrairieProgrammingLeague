-- A copy of the attendance Google Sheet (the "roster"), replaced on every sync.
-- The sheet is the source of truth: edit it there, never here.
CREATE TABLE roster (
  id          SERIAL PRIMARY KEY,
  sheet_row   INT  NOT NULL,          -- row number in the sheet, to find problems
  name        TEXT NOT NULL,
  university  TEXT,
  kattis_id   TEXT                    -- Kattis username, lower case
);
CREATE INDEX roster_kattis_id ON roster (kattis_id);

-- Who was there in person, from the month columns (coaches type their initials).
CREATE TABLE attendance (
  roster_id  INT  NOT NULL REFERENCES roster(id) ON DELETE CASCADE,
  round_id   INT  NOT NULL REFERENCES rounds(id) ON DELETE CASCADE,
  initials   TEXT NOT NULL,
  PRIMARY KEY (roster_id, round_id)
);

-- When the sheet was last copied, and anything worth fixing in it.
CREATE TABLE sheet_sync (
  id         INT PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  synced_at  TIMESTAMPTZ NOT NULL,
  warnings   JSONB NOT NULL DEFAULT '[]'
);
