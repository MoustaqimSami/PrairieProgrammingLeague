import Markdown from 'react-markdown';
import remarkGfm from 'remark-gfm'; // adds tables, task lists and strikethrough
import { Link } from 'react-router-dom';

// Links inside our own site (starting with "/") use React Router, so they switch
// pages without a full reload. Everything else is a normal link.
const components = {
  a: ({ href, children }) =>
    href?.startsWith('/') ? <Link to={href}>{children}</Link> : <a href={href}>{children}</a>,
};

export function MarkdownContent({ children }) {
  return <Markdown remarkPlugins={[remarkGfm]} components={components}>{children}</Markdown>;
}

// A whole page that is just one Markdown file.
export default function MarkdownPage({ content }) {
  return (
    <section className="prose">
      <MarkdownContent>{content}</MarkdownContent>
    </section>
  );
}
