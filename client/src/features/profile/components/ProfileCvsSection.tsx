import { Link } from 'react-router-dom';
import * as React from 'react';

type ProfileCvItem = {
  id: string;
  positionTitle: string;
  status: string;
  updatedAt: string;
};

type ProfileCvsSectionProps = {
  items: ProfileCvItem[];
};

export function ProfileCvsSection({ items }: ProfileCvsSectionProps) {
  return (
    <section className="card-block">
      <div className="section-header-inline">
        <h2>CVs</h2>
        <Link className="btn-secondary" to="/cvs">
          Open all
        </Link>
      </div>

      {!items.length ? (
        <div>No CVs created yet.</div>
      ) : (
        <div className="stack-list">
          {items.map((item) => (
            <Link key={item.id} to={`/cvs/${item.id}`} className="inline-editor-row">
              <strong>{item.positionTitle}</strong>
              <span>{item.status}</span>
              <span>{new Date(item.updatedAt).toLocaleString()}</span>
            </Link>
          ))}
        </div>
      )}
    </section>
  );
}
