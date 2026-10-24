import { league } from './config.js';

export function formatDate(iso) {
  return new Date(iso).toLocaleDateString('en-CA', {
    timeZone: league.timeZone,
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export function formatTime(iso) {
  return new Date(iso).toLocaleTimeString('en-CA', {
    timeZone: league.timeZone,
    hour: 'numeric',
    minute: '2-digit',
  });
}
