// The API sends league times as local wall-clock strings like '2026-11-14T11:00'.
// We format them as-is (treating them as UTC so the browser doesn't shift them).
function parse(local) {
  return new Date(`${local}:00Z`);
}

export function formatDate(local) {
  return parse(local).toLocaleDateString('en-CA', {
    timeZone: 'UTC',
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export function formatTime(local) {
  return parse(local).toLocaleTimeString('en-CA', { timeZone: 'UTC', hour: 'numeric', minute: '2-digit' });
}
