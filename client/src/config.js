// Site-wide settings that aren't worth a database table.
export const league = {
  name: 'Prairie Programming League',
  shortName: 'PPL',
  // The contact address is stored in two parts and joined in the browser, so
  // simple spam bots that read the raw HTML don't find it.
  contactEmailParts: ['darcy.best.89', 'gmail.com'],
  siteUrl: 'https://prairieprogrammingleague.vercel.app',
  // Times come from the API already in league time (see server/src/routes/rounds.js).
  // Every host city is on UTC−6 all year (Alberta too, since November 2026),
  // so "local time" is the same everywhere.
  timeZoneLabel: 'local time',
};
