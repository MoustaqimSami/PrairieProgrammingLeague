import { Link } from 'react-router-dom';
import about from '../content/about.md?raw';
import { useApi } from '../api.js';
import { formatDate, formatTime } from '../format.js';
import { league } from '../config.js';
import { MarkdownContent } from '../components/MarkdownPage.jsx';
import { contestStatus } from '../contestStatus.js';
import { usePageTitle } from '../usePageTitle.js';

export default function Home() {
  usePageTitle(null);
  const { data: rounds } = useApi('/api/rounds');
  const status = contestStatus(rounds);

  return (
    <>
      <section className="hero">
        <div>
          <h1>{league.name}</h1>
          <p className="lead">A monthly programming contest for students across the prairies. Second Saturday of every month, November to April.</p>
          {status && status.state !== 'over' && <StatusCard status={status} />}
          <div className="actions">
            <Link className="button" to="/schedule">See the schedule</Link>
            <Link className="button secondary" to="/prizes">How prizes work</Link>
          </div>
        </div>
        <picture className="hero-emblem">
          <source srcSet="/ppl-emblem-on-dark.svg" media="(prefers-color-scheme: dark)" />
          <img src="/ppl-emblem.svg" alt="Prairie Programming League emblem: a wheat wreath around a sunrise over fields, with snow-capped mountains on the horizon" width="260" height="260" />
        </picture>
      </section>

      <section className="prose">
        <MarkdownContent>{about}</MarkdownContent>
      </section>
    </>
  );
}

// The "what's happening" card on the home page: live now, upsolving, or next up.
function StatusCard({ status: { state, round } }) {
  if (state === 'live') {
    return (
      <div className="next-round live">
        <span className="label">Live now</span>
        <strong>Contest {round.number}</strong> is running until {formatTime(round.ends_local)} {league.timeZoneLabel}.{' '}
        {round.kattis_url && <a href={round.kattis_url}>Open it on Kattis</a>}
      </div>
    );
  }
  if (state === 'upsolve') {
    return (
      <div className="next-round">
        <span className="label">Upsolving open</span>
        <strong>Contest {round.number}</strong> upsolving closes {formatDate(round.upsolve_ends_local)} at{' '}
        {formatTime(round.upsolve_ends_local)}. {round.upsolve_kattis_url && <a href={round.upsolve_kattis_url}>Upsolve on Kattis</a>}
      </div>
    );
  }
  return (
    <div className="next-round">
      <span className="label">Next contest</span>
      <strong>Contest {round.number}</strong> · {formatDate(round.starts_local)} at {formatTime(round.starts_local)}{' '}
      {league.timeZoneLabel} · in person, with upsolving until the next Friday
    </div>
  );
}
