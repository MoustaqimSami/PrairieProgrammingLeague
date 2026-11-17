import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { parseStandings, parseTeamMembers, uniqueNames } from './parseStandings.js';
import { disallowedPaths } from './kattis.js';

const fixture = (name) => readFile(new URL(`./fixtures/${name}`, import.meta.url), 'utf8');
const sample = await fixture('standings-sample.html');
const upsolve = await fixture('upsolve-sample.html');

test('reads every team row from the standings table', () => {
  assert.deepEqual(parseStandings(sample), [
    { team: 'Prairie Dogs', teamId: 1, rank: 1, solved: 3, penalty: 187 },
    { team: 'Segfault Saskatoon', teamId: 2, rank: 2, solved: 2, penalty: 95 },
    { team: 'Off By One', teamId: 3, rank: 3, solved: 1, penalty: 44 },
    { team: 'Bison Search', teamId: 4, rank: 3, solved: 1, penalty: 44 },
    { team: 'Team Without Link', teamId: null, rank: 5, solved: 0, penalty: 0 },
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
  assert.deepEqual(parseStandings(html), [{ team: 'squirrel', teamId: 1, rank: 1, solved: 7, penalty: 159 }]);
});

test('upsolve pages (no rank or time column) are ranked by problems solved', () => {
  assert.deepEqual(parseStandings(upsolve), [
    { team: 'Chen', teamId: 13, rank: 1, solved: 3, penalty: null },
    { team: 'Dana', teamId: 15, rank: 2, solved: 2, penalty: null },
    { team: 'Alice', teamId: 11, rank: 3, solved: 1, penalty: null },
    { team: 'Dana', teamId: 14, rank: 3, solved: 1, penalty: null },
    { team: 'bob', teamId: 12, rank: 5, solved: 0, penalty: null },
  ]);
});

test('repeated team names in one contest get numbered', () => {
  const rows = uniqueNames(parseStandings(upsolve));
  assert.deepEqual(
    rows.map((r) => r.team),
    ['Chen', 'Dana', 'Alice', 'Dana (2)', 'bob'],
  );
});

test('reads team members (username and name) from a team page', () => {
  // Shape copied from a real Kattis team page (Nov 2026), people made up.
  const html = `<main><table class="table2" id="tblTeamMembers"><thead><tr><th>Name</th></tr></thead><tbody></tbody></table>
    <script nonce="abc" type="application/json" id="team-data"> { "short_name": "x", "team_id": 1, "csrf_token": "123",
      "team_members": [
        {"author_api_id":"a","dispname":true,"name":"Ada  Lovelace","username":"ada-l","profile_url":"\\/users\\/ada-l","accepted":true,"is_me":false},
        {"author_api_id":"b","dispname":true,"name":"","username":"grace99","profile_url":"\\/users\\/grace99","accepted":true,"is_me":false},
        {"author_api_id":"c","dispname":true,"name":"Not Yet","username":"pending","profile_url":"\\/users\\/pending","accepted":false,"is_me":false}
      ] } </script></main>`;
  assert.deepEqual(parseTeamMembers(html), [
    { username: 'ada-l', name: 'Ada Lovelace' },
    { username: 'grace99', name: 'grace99' },
  ]);
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
