import Markdown from 'react-markdown';
import remarkGfm from 'remark-gfm'; // adds tables, task lists and strikethrough
import { Link } from 'react-router-dom';
import { usePageTitle } from '../usePageTitle.js';

// Links inside our own site (starting with "/") use React Router, so they switch
// pages without a full reload. Everything else is a normal link.
const components = {
  a: ({ href, children }) =>
    href?.startsWith('/') ? <Link to={href}>{children}</Link> : <a href={href}>{children}</a>,
  // Tables fill the text column; the wrapper scrolls sideways on narrow phones instead.
  table: ({ children }) => (
    <div className="prose-table" tabIndex={0} role="region" aria-label="Table">
      <table>{children}</table>
    </div>
  ),
};

export function MarkdownContent({ children }) {
  return <Markdown remarkPlugins={[remarkGfm]} components={components}>{children}</Markdown>;
}

// A whole page that is just one Markdown file.
export default function MarkdownPage({ title, content, children }) {
  usePageTitle(title);
  return (
    <section className="prose">
      <MarkdownContent>{content}</MarkdownContent>
      {children}
    </section>
  );
}
