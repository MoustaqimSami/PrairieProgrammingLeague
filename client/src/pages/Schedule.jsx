import { useApi } from '../api.js';
import { formatDate, formatTime } from '../format.js';
import { league } from '../config.js';
import Status from '../components/Status.jsx';

export default function Schedule() {
  const { data: rounds, loading, error } = useApi('/api/rounds');

  return (
    <section>
      <h1>Schedule</h1>
      <p className="muted">
        Contests run on the second Saturday of each month. The in-person contest runs 11:00 a.m. to 1:30 p.m., then
        upsolving stays open until noon the following Friday. All times are local {league.timeZoneLabel}.
      </p>
      <Status loading={loading} error={error} />
      {rounds && (
        <div className="table-scroll">
          <table>
            <thead>
              <tr>
                <th>Contest</th>
                <th>Date</th>
                <th>In person</th>
                <th>Upsolve until</th>
                <th>On Kattis</th>
              </tr>
            </thead>
            <tbody>
              {rounds.map((r) => (
                <tr key={r.id}>
                  <td>{r.number}</td>
                  <td>{formatDate(r.starts_local)}</td>
                  <td>
                    {formatTime(r.starts_local)} to {formatTime(r.ends_local)}
                  </td>
                  <td>{r.upsolve_ends_local ? `${formatDate(r.upsolve_ends_local)}, ${formatTime(r.upsolve_ends_local)}` : '—'}</td>
                  <td>
                    {r.kattis_url || r.upsolve_kattis_url ? (
                      <span className="link-list">
                        {r.kattis_url && <a href={r.kattis_url} target="_blank" rel="noreferrer">In person</a>}
                        {r.upsolve_kattis_url && <a href={r.upsolve_kattis_url} target="_blank" rel="noreferrer">Upsolve</a>}
                      </span>
                    ) : (
                      <span className="muted">Link coming soon</span>
                    )}
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
