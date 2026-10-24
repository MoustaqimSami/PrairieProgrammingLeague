import { Link } from 'react-router-dom';
import { useApi } from '../api.js';
import { formatDate, formatTime } from '../format.js';
import { league } from '../config.js';
import Status from '../components/Status.jsx';

export default function Schedule() {
  const { data: rounds, loading, error } = useApi('/api/rounds');

  return (
    <section>
      <h1>Schedule</h1>
      <p className="muted">All times are {league.timeZoneLabel} time. Each round runs on Kattis.</p>
      <Status loading={loading} error={error} />
      {rounds && (
        <div className="table-scroll">
          <table>
            <thead>
              <tr>
                <th>Round</th>
                <th>Date</th>
                <th>Time</th>
                <th>Format</th>
                <th>Contest</th>
                <th>Results</th>
              </tr>
            </thead>
            <tbody>
              {rounds.map((r) => (
                <tr key={r.id}>
                  <td>{r.number}</td>
                  <td>{formatDate(r.starts_at)}</td>
                  <td>{formatTime(r.starts_at)}</td>
                  <td>{r.format}</td>
                  <td>
                    <a href={r.kattis_url} target="_blank" rel="noreferrer">Kattis</a>
                  </td>
                  <td>
                    {r.has_results ? <Link to={`/leaderboard?round=${r.id}`}>Standings</Link> : <span className="muted">—</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
