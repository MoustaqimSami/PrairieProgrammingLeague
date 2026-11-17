// Everything that talks to Kattis lives here, so the rules we follow are in one place.
// Kattis's Terms of Service allow automated access if we:
//   1. send a descriptive User-Agent with contact details,
//   2. obey robots.txt,
//   3. keep our request rate low.
// See https://po.kattis.com/help/tos (section 6).

// SCRAPER_USER_AGENT can override this, e.g. to add a contact email.
const userAgent =
  process.env.SCRAPER_USER_AGENT ||
  'PrairieProgrammingLeagueBot/1.0 (+https://prairieprogrammingleague.com/links#contact)';

export function standingsUrl(kattisUrl) {
  return `${kattisUrl.replace(/\/+$/, '')}/standings`;
}

export async function fetchStandingsHtml(kattisUrl) {
  if (userAgent.includes('example.com')) {
    throw new Error('SCRAPER_USER_AGENT still has the example.com placeholder. Remove it or point it at the league site');
  }
  const url = new URL(standingsUrl(kattisUrl));
  if (!(await allowedByRobots(url))) {
    throw new Error(`robots.txt on ${url.host} disallows ${url.pathname}`);
  }
  const res = await fetch(url, { headers: { 'User-Agent': userAgent } });
  if (!res.ok) throw new Error(`Kattis returned ${res.status} for ${url}`);
  return res.text();
}

// A small robots.txt check: reads the rules for "User-agent: *" and refuses
// any path that starts with a Disallow prefix. Cached per host for the process.
const robotsCache = new Map();

async function allowedByRobots(url) {
  if (!robotsCache.has(url.host)) {
    const res = await fetch(`${url.origin}/robots.txt`, { headers: { 'User-Agent': userAgent } });
    robotsCache.set(url.host, res.ok ? disallowedPaths(await res.text()) : []);
  }
  return !robotsCache.get(url.host).some((prefix) => url.pathname.startsWith(prefix));
}

export function disallowedPaths(robotsTxt) {
  const paths = [];
  // Consecutive "User-agent:" lines share the rules that follow them, so we
  // track whether the current group of names includes "*".
  let appliesToUs = false;
  let readingAgents = false;
  for (const raw of robotsTxt.split('\n')) {
    const line = raw.replace(/#.*/, '').trim();
    if (!line) continue;
    const [key, ...rest] = line.split(':');
    const value = rest.join(':').trim();
    if (/^user-agent$/i.test(key)) {
      if (!readingAgents) appliesToUs = false; // a new group starts
      readingAgents = true;
      if (value === '*') appliesToUs = true;
    } else {
      readingAgents = false;
      if (appliesToUs && /^disallow$/i.test(key) && value) paths.push(value);
    }
  }
  return paths;
}
