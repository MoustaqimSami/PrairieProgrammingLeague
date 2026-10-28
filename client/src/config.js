// Site-wide settings that aren't worth a database table.
export const league = {
  name: 'Prairie Programming League',
  shortName: 'PPL',
  contactEmail: 'darcy.best.89@gmail.com',
  // Times come from the API already in league time (see server/src/routes/rounds.js).
  // League time is UTC−6 all year (Alberta and Saskatchewan both, since November 2026).
  timeZoneLabel: '(UTC−6)',
};
