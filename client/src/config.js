// Site-wide settings that aren't worth a database table.
export const league = {
  name: 'Prairie Programming League',
  shortName: 'PPL',
  contactEmail: 'league@example.com', // TODO: real contact address
  // Times come from the API already in league time (see server/src/routes/rounds.js).
  // Since November 2026 Alberta and Saskatchewan share the same clock time.
  timeZoneLabel: 'Alberta/Saskatchewan',
};
