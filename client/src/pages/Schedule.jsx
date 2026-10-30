import { Link } from 'react-router-dom';
import { useApi } from '../api.js';
import { formatDate, formatTime } from '../format.js';
import { league } from '../config.js';
import Status from '../components/Status.jsx';
import { usePageTitle } from '../usePageTitle.js';

export default function Schedule() {
  usePageTitle('Schedule');
  const { data: rounds, loading, error } = useApi('/api/rounds');

  return (
    <section>
      <h1>Schedule</h1>
      <p className="muted">
        Contests run on the second Saturday of each month. The in-person contest runs 11:00 a.m. to 1:30 p.m., then
        upsolving stays open until noon the following Friday. All times are {league.timeZoneLabel}, which is the same in every host city.
      </p>
      <p className="muted">
        To find out where your local contest is, contact your local coach. If you don't know who that is,{' '}
        <Link to="/links#contact">contact us</Link>.
      </p>
      <Status loading={loading} error={error} />
      {rounds && (
        <div className="table-scroll schedule" tabIndex={0} role="region" aria-label="Contest schedule">
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
                  <td data-label="Contest">{r.number}</td>
                  <td data-label="Date">{formatDate(r.starts_local)}</td>
                  <td data-label="In person">
                    {formatTime(r.starts_local)} to {formatTime(r.ends_local)}
                  </td>
                  <td data-label="Upsolve until">{r.upsolve_ends_local ? `${formatDate(r.upsolve_ends_local)}, ${formatTime(r.upsolve_ends_local)}` : '—'}</td>
                  <td data-label="On Kattis">
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
