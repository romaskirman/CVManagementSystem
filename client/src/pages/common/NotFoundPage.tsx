import { Link } from 'react-router-dom';
import * as React from 'react';

export function NotFoundPage() {
  return (
    <section className="page-section">
      <div className="card-block">
        <h1>Page not found</h1>
        <p>The page you are looking for does not exist or is unavailable.</p>
        <Link to="/">Go to home page</Link>
      </div>
    </section>
  );
}
