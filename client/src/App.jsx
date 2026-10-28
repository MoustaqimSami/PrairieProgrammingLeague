import { NavLink, Route, Routes } from 'react-router-dom';
import { league } from './config.js';
import Home from './pages/Home.jsx';
import Schedule from './pages/Schedule.jsx';
import Leaderboard from './pages/Leaderboard.jsx';
import NotFound from './pages/NotFound.jsx';
import MarkdownPage from './components/MarkdownPage.jsx';
import rules from './content/rules.md?raw';
import prizes from './content/prizes.md?raw';
import acpc from './content/acpc.md?raw';
import links from './content/links.md?raw';

const nav = [
  ['/', 'Home'],
  ['/schedule', 'Schedule'],
  ['/leaderboard', 'Leaderboard'],
  ['/prizes', 'Prizes'],
  ['/rules', 'Rules'],
  ['/acpc', 'ACPC'],
  ['/links', 'Links'],
];

export default function App() {
  return (
    <>
      <header className="site-header">
        <div className="wrap header-inner">
          <NavLink to="/" className="brand">
            <img src="/ppl-emblem-on-dark.svg" alt="" width="44" height="44" />
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
          <Route path="/prizes" element={<MarkdownPage content={prizes} />} />
          <Route path="/rules" element={<MarkdownPage content={rules} />} />
          <Route path="/acpc" element={<MarkdownPage content={acpc} />} />
          <Route path="/links" element={<MarkdownPage content={links} />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>

      <footer className="site-footer">
        <div className="wrap footer-inner">
          <img src="/ppl-emblem-on-dark.svg" alt="" width="48" height="48" />
          <div>
            <p>
              <strong>{league.name}</strong> · <a href={`mailto:${league.contactEmail}`}>{league.contactEmail}</a>
            </p>
            <p>Second Saturday of every month, November to April, on Kattis.</p>
          </div>
        </div>
      </footer>
    </>
  );
}
