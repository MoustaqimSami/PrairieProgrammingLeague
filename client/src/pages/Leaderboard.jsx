import { Link, useSearchParams } from 'react-router-dom';
import { useApi } from '../api.js';
import Status from '../components/Status.jsx';

// Shows season standings by default, or one round's standings with ?round=<id>.
export default function Leaderboard() {
  const [params, setParams] = useSearchParams();
  const roundId = params.get('round');
  const { data: rounds } = useApi('/api/rounds');
  const played = rounds?.filter((r) => r.has_results) ?? [];

  return (
    <section>
      <div className="title-row">
        <h1>Leaderboard</h1>
        <label className="picker">
          <span>Show</span>
          <select
            value={roundId ?? ''}
            onChange={(e) => setParams(e.target.value ? { round: e.target.value } : {})}
          >
            <option value="">Season standings</option>
            {played.map((r) => (
              <option key={r.id} value={r.id}>Contest {r.number}</option>
            ))}
          </select>
        </label>
      </div>
      {roundId ? <RoundTable roundId={roundId} round={rounds?.find((r) => String(r.id) === roundId)} /> : <SeasonTable rounds={played} />}
    </section>
  );
}

function SeasonTable({ rounds }) {
  const { data: teams, loading, error } = useApi('/api/leaderboard');

  return (
    <>
      <p className="muted">
        In-person results, ranked by total problems solved, then by total penalty time (minutes). Prizes are
        awarded by draw, not by rank: see <Link to="/prizes">how prizes work</Link>.
      </p>
      <Status loading={loading} error={error} />
      {teams && teams.length === 0 && <p className="muted">No results yet. The first contest is on Saturday, November 14.</p>}
      {teams?.length > 0 && (
        <div className="table-scroll">
          <table className="standings">
            <thead>
              <tr>
                <th className="num">#</th>
                <th>Team</th>
                <th className="num">Solved</th>
                <th className="num">Penalty</th>
                {rounds.map((r) => (
                  <th key={r.id} className="num" title={`Contest ${r.number}: solved (rank)`}>C{r.number}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {teams.map((t) => (
                <tr key={t.team_id}>
                  <td className="num rank">{t.rank}</td>
                  <td>
                    <span className="team">{t.team}</span>
                    {t.school && <span className="school">{t.school}</span>}
                  </td>
                  <td className="num strong">{t.solved}</td>
                  <td className="num">{t.penalty}</td>
                  {rounds.map((r) => {
                    const result = t.by_round[r.number];
                    return (
                      <td key={r.id} className="num muted">
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

function RoundTable({ roundId, round }) {
  const { data: results, loading, error } = useApi(`/api/rounds/${roundId}/results`);

  return (
    <>
      {round?.kattis_url && (
        <p className="muted">
          Contest {round.number} · <a href={`${round.kattis_url}/standings`} target="_blank" rel="noreferrer">Full scoreboard on Kattis</a>
          {round.last_scraped_at && <> · updated {new Date(round.last_scraped_at).toLocaleString('en-CA')}</>}
        </p>
      )}
      <Status loading={loading} error={error} />
      {results && (
        <div className="table-scroll">
          <table className="standings">
            <thead>
              <tr>
                <th className="num">#</th>
                <th>Team</th>
                <th className="num">Solved</th>
                <th className="num">Penalty</th>
              </tr>
            </thead>
            <tbody>
              {results.map((r) => (
                <tr key={r.team_id}>
                  <td className="num rank">{r.rank}</td>
                  <td><span className="team">{r.team}</span></td>
                  <td className="num strong">{r.solved}</td>
                  <td className="num">{r.penalty}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
