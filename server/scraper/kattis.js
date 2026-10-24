// Everything that talks to Kattis lives here, so the rules we follow are in one place.
// Kattis's Terms of Service allow automated access if we:
//   1. send a descriptive User-Agent with contact details,
//   2. obey robots.txt,
//   3. keep our request rate low.
// See https://po.kattis.com/help/tos (section 6).

const userAgent = process.env.SCRAPER_USER_AGENT;

export function standingsUrl(kattisUrl) {
  return `${kattisUrl.replace(/\/+$/, '')}/standings`;
}

export async function fetchStandingsHtml(kattisUrl) {
  if (!userAgent || userAgent.includes('example.com')) {
    throw new Error('Set SCRAPER_USER_AGENT in server/.env to your league site and contact email first');
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
  let appliesToUs = false;
  for (const raw of robotsTxt.split('\n')) {
    const line = raw.replace(/#.*/, '').trim();
    const [key, ...rest] = line.split(':');
    const value = rest.join(':').trim();
    if (/^user-agent$/i.test(key)) appliesToUs = value === '*';
    else if (appliesToUs && /^disallow$/i.test(key) && value) paths.push(value);
  }
  return paths;
}
