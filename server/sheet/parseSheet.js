// Turns the rows of the PPL attendance sheet into plain data. Pure functions (rows in,
// data out), so they're easy to test without Google.
//
// The sheet has a few note rows at the top, then a header row:
//   Name | University | Kattis ID | Nov | Dec | Jan | Feb | Mar | Apr
// Coaches type their initials under a month when the student was there in person.
// We find columns by their header text, so adding or reordering columns is fine.

const MONTHS = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];
const clean = (cell) => String(cell ?? '').replace(/\s+/g, ' ').trim();

// 'Nov', 'November', 'nov.' -> 11; anything else -> null
export function monthNumber(text) {
  const index = MONTHS.indexOf(clean(text).toLowerCase().slice(0, 3));
  return index === -1 ? null : index + 1;
}

function findHeader(rows, isHeader) {
  const index = rows.findIndex((row) => isHeader(row.map((c) => clean(c).toLowerCase())));
  return index === -1 ? null : index;
}

// Returns rows like
//   { sheetRow: 4, name: 'Ada Lovelace', university: 'UCalgary', kattisId: 'ada-l',
//     attended: [{ month: 11, initials: 'JL' }] }
// sheetRow is the row number you see in Google Sheets, to make problems easy to find.
export function parseAttendance(rows) {
  const headerIndex = findHeader(rows, (h) => h.includes('name') && h.some((c) => c.startsWith('kattis')));
  if (headerIndex === null) throw new Error('Attendance tab: no header row with "Name" and "Kattis ID"');
  const header = rows[headerIndex].map((c) => clean(c).toLowerCase());
  const col = {
    name: header.indexOf('name'),
    university: header.findIndex((h) => h.startsWith('university') || h.startsWith('school')),
    kattis: header.findIndex((h) => h.startsWith('kattis')),
  };
  const monthCols = header
    .map((h, i) => ({ i, month: h.length <= 9 ? monthNumber(h) : null }))
    .filter((c) => c.month !== null);

  const people = [];
  rows.slice(headerIndex + 1).forEach((row, offset) => {
    const name = clean(row[col.name]);
    if (!name) return;
    people.push({
      sheetRow: headerIndex + offset + 2,
      name,
      university: col.university === -1 ? null : clean(row[col.university]) || null,
      // Kattis usernames are lower case; people sometimes paste a profile link instead.
      kattisId: clean(row[col.kattis]).toLowerCase().replace(/^.*\/users\//, '').replace(/\/$/, '') || null,
      attended: monthCols
        .filter(({ i }) => clean(row[i]))
        .map(({ i, month }) => ({ month, initials: clean(row[i]) })),
    });
  });
  return people;
}

// The "Contest Links" tab:  (month) | Main | Upsolve
// Returns rows like { month: 11, main: 'https://open.kattis.com/contests/whasy4', upsolve: '...' },
// with null for an empty or non-Kattis cell.
export function parseContestLinks(rows) {
  const headerIndex = findHeader(rows, (h) => h.includes('main') && h.includes('upsolve'));
  if (headerIndex === null) throw new Error('Contest Links tab: no header row with "Main" and "Upsolve"');
  const header = rows[headerIndex].map((c) => clean(c).toLowerCase());
  const mainCol = header.indexOf('main');
  const upsolveCol = header.indexOf('upsolve');
  const kattisUrl = (cell) => {
    const url = clean(cell).replace(/\/standings\/?$/, '').replace(/\/+$/, '');
    return /^https:\/\/[\w.-]+\.kattis\.com\/contests\/\w+$/.test(url) ? url : null;
  };
  return rows
    .slice(headerIndex + 1)
    .map((row) => ({ month: monthNumber(row[0]), main: kattisUrl(row[mainCol]), upsolve: kattisUrl(row[upsolveCol]) }))
    .filter((row) => row.month !== null);
}
