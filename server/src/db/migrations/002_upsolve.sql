-- Each PPL contest day has two Kattis contests: the in-person round and a week-long
-- upsolve round. Kattis links are often created close to the date, so they can be empty.
ALTER TABLE rounds ALTER COLUMN kattis_url DROP NOT NULL;
ALTER TABLE rounds ADD COLUMN upsolve_kattis_url TEXT;
ALTER TABLE rounds ADD COLUMN upsolve_ends_at TIMESTAMPTZ;
