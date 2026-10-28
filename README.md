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

## Local setup

You need **Node.js 22+** and **Postgres 16+**.

1. **Install Node.js** from [nodejs.org](https://nodejs.org) (the LTS version). Check with
   `node -v`.
2. **Install Postgres.** Easiest options: [Postgres.app](https://postgresapp.com) on Mac,
   the [installer](https://www.postgresql.org/download/) on Windows, or Docker:
   ```sh
   docker run --name ppl-db -e POSTGRES_PASSWORD=dev -p 5432:5432 -d postgres:16
   ```
3. **Install dependencies** (one command installs both `client/` and `server/`, because
   this repo is an npm workspace):
   ```sh
   npm install
   ```
4. **Create the database:**
   ```sh
   createdb -U postgres prairie_league
   # or with Docker: docker exec -it ppl-db createdb -U postgres prairie_league
   ```
5. **Configure the server.** Copy the example settings and edit them:
   ```sh
   cp server/.env.example server/.env
   ```
   `.env` holds your database password, so Git ignores it.
6. **Create the tables and sample data:**
   ```sh
   npm run db:migrate   # runs server/src/db/migrations/*.sql in order
   npm run db:seed      # adds the 2026–27 schedule
   ```
7. **Start everything:**
   ```sh
   npm run dev
   ```
   This starts Express on port 3001 and Vite on port 5173. Open
   <http://localhost:5173>. Vite forwards `/api/...` requests to Express.

## Scripts

| Command | What it does |
| --- | --- |
| `npm run dev` | API + website with live reload |
| `npm test` | Runs the scraper tests (no network or database needed) |
| `npm run db:migrate` | Applies any new migration files |
| `npm run db:seed` | Adds the 2026–27 schedule to an empty database |
| `npm run scrape -- --round 3` | Scrapes round 3 of the current season from Kattis |
| `npm run scrape -- --recent` | Scrapes every round that ended in the last 48 hours |
| `npm run scrape -- --file page.html` | Parses a saved standings page and prints it |
| `npm run build` then `npm start` | Production: Express serves the built site and the API |

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

## Still to do

- [ ] Kattis contest links for each round
- [ ] Discord or social links
- [ ] Confirm with Kattis that we may display standings publicly
- [ ] Decide whether the site should track draw tickets (needs a student roster)
- [ ] Choose a host and deploy
