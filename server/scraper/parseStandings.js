import * as cheerio from 'cheerio';

// Turns the HTML of a Kattis standings page into rows like
//   { team: 'Prairie Dogs', rank: 1, solved: 6, penalty: 501 }
//
// Kattis has no API for standings, so we read the page itself. Instead of relying
// on CSS class names (which can change without notice), we find the table whose
// header has "Team", "Slv." and "Time" columns and read cells by column position.
// This is a pure function (HTML in, data out), so it's easy to test with saved pages.
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
    const timeCol = headers.findIndex((h) => h.startsWith('time') || h.startsWith('penalty'));
    if (teamCol === -1 || solvedCol === -1 || timeCol === -1) continue;
    // Rank is the first column; on Kattis its header is blank.
    const rankCol = 0;

    const rows = [];
    let lastRank = null;
    for (const tr of $(table).find('tr').toArray()) {
      if ($(tr).closest('tfoot').length) continue;
      const cells = $(tr).children('td').toArray();
      if (cells.length <= Math.max(teamCol, solvedCol, timeCol)) continue;

      const solved = toInt($(cells[solvedCol]).text());
      const penalty = toInt($(cells[timeCol]).text());
      const team = teamName($, cells[teamCol]);
      // Skip summary rows at the bottom of the table (attempts, first solves, ...).
      if (!team || solved === null || penalty === null) continue;

      // Tied teams may share a rank number, or leave the cell blank.
      const rank = toInt($(cells[rankCol]).text()) ?? lastRank ?? rows.length + 1;
      lastRank = rank;
      rows.push({ team, rank, solved, penalty });
    }
    return rows;
  }

  throw new Error('No standings table found (expected columns Team, Slv. and Time)');
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
