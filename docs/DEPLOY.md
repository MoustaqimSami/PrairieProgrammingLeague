# Deploying to Vercel

The site runs on Vercel as two parts:

- **The React site** is built once (`npm run build`) into static files in `client/dist`, which Vercel serves from its CDN.
- **The Express API** runs as one *serverless function*, `api/index.js`. Instead of a server that's always on, Vercel starts the function when a request to `/api/...` arrives.

The database lives outside Vercel, on **Neon** (hosted Postgres), which you add from Vercel's Storage tab in a couple of clicks.

## What's already set up in the repo

| File | What it does |
| --- | --- |
| `vercel.json` | Tells Vercel how to build (`npm run build`), where the built site is (`client/dist`), and how to route: `/api/*` goes to the function, everything else to `index.html` so React Router can show the right page |
| `api/index.js` | The serverless function. It just exports the same Express app the local server uses |
| `server/src/db/pool.js` | Uses 1 database connection per function instance on Vercel, so lots of instances don't exhaust the database |

## Steps

### 1. Import the project

1. Go to [vercel.com](https://vercel.com) and sign up with your GitHub account.
2. **Add New… → Project**, then pick `PrairieProgrammingLeague` (if it isn't listed, click "Adjust GitHub App Permissions" and allow the repo).
3. On the configure screen, set **Framework Preset** to **Other** and make sure **Root Directory** is the repo root (`./`), **not** `client`. Vercel may suggest `client` because it spots the React app there; if you accept it, `vercel.json` is ignored and the build fails with "No Output Directory named dist". Leave the build and output overrides off: `vercel.json` sets them.
4. Click **Deploy**. In a minute you'll have a URL like `prairie-programming-league.vercel.app`.

The pages will load, but the schedule will say it can't load yet: there's no database.

### 2. Add a database

1. In your project, open the **Storage** tab → **Create Database** → choose **Neon** (Serverless Postgres) → pick the free plan and a region close to the prairies (e.g. US East or Canada if offered).
2. Connect it to the project for all environments (Production, Preview, Development).
3. Check **Settings → Environment Variables**: you should see `DATABASE_URL`. That's the one our code reads.

### 3. Create the tables and the schedule

The database starts empty, so run our migrations and seed against it from your computer:

```sh
npm install -g vercel          # Vercel's command-line tool
vercel login
vercel link                    # run in the repo folder; pick the project you just made
vercel env pull server/.env    # downloads DATABASE_URL into server/.env (Git ignores it)
npm run db:migrate
npm run db:seed
```

Careful: after this, your local `server/.env` points at the **live** database. To go back to your local one, change `DATABASE_URL` back (or keep the live one in a separate file).

### 4. Redeploy

Environment variables only reach deployments made after they were added. Go to **Deployments**, open the menu on the latest one, and click **Redeploy**.

Then check:

- `https://<your-url>/api/health` shows `{"ok":true}`
- the Schedule page lists the six contests
- the Leaderboard shows the countdown

### 5. Optional: a custom domain

**Settings → Domains → Add**, type the domain (e.g. `prairieprogramming.ca`), and follow the DNS instructions Vercel shows for wherever the domain was bought.

## After that

- **Every push to `main` deploys automatically.** Pull requests get their own preview URL.
- **Adding Kattis links:** connect to the live database (Neon's dashboard has an SQL editor) and run the `UPDATE rounds ...` statement from the README.
- **The scraper doesn't run on Vercel.** Serverless functions can't run in the background. If we bring the scraper back, it would use a [Vercel Cron Job](https://vercel.com/docs/cron-jobs) calling a small API route.
- Vercel's free Hobby plan is for non-commercial projects, which fits a student league.
