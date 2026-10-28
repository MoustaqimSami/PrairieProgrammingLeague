import { useEffect, useState } from 'react';
import { league } from '../config.js';

// Shows the contact address once the page is running in a browser. The address
// never appears whole in the HTML, which keeps most spam scrapers away from it.
export default function ContactEmail() {
  const [email, setEmail] = useState(null);
  useEffect(() => setEmail(league.contactEmailParts.join('@')), []);
  if (!email) return <span className="muted">loading…</span>;
  return <a href={`mailto:${email}`}>{email}</a>;
}
