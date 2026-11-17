// Which city each university or school is in, for the leaderboard's location filter.
// Keys are lower case with spaces and dots removed, so "U of Calgary"-style variants can
// be added in one line. A school that isn't listed shows under its own name.
const cityBySchool = {
  ucalgary: 'Calgary',
  universityofcalgary: 'Calgary',
  mountroyal: 'Calgary',
  mountroyaluniversity: 'Calgary',
  sait: 'Calgary',
  ulethbridge: 'Lethbridge',
  universityoflethbridge: 'Lethbridge',
  lethbridgepolytechnic: 'Lethbridge',
  usaskatchewan: 'Saskatoon',
  usask: 'Saskatoon',
  universityofsaskatchewan: 'Saskatoon',
  ualberta: 'Edmonton',
  universityofalberta: 'Edmonton',
  macewan: 'Edmonton',
  nait: 'Edmonton',
  uregina: 'Regina',
  universityofregina: 'Regina',
};

export function locationOf(school) {
  if (!school) return null;
  return cityBySchool[school.toLowerCase().replace(/[\s.]/g, '')] ?? school;
}
