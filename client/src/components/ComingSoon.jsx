import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { formatDate, formatTime } from '../format.js';
import { league } from '../config.js';

// Shown on the leaderboard until the first results are in:
// a live countdown to the next contest and an empty board waiting to be filled.
export default function ComingSoon({ next }) {
  const left = useCountdown(next?.starts_at);

  return (
    <div className="coming-soon">
      <p className="eyebrow">Season 2026–27</p>
      <h2>The board is empty. For now.</h2>
      <p className="lead">
        {next ? (
          <>
            Contest {next.number} kicks off <strong>{formatDate(next.starts_local)}</strong> at{' '}
            {formatTime(next.starts_local)} {league.timeZoneLabel}. Every name on this board starts at zero.
          </>
        ) : (
          'The next season is being planned. Check back soon.'
        )}
      </p>

      {left && (
        <div className="countdown" role="timer" aria-label="Time until the next contest">
          {[
            ['days', left.days],
            ['hours', left.hours],
            ['min', left.minutes],
            ['sec', left.seconds],
          ].map(([label, value]) => (
            <div key={label} className="countdown-cell">
              <span className="countdown-value">{String(value).padStart(2, '0')}</span>
              <span className="countdown-label">{label}</span>
            </div>
          ))}
        </div>
      )}

      <ol className="ghost-board" aria-hidden="true">
        {['Your team here', 'Rival from Calgary', 'Someone from Saskatoon', 'A solo legend', 'You, after upsolving'].map(
          (name, i) => (
            <li key={name} style={{ '--i': i }}>
              <span className="ghost-rank">{i + 1}</span>
              <span className="ghost-name">{name}</span>
              <span className="ghost-score">?</span>
            </li>
          ),
        )}
      </ol>

      <div className="actions">
        <a className="button" href="https://open.kattis.com/problems?order=difficulty_category" target="_blank" rel="noreferrer">
          Warm up on Kattis
        </a>
        <Link className="button secondary" to="/schedule">See the schedule</Link>
        <Link className="button secondary" to="/prizes">How prizes work</Link>
      </div>
    </div>
  );
}

// Returns the days, hours, minutes and seconds until `iso`, updated every second.
function useCountdown(iso) {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer); // stop ticking when the page is left
  }, []);

  if (!iso) return null;
  const total = Math.max(0, Math.floor((new Date(iso).getTime() - now) / 1000));
  return {
    days: Math.floor(total / 86400),
    hours: Math.floor((total % 86400) / 3600),
    minutes: Math.floor((total % 3600) / 60),
    seconds: total % 60,
  };
}
