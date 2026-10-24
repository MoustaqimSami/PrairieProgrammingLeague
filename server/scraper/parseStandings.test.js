import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { parseStandings } from './parseStandings.js';
import { disallowedPaths } from './kattis.js';

const sample = await readFile(new URL('./fixtures/standings-sample.html', import.meta.url), 'utf8');

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

test('throws when the page has no standings table', () => {
  assert.throws(() => parseStandings('<p>Contest not started</p>'), /No standings table/);
});

test('robots.txt rules for all user agents are honoured', () => {
  const robots = 'User-agent: *\nDisallow: /submissions\nDisallow: /users\n\nUser-agent: OtherBot\nDisallow: /';
  assert.deepEqual(disallowedPaths(robots), ['/submissions', '/users']);
});
