import { useEffect } from 'react';
import { league } from './config.js';

// Sets the browser tab title, e.g. "Schedule · Prairie Programming League".
export function usePageTitle(title) {
  useEffect(() => {
    document.title = title ? `${title} · ${league.name}` : league.name;
  }, [title]);
}
