-- Kattis links for Contest 1 (November 14, 2026) of the 2026–27 season.
-- Later contests get theirs with: npm run scrape -- --links --round <n> --contest <url> --upsolve <url>
UPDATE rounds
SET kattis_url = 'https://open.kattis.com/contests/whasy4',
    upsolve_kattis_url = 'https://open.kattis.com/contests/yzvj6n'
WHERE number = 1
  AND season_id = (SELECT id FROM seasons WHERE name = '2026–27');
