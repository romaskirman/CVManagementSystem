import { Link } from 'react-router-dom';
import { AttributeListItem } from '../types';
import * as React from 'react';

type RecentlyUsedAttributesProps = {
  items: AttributeListItem[];
};

export function RecentlyUsedAttributes({ items }: RecentlyUsedAttributesProps) {
  if (!items.length) {
    return (
      <section className="card-block">
        <h2>Recently used</h2>
        <div>No recent attributes yet.</div>
      </section>
    );
  }

  return (
    <section className="card-block">
      <h2>Recently used</h2>
      <div className="tag-cloud">
        {items.map((item) => (
          <Link
            key={item.id}
            to={`/recruiter/attributes/${item.id}/edit`}
            className="tag-pill tag-pill--link"
          >
            {item.name}
          </Link>
        ))}
      </div>
    </section>
  );
}
