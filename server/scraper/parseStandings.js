import * as cheerio from 'cheerio';

// Turns the HTML of a Kattis standings page into rows like
//   { team: 'Prairie Dogs', rank: 1, solved: 6, penalty: 501 }
//
// Kattis has no API for standings, so we read the page itself. Instead of relying
// on CSS class names (which can change without notice), we find the table whose
// header has "Team" and "Slv." columns and read cells by column position.
// This is a pure function (HTML in, data out), so it's easy to test with saved pages.
//
// Kattis shows two kinds of standings, and we read both:
//   - a normal contest (the in-person round): rank, Team, Slv., Time, one column per problem
//   - an upsolve-style contest: Team, Slv., one column per problem. No rank, no penalty
//     time, and the rows are in alphabetical order. For these, `penalty` is null and we
//     work out the rank ourselves from the number of problems solved.
export function parseStandings(html) {
  const $ = cheerio.load(html);

  for (const table of $('table').toArray()) {
    const headerRow = $(table).find('tr').filter((_, tr) => $(tr).find('th').length > 0).first();
    const headers = headerRow
      .find('th')
      .toArray()
      .map((th) => $(th).text().trim().toLowerCase());

    const teamCol = headers.findIndex((h) => h.startsWith('team'));
    const solvedCol = headers.findIndex((h) => h.startsWith('slv') || h.startsWith('solved'));
    if (teamCol === -1 || solvedCol === -1) continue;
    const timeCol = headers.findIndex((h) => h.startsWith('time') || h.startsWith('penalty'));
    // On Kattis the rank column comes first with a blank header. Upsolve pages leave it out,
    // so the team is the first column there.
    const rankCol = teamCol > 0 ? 0 : -1;

    const rows = [];
    let lastRank = null;
    for (const tr of $(table).find('tr').toArray()) {
      if ($(tr).closest('tfoot').length) continue;
      const cells = $(tr).children('td').toArray();
      if (cells.length <= Math.max(teamCol, solvedCol, timeCol)) continue;

      const solved = toInt($(cells[solvedCol]).text());
      const penalty = timeCol === -1 ? null : toInt($(cells[timeCol]).text());
      const team = teamName($, cells[teamCol]);
      // Skip summary rows at the bottom of the table (attempts, first solves, ...).
      if (!team || solved === null || (timeCol !== -1 && penalty === null)) continue;

      if (rankCol === -1) {
        rows.push({ team, rank: null, solved, penalty });
        continue;
      }
      // Tied teams may share a rank number, or leave the cell blank.
      const rank = toInt($(cells[rankCol]).text()) ?? lastRank ?? rows.length + 1;
      lastRank = rank;
      rows.push({ team, rank, solved, penalty });
    }
    return rankCol === -1 ? rankBySolved(rows) : rows;
  }

  throw new Error('No standings table found (expected columns Team and Slv.)');
}

// For pages without a rank column: most problems solved first, ties share a rank
// (1, 2, 2, 4, ...), and tied teams stay in the order Kattis listed them.
function rankBySolved(rows) {
  const sorted = rows
    .map((row, i) => ({ row, i }))
    .sort((a, b) => b.row.solved - a.row.solved || a.i - b.i)
    .map(({ row }) => row);
  let rank = 0;
  return sorted.map((row, i) => {
    if (i === 0 || sorted[i - 1].solved !== row.solved) rank = i + 1;
    return { ...row, rank };
  });
}

function toInt(text) {
  const match = text.replace(/\s+/g, ' ').match(/-?\d+/);
  return match ? Number(match[0]) : null;
}

// The team cell can also hold the school or member names. The team name itself
// is the link to the team's page, so prefer that and fall back to the cell text.
function teamName($, cell) {
  const link = $(cell).find('a').first();
  const text = (link.length ? link.text() : $(cell).text()).replace(/\s+/g, ' ').trim();
  return text || null;
}

// Teams are matched across contests by their Kattis name, but two different teams can
// pick the same name in one contest (it happens: two "Harry"s). Number the repeats,
// "Harry", "Harry (2)", so neither result is lost.
export function uniqueNames(rows) {
  const seen = new Map();
  return rows.map((row) => {
    const count = (seen.get(row.team) ?? 0) + 1;
    seen.set(row.team, count);
    return count === 1 ? row : { ...row, team: `${row.team} (${count})` };
  });
}
