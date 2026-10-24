import { useEffect, useState } from 'react';

// Fetches JSON from our API and tracks loading and error state.
// Usage: const { data, error, loading } = useApi('/api/rounds');
export function useApi(path) {
  const [state, setState] = useState({ data: null, error: null, loading: true });

  useEffect(() => {
    if (!path) return;
    let cancelled = false; // ignore the response if the component has moved on
    setState((s) => ({ ...s, loading: true }));
    fetch(path)
      .then((res) => {
        if (!res.ok) throw new Error(`Request failed (${res.status})`);
        return res.json();
      })
      .then((data) => !cancelled && setState({ data, error: null, loading: false }))
      .catch((error) => !cancelled && setState({ data: null, error, loading: false }));
    return () => {
      cancelled = true;
    };
  }, [path]);

  return state;
}
