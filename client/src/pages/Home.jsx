import { Link } from 'react-router-dom';
import about from '../content/about.md?raw';
import { useApi } from '../api.js';
import { formatDate, formatTime } from '../format.js';
import { league } from '../config.js';
import { MarkdownContent } from '../components/MarkdownPage.jsx';

export default function Home() {
  const { data: rounds } = useApi('/api/rounds');
  const next = rounds?.find((r) => new Date(r.starts_at) > new Date());

  return (
    <>
      <section className="hero">
        <h1>{league.name}</h1>
        <p className="lead">A monthly programming contest for students in Alberta and Saskatchewan. Second Saturday of every month, November to April.</p>
        {next && (
          <div className="next-round">
            <span className="label">Next contest</span>
            <strong>Contest {next.number}</strong> · {formatDate(next.starts_local)} at {formatTime(next.starts_local)}{' '}
            {league.timeZoneLabel} time · in person, with upsolving until the next Friday
          </div>
        )}
        <div className="actions">
          <Link className="button" to="/schedule">See the schedule</Link>
          <Link className="button secondary" to="/prizes">How prizes work</Link>
        </div>
      </section>

      <section className="prose">
        <MarkdownContent>{about}</MarkdownContent>
      </section>
    </>
  );
}
