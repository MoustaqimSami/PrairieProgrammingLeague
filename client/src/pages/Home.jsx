import { Link } from 'react-router-dom';
import Markdown from 'react-markdown';
import about from '../content/about.md?raw';
import { useApi } from '../api.js';
import { formatDate, formatTime } from '../format.js';
import { league } from '../config.js';

export default function Home() {
  const { data: rounds } = useApi('/api/rounds');
  const next = rounds?.find((r) => new Date(r.starts_at) > new Date());

  return (
    <>
      <section className="hero">
        <h1>{league.name}</h1>
        <p className="lead">Team programming contests for students across the prairies, all season long.</p>
        {next && (
          <div className="next-round">
            <span className="label">Next round</span>
            <strong>Round {next.number}</strong> · {formatDate(next.starts_at)} at {formatTime(next.starts_at)}{' '}
            {league.timeZoneLabel} · {next.format}
          </div>
        )}
        <div className="actions">
          <Link className="button" to="/schedule">See the schedule</Link>
          <Link className="button secondary" to="/leaderboard">Leaderboard</Link>
        </div>
      </section>

      <section className="prose">
        <Markdown>{about}</Markdown>
      </section>
    </>
  );
}
