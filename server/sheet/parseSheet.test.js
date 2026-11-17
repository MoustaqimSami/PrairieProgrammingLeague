import { test } from 'node:test';
import assert from 'node:assert/strict';
import { monthNumber, parseAttendance, parseContestLinks } from './parseSheet.js';

// Same shape as the real PPL attendance sheet (Nov 2026); people made up.
const attendance = [
  ['Please only share this Sheet with coaches/organizers at your site'],
  ['', '', '', 'Type your initials to verify they were in-person for the primary contest'],
  ['Name', 'University', 'Kattis ID', 'Nov', 'Dec', 'Jan', 'Feb', 'Mar', 'Apr'],
  ['Ada Lovelace', 'UCalgary', 'ada-l', 'JL', 'DB'],
  ['Grace  Hopper', 'ULethbridge', ' https://open.kattis.com/users/Grace99 ', '', 'HW'],
  ['', '', '', ''],
  ['Alan Turing', 'USaskatchewan', 'alan@example.com', 'JL'],
  ['No Id Yet', '', ''],
];

test('reads people, schools, Kattis ids and attendance from the sheet', () => {
  assert.deepEqual(parseAttendance(attendance), [
    { sheetRow: 4, name: 'Ada Lovelace', university: 'UCalgary', kattisId: 'ada-l',
      attended: [{ month: 11, initials: 'JL' }, { month: 12, initials: 'DB' }] },
    { sheetRow: 5, name: 'Grace Hopper', university: 'ULethbridge', kattisId: 'grace99',
      attended: [{ month: 12, initials: 'HW' }] },
    { sheetRow: 7, name: 'Alan Turing', university: 'USaskatchewan', kattisId: 'alan@example.com',
      attended: [{ month: 11, initials: 'JL' }] },
    { sheetRow: 8, name: 'No Id Yet', university: null, kattisId: null, attended: [] },
  ]);
});

test('finds columns by header, in any order', () => {
  const rows = [['Kattis ID', 'Dec', 'Name'], ['bob', 'x', 'Bob']];
  assert.deepEqual(parseAttendance(rows), [
    { sheetRow: 2, name: 'Bob', university: null, kattisId: 'bob', attended: [{ month: 12, initials: 'x' }] },
  ]);
});

test('reads contest links by month and ignores non-Kattis text', () => {
  const rows = [
    ['', 'Main', 'Upsolve'],
    ['November', 'https://open.kattis.com/contests/whasy4', 'https://open.kattis.com/contests/yzvj6n/standings'],
    ['December', 'TBD', ''],
    ['January'],
  ];
  assert.deepEqual(parseContestLinks(rows), [
    { month: 11, main: 'https://open.kattis.com/contests/whasy4', upsolve: 'https://open.kattis.com/contests/yzvj6n' },
    { month: 12, main: null, upsolve: null },
    { month: 1, main: null, upsolve: null },
  ]);
});

test('month names', () => {
  assert.equal(monthNumber('Nov'), 11);
  assert.equal(monthNumber(' april '), 4);
  assert.equal(monthNumber('Name'), null);
});
