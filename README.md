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

Each contest day has two Kattis contests: the in-person contest (11:00 to 1:30) and the
upsolve contest (until noon the next Friday). The scraper reads both standings pages and
saves them in the `results` table, with `kind` set to `contest` or `upsolve`. The
leaderboard's season standings use the in-person results; each round's upsolve standings
can be picked from the "Show" menu.

**How it runs:** a GitHub Actions workflow, `.github/workflows/scrape.yml`, runs
`npm run scrape -- --recent` every 10 minutes during Saturday contests and every 30
minutes otherwise. The scraper works out which contests are running or just ended and
only fetches those, so most runs don't touch Kattis at all. Vercel can't do this on the
free plan (its cron jobs run at most once a day). Setup steps are in `docs/DEPLOY.md`.

Kattis has no API for contest standings, so the scraper reads the standings web page
(`<contest url>/standings`). Kattis's [Terms of Service](https://po.kattis.com/help/tos)
allow this if we:

- **identify ourselves**: requests are sent as `PrairieProgrammingLeagueBot/1.0` with a link
  to the site's contact section. Set `SCRAPER_USER_AGENT` to change it.
- **obey robots.txt**: the scraper checks it before each fetch.
- **go easy**: a contest is checked while it runs and for 6 hours after (plus one final
  read if we missed it), with 5 seconds between requests.

The terms also limit public display of Kattis content without permission, so the league
should confirm with Kattis that showing standings on this site is fine.

The parser (`server/scraper/parseStandings.js`) finds the table by its column headers
(Team, Slv., and Time when there is one) instead of CSS classes, so small page changes
don't break it. Upsolve pages have no rank or time column and list people alphabetically,
so the parser ranks them by problems solved. If two entries in one contest share a name,
the second is saved as "Name (2)".

**People:** the standings only show team names, so after saving a contest the scraper
opens each new team's page (`<contest url>/teams/<id>`) and reads its members from the
JSON block Kattis puts there: their Kattis username (which never changes) and the name
they show. They go in the `people` and `team_members` tables. Each team is read once per
contest, so the first run after a contest makes one extra request per team. The
leaderboard shows people's names, with the team name underneath, and the season
standings are per person (everyone on a team gets the team's result).

Useful commands (run from the repo root; they use `DATABASE_URL` from `server/.env`):

```sh
npm run scrape -- --recent        # what the scheduled job runs
npm run scrape -- --round 1       # re-read both contests of round 1 right now
npm run scrape -- --file page.html   # parse a saved page and print it (no network, no database)
npm run scrape -- --links --round 2 --contest https://open.kattis.com/contests/abc123 \
                                    --upsolve https://open.kattis.com/contests/def456
```

## The attendance sheet

A Google Sheet kept by the coaches is the source of truth for attendance, each student's
school and the monthly Kattis links. `npm run sheet:sync` (`server/sheet/`) copies it into
the `roster`, `attendance` and `rounds` tables; the scheduled job runs it before every
scrape. Students are matched to Kattis by the sheet's Kattis ID column (their username).
The leaderboard uses the school for its School column and Location filter. Setup is in
`docs/DEPLOY.md`, "Connecting the attendance sheet".

## Changing the content

- About (home page), rules, prizes, ACPC and links are Markdown files in `client/src/content/`.
- League name and contact email are in `client/src/config.js`.
- Contest dates are rows in the `rounds` table. When a contest is created on Kattis, add its
  links to the sheet's Contest Links tab (or use `npm run scrape -- --links ...`). The
  schedule, home page and scraper all pick them up from there.
- The season scoring rule is the SQL query in `server/src/routes/leaderboard.js`.

