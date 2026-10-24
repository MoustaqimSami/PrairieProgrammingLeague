import Markdown from 'react-markdown';
import rules from '../content/rules.md?raw';

export default function Rules() {
  return (
    <section className="prose">
      <Markdown>{rules}</Markdown>
    </section>
  );
}
