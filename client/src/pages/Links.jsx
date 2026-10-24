import Markdown from 'react-markdown';
import links from '../content/links.md?raw';

export default function Links() {
  return (
    <section className="prose">
      <Markdown>{links}</Markdown>
    </section>
  );
}
