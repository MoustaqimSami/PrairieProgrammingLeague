import { useEffect, useState } from 'react';
import { NavLink, Route, Routes, useLocation } from 'react-router-dom';
import { Analytics } from '@vercel/analytics/react';
import { league } from './config.js';
import Home from './pages/Home.jsx';
import Schedule from './pages/Schedule.jsx';
import Leaderboard from './pages/Leaderboard.jsx';
import NotFound from './pages/NotFound.jsx';
import MarkdownPage from './components/MarkdownPage.jsx';
import ContactEmail from './components/ContactEmail.jsx';
import rules from './content/rules.md?raw';
import prizes from './content/prizes.md?raw';
import links from './content/links.md?raw';

const nav = [
  ['/', 'Home'],
  ['/schedule', 'Schedule'],
  ['/leaderboard', 'Leaderboard'],
  ['/prizes', 'Prizes'],
  ['/rules', 'Rules'],
  ['/links', 'Links'],
];

export default function App() {
  // On phones the nav collapses behind a Menu button. Close it after navigating.
  const [menuOpen, setMenuOpen] = useState(false);
  const location = useLocation();
  useEffect(() => setMenuOpen(false), [location.pathname]);

  // Start each page at the top, or at the #section a link points to (like /links#contact).
  useEffect(() => {
    const target = location.hash && document.getElementById(location.hash.slice(1));
    if (target) target.scrollIntoView();
    else window.scrollTo(0, 0);
  }, [location.pathname, location.hash]);

  return (
    <>
      <a className="skip-link" href="#main">Skip to content</a>
      <header className="site-header">
        <div className="wrap header-inner">
          <NavLink to="/" className="brand">
            <img src="/ppl-emblem-on-dark.svg" alt="" width="56" height="56" />
            {/* Same three-line layout as the logo, as real text so it stays sharp */}
            <span className="brand-name">Prairie<br />Programming<br /><span className="brand-league">League</span></span>
          </NavLink>
          <button
            type="button"
            className="menu-button"
            aria-expanded={menuOpen}
            aria-controls="main-nav"
            onClick={() => setMenuOpen((open) => !open)}
          >
            <span aria-hidden="true">{menuOpen ? '✕' : '☰'}</span> Menu
          </button>
          <nav id="main-nav" aria-label="Main" className={menuOpen ? 'open' : undefined}>
            {nav.map(([to, label]) => (
              <NavLink key={to} to={to} end={to === '/'}>
                {label}
              </NavLink>
            ))}
          </nav>
        </div>
      </header>

      <main id="main" className="wrap">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/schedule" element={<Schedule />} />
          <Route path="/leaderboard" element={<Leaderboard />} />
          <Route path="/prizes" element={<MarkdownPage title="Prizes" content={prizes} />} />
          <Route path="/rules" element={<MarkdownPage title="Rules" content={rules} />} />
          <Route
            path="/links"
            element={
              <MarkdownPage title="Links" content={links}>
                <h2 id="contact">Contact</h2>
                <p>
                  Questions about the league: <ContactEmail />
                </p>
              </MarkdownPage>
            }
          />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>

      <footer className="site-footer">
        <div className="wrap footer-inner">
          <img src="/ppl-emblem-on-dark.svg" alt="" width="48" height="48" />
          <div>
            <p>
              <strong>{league.name}</strong> · <NavLink to="/links#contact">Contact</NavLink>
            </p>
            <p>Second Saturday of every month, November to April, on Kattis.</p>
          </div>
        </div>
      </footer>
      <Analytics />
    </>
  );
}
