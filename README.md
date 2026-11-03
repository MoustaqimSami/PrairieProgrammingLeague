# Prairie Programming League

Website for the Prairie Programming League: league info, rules, schedule, links, and a
season leaderboard built automatically from Kattis contest standings.

Built with the **PERN** stack:

| Piece | Where | What it does |
| --- | --- | --- |
| **P**ostgres | database | Stores seasons, rounds, teams and per-round results |
| **E**xpress | `server/` | JSON API: `/api/rounds`, `/api/rounds/:id/results`, `/api/leaderboard` |
| **R**eact | `client/` | The pages people see, built with Vite |
| **N**ode | everywhere | Runs Express and the Kattis scraper |

## How it fits together

```
Browser ──JSON──▶ Express API ──SQL──▶ Postgres
                                          ▲
Kattis standings page ◀──GET── Scraper ───┘ upsert results
```

The website never calls Kattis. A separate scraper reads each round's standings page and
writes results into Postgres; the site only reads from Postgres. If Kattis is slow or
down, the site keeps working and shows the last results it saved.

## The Kattis scraper

> **Parked for now.** The scraper code and tests stay in the repo, but nothing runs it.
> Until a round has results, the leaderboard page shows a countdown to the next contest
> instead, and it switches to real standings automatically once results exist.

Kattis has no API for contest standings, so the scraper reads the standings web page
(`<contest url>/standings`). Kattis's [Terms of Service](https://po.kattis.com/help/tos)
allow this if we:

- **identify ourselves**: set `SCRAPER_USER_AGENT` in `server/.env` to the league site and
  a contact email. The scraper refuses to run until you do.
- **obey robots.txt**: the scraper checks it before each fetch.
- **go easy**: it only checks rounds that ended in the last 48 hours, and waits 5 seconds
  between requests.

The terms also limit public display of Kattis content without permission, so the league
should confirm with Kattis before the leaderboard goes public.

The parser (`server/scraper/parseStandings.js`) finds the table by its column headers
(Team, Slv., Time) instead of CSS classes, so small page changes don't break it. It was
written against a sample page; see `server/scraper/fixtures/README.md` for how to check
it against a real league contest.

Rounds without a Kattis link yet are skipped.

## Changing the content

- About (home page), rules, prizes, ACPC and links are Markdown files in `client/src/content/`.
- League name and contact email are in `client/src/config.js`.
- Contest dates are rows in the `rounds` table. When a contest is created on Kattis, add its links:
  ```sql
  UPDATE rounds SET kattis_url = 'https://open.kattis.com/contests/abc123',
                    upsolve_kattis_url = 'https://open.kattis.com/contests/def456'
  WHERE number = 1;
  ```
- The season scoring rule is the SQL query in `server/src/routes/leaderboard.js`.

