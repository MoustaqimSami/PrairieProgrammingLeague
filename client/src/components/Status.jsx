// Shared loading and error messages for pages that fetch data.
export default function Status({ loading, error }) {
  if (loading) return <p className="muted">Loading…</p>;
  if (error) return <p className="error">Couldn't load this right now. Please try again later.</p>;
  return null;
}
