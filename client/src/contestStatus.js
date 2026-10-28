// Works out where the season is right now, from the rounds the API returns:
//   live     the in-person contest is running
//   upsolve  the in-person part is over, upsolving is still open
//   upcoming nothing is running; `round` is the next contest
//   over     the season is finished
export function contestStatus(rounds, now = Date.now()) {
  if (!rounds) return null;
  const t = (iso) => (iso ? new Date(iso).getTime() : null);
  for (const round of rounds) {
    if (t(round.starts_at) <= now && now < t(round.ends_at)) return { state: 'live', round };
    if (t(round.ends_at) <= now && now < t(round.upsolve_ends_at)) return { state: 'upsolve', round };
  }
  const next = rounds.find((r) => t(r.starts_at) > now);
  return next ? { state: 'upcoming', round: next } : { state: 'over', round: null };
}
