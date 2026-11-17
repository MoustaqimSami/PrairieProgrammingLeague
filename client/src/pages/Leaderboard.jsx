import { Link, useSearchParams } from 'react-router-dom';
import { useApi } from '../api.js';
import Status from '../components/Status.jsx';
import ComingSoon from '../components/ComingSoon.jsx';
import { usePageTitle } from '../usePageTitle.js';
import { contestStatus } from '../contestStatus.js';
import { formatDate, formatTime } from '../format.js';

// Shows season standings by default, or one round's standings with ?round=<id>
// (add &kind=upsolve for that round's upsolve contest).
// Until any results exist, it shows a countdown to the next contest instead.
// Results come from Kattis: a scheduled job copies the standings every 10 to 30 minutes.
export default function Leaderboard() {
  usePageTitle('Leaderboard');
  const [params, setParams] = useSearchParams();
  const roundId = params.get('round');
  const kind = params.get('kind') === 'upsolve' ? 'upsolve' : 'contest';
  const { data: rounds, loading, error } = useApi('/api/rounds');
  const played = rounds?.filter((r) => r.has_results || r.has_upsolve_results) ?? [];
  const status = contestStatus(rounds);

  if (!rounds) {
    return (
      <section>
        <h1>Leaderboard</h1>
        <Status loading={loading} error={error} />
      </section>
    );
  }
  if (played.length === 0) {
    return <ComingSoon rounds={rounds} />;
  }

  return (
    <section>
      <div className="title-row">
        <h1>Leaderboard</h1>
        <label className="picker">
          <span>Show</span>
          <select
            value={roundId ? `${roundId}:${kind}` : ''}
            onChange={(e) => {
              const [round, k] = e.target.value.split(':');
              setParams(!round ? {} : k === 'upsolve' ? { round, kind: k } : { round });
            }}
          >
            <option value="">Season standings</option>
            {played.map((r) => [
              r.has_results && <option key={`${r.id}:contest`} value={`${r.id}:contest`}>Contest {r.number}</option>,
              r.has_upsolve_results && (
                <option key={`${r.id}:upsolve`} value={`${r.id}:upsolve`}>Contest {r.number} upsolve</option>
              ),
            ])}
          </select>
        </label>
      </div>
      {status?.state === 'live' && (
        <p className="live-banner">
          <strong>Contest {status.round.number} is live now</strong>, until {formatTime(status.round.ends_local)}, and these
          standings refresh about every 10 minutes.
        </p>
      )}
      {status?.state === 'upsolve' && (
        <p className="live-banner">
          <strong>Upsolving for Contest {status.round.number} is open</strong> until{' '}
          {formatDate(status.round.upsolve_ends_local)}, {formatTime(status.round.upsolve_ends_local)} ·{' '}
          {status.round.upsolve_kattis_url && <a href={status.round.upsolve_kattis_url}>Upsolve on Kattis</a>}
        </p>
      )}
      {roundId ? (
        <RoundTable roundId={roundId} kind={kind} round={rounds.find((r) => String(r.id) === roundId)} />
      ) : (
        <SeasonTable rounds={played.filter((r) => r.has_results)} />
      )}
    </section>
  );
}

function SeasonTable({ rounds }) {
  const { data: teams, loading, error } = useApi('/api/leaderboard');

  return (
    <>
      <p className="muted">
        In-person results, ranked by total problems solved, then by total penalty time (minutes). Everyone on a
        team gets the team's result. Prizes are awarded by draw, not by rank: see{' '}
        <Link to="/prizes">how prizes work</Link>.
      </p>
      <Status loading={loading} error={error} />
      {teams && teams.length === 0 && <p className="muted">No in-person results yet.</p>}
      {teams?.length > 0 && (
        <div className="table-scroll" tabIndex={0} role="region" aria-label="Standings">
          <table className="standings">
            <thead>
              <tr>
                <th className="num">#</th>
                <th>Name</th>
                <th className="num">Solved</th>
                <th className="num">Penalty</th>
                {rounds.map((r) => (
                  <th key={r.id} className="num" title={`Contest ${r.number}: solved (rank)`}>C{r.number}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {teams.map((t) => (
                <tr key={t.key}>
                  <td className="num rank">{t.rank}</td>
                  <td>
                    <span className="team">{t.name}</span>
                  </td>
                  <td className="num strong">{t.solved}</td>
                  <td className="num">{t.penalty}</td>
                  {rounds.map((r) => {
                    const result = t.by_round[r.number];
                    return (
                      <td key={r.id} className="num muted" title={result?.team && result.team !== t.name ? `Team ${result.team}` : undefined}>
                        {result ? <>{result.solved} <small>({result.rank})</small></> : '—'}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}

function RoundTable({ roundId, kind, round }) {
  const upsolve = kind === 'upsolve';
  const { data: results, loading, error } = useApi(`/api/rounds/${roundId}/results${upsolve ? '?kind=upsolve' : ''}`);
  const kattisUrl = upsolve ? round?.upsolve_kattis_url : round?.kattis_url;
  const updated = upsolve ? round?.upsolve_last_scraped_at : round?.last_scraped_at;

  return (
    <>
      {round && (
        <p className="muted">
          Contest {round.number}
          {upsolve ? ' upsolve, ranked by problems solved' : ''}
          {kattisUrl && (
            <>
              {' '}· <a href={`${kattisUrl}/standings`} target="_blank" rel="noreferrer">Full scoreboard on Kattis</a>
            </>
          )}
          {updated && <> · updated {new Date(updated).toLocaleString('en-CA', { dateStyle: 'medium', timeStyle: 'short' })}</>}
        </p>
      )}
      <Status loading={loading} error={error} />
      {results && (
        <div className="table-scroll" tabIndex={0} role="region" aria-label="Standings">
          <table className="standings">
            <thead>
              <tr>
                <th className="num">#</th>
                <th>Name</th>
                <th className="num">Solved</th>
                {!upsolve && <th className="num">Penalty</th>}
              </tr>
            </thead>
            <tbody>
              {results.map((r) => (
                <tr key={r.team_id}>
                  <td className="num rank">{r.rank}</td>
                  <td><Names result={r} /></td>
                  <td className="num strong">{r.solved}</td>
                  {!upsolve && <td className="num">{r.penalty}</td>}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}

// People's names (from Kattis team pages), with the team name underneath when it adds
// something. Falls back to the team name if we don't know the members yet.
function Names({ result }) {
  const names = result.members.join(', ');
  if (!names) return <span className="team">{result.team}</span>;
  const sameAsTeam = result.members.length === 1 && result.members[0].toLowerCase() === result.team.toLowerCase();
  return (
    <>
      <span className="team">{names}</span>
      {!sameAsTeam && <span className="school">{result.team}</span>}
    </>
  );
}
