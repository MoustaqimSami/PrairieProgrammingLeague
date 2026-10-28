import { Link } from 'react-router-dom';
import { usePageTitle } from '../usePageTitle.js';

export default function NotFound() {
  usePageTitle('Page not found');
  return (
    <section className="prose">
      <h1>Page not found</h1>
      <p>
        That page doesn't exist. <Link to="/">Back to the home page</Link>.
      </p>
    </section>
  );
}
