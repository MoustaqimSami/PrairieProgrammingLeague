import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { parseStandings, uniqueNames } from './parseStandings.js';
import { disallowedPaths } from './kattis.js';

const fixture = (name) => readFile(new URL(`./fixtures/${name}`, import.meta.url), 'utf8');
const sample = await fixture('standings-sample.html');
const upsolve = await fixture('upsolve-sample.html');

test('reads every team row from the standings table', () => {
  assert.deepEqual(parseStandings(sample), [
    { team: 'Prairie Dogs', rank: 1, solved: 3, penalty: 187 },
    { team: 'Segfault Saskatoon', rank: 2, solved: 2, penalty: 95 },
    { team: 'Off By One', rank: 3, solved: 1, penalty: 44 },
    { team: 'Bison Search', rank: 3, solved: 1, penalty: 44 },
    { team: 'Team Without Link', rank: 5, solved: 0, penalty: 0 },
  ]);
});

test('a blank rank cell inherits the rank above it (a tie)', () => {
  const html = `<table>
    <tr><th></th><th>Team</th><th>Slv.</th><th>Time</th></tr>
    <tr><td>1</td><td>A</td><td>2</td><td>50</td></tr>
    <tr><td></td><td>B</td><td>2</td><td>50</td></tr>
  </table>`;
  assert.deepEqual(
    parseStandings(html).map((r) => r.rank),
    [1, 1],
  );
});

test('reads the column layout Kattis uses for in-person contests', () => {
  // Shape copied from a real league standings page (Nov 2026), names changed.
  const html = `<table class="table2 sticky-header standings-table"><thead><tr>
    <th class="table-item-autofit font-bold " data-name="rank"> </th>
    <th class=" standings-cell--expand " data-name="team"> Team </th>
    <th class="table-item-autofit standings-cell-score " data-name="solved"> Slv. </th>
    <th class="table-item-autofit standings-cell-time " data-name="penalty"> Time </th>
    <th class=" standings-cell-problem " data-name="problem1"><a href="/contests/x/problems/a" class="col-url"> A </a></th>
    </tr></thead><tbody>
    <tr class=""><td class="table-item-autofit font-bold">1</td>
      <td class=" standings-cell--expand"> <a href="/contests/x/teams/1">squirrel</a> </td>
      <td class="table-item-autofit table-align-right standings-cell-score">7</td>
      <td class="table-item-autofit table-align-right standings-cell-time">159</td>
      <td class=" standings-cell-problem"><span class="solved"><span class="standings-table-result-cell">
        <i class="fas fa-check status-icon cell-solved"> </i><span class="standings-table-result-cell-text">
        <span class="standings-table-result-cell-primary">1</span><br>
        <span class="standings-table-result-cell-time">3 min</span></span></span></span></td></tr>
    </tbody></table>`;
  assert.deepEqual(parseStandings(html), [{ team: 'squirrel', rank: 1, solved: 7, penalty: 159 }]);
});

test('upsolve pages (no rank or time column) are ranked by problems solved', () => {
  assert.deepEqual(parseStandings(upsolve), [
    { team: 'Chen', rank: 1, solved: 3, penalty: null },
    { team: 'Dana', rank: 2, solved: 2, penalty: null },
    { team: 'Alice', rank: 3, solved: 1, penalty: null },
    { team: 'Dana', rank: 3, solved: 1, penalty: null },
    { team: 'bob', rank: 5, solved: 0, penalty: null },
  ]);
});

test('repeated team names in one contest get numbered', () => {
  const rows = uniqueNames(parseStandings(upsolve));
  assert.deepEqual(
    rows.map((r) => r.team),
    ['Chen', 'Dana', 'Alice', 'Dana (2)', 'bob'],
  );
});

test('throws when the page has no standings table', () => {
  assert.throws(() => parseStandings('<p>Contest not started</p>'), /No standings table/);
});

test('robots.txt rules for all user agents are honoured', () => {
  const robots = 'User-agent: *\nDisallow: /submissions\nDisallow: /users\n\nUser-agent: OtherBot\nDisallow: /';
  assert.deepEqual(disallowedPaths(robots), ['/submissions', '/users']);
});

test('robots.txt groups with several user agents are read together', () => {
  // Kattis's current robots.txt allows everyone and blocks a list of named bots, some in groups.
  const robots = 'User-agent: *\nAllow: /\nUser-agent: BotA\nUser-agent: BotB\nDisallow: /\nUser-agent: OtherBot\nUser-agent: *\nDisallow: /private';
  assert.deepEqual(disallowedPaths(robots), ['/private']);
});
