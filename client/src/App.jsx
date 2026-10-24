import { NavLink, Route, Routes } from 'react-router-dom';
import { league } from './config.js';
import Home from './pages/Home.jsx';
import Rules from './pages/Rules.jsx';
import Schedule from './pages/Schedule.jsx';
import Leaderboard from './pages/Leaderboard.jsx';
import Links from './pages/Links.jsx';
import NotFound from './pages/NotFound.jsx';

const nav = [
  ['/', 'Home'],
  ['/schedule', 'Schedule'],
  ['/leaderboard', 'Leaderboard'],
  ['/rules', 'Rules'],
  ['/links', 'Links'],
];

export default function App() {
  return (
    <>
      <header className="site-header">
        <div className="wrap header-inner">
          <NavLink to="/" className="brand">
            <span className="brand-mark" aria-hidden="true">{league.shortName}</span>
            <span>{league.name}</span>
          </NavLink>
          <nav aria-label="Main">
            {nav.map(([to, label]) => (
              <NavLink key={to} to={to} end={to === '/'}>
                {label}
              </NavLink>
            ))}
          </nav>
        </div>
      </header>

      <main className="wrap">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/schedule" element={<Schedule />} />
          <Route path="/leaderboard" element={<Leaderboard />} />
          <Route path="/rules" element={<Rules />} />
          <Route path="/links" element={<Links />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>

      <footer className="site-footer">
        <div className="wrap">
          <p>
            {league.name} · <a href={`mailto:${league.contactEmail}`}>{league.contactEmail}</a>
          </p>
          <p className="muted">Contests are hosted on Kattis. Standings are updated automatically during each round.</p>
        </div>
      </footer>
    </>
  );
}
