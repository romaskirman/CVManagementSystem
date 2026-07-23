import { useQuery } from '@tanstack/react-query';
import { Link, useSearchParams } from 'react-router-dom';
import { searchApi } from '../../shared/api/search.api';
import * as React from 'react';

export function SearchResultsPage() {
  const [params] = useSearchParams();
  const q = params.get('q') ?? '';

  const { data, isLoading } = useQuery({
    queryKey: ['global-search', q],
    queryFn: () => searchApi.global({ q, scope: 'ALL' }),
    enabled: Boolean(q.trim())
  });

  if (!q.trim()) {
    return <div className="page-section">Enter a search query.</div>;
  }

  if (isLoading) {
    return <div className="page-section">Searching...</div>;
  }

  const positions = data?.positions?.items ?? [];
  const cvs = data?.cvs?.items ?? [];
  const users = data?.users?.items ?? [];

  return (
    <section className="page-section">
      <div className="page-header">
        <h1>Search results</h1>
        <p>Query: {q}</p>
      </div>

      <div className="stack-list">
        <section className="card-block">
          <h2>Positions</h2>

          {!positions.length ? (
            <div>No positions found.</div>
          ) : (
            <div className="stack-list">
              {positions.map((item: any) => (
                <Link key={item.id} to={`/positions/${item.id}`} className="inline-editor-row">
                  <strong>{item.title}</strong>
                  <span>{item.shortDescription}</span>
                </Link>
              ))}
            </div>
          )}
        </section>

        <section className="card-block">
          <h2>CVs</h2>

          {!cvs.length ? (
            <div>No CVs found.</div>
          ) : (
            <div className="stack-list">
              {cvs.map((item: any) => (
                <Link
                  key={item.id}
                  to={
                    item.canEditByCurrentUser
                      ? `/cvs/${item.id}`
                      : `/recruiter/cvs/${item.id}`
                  }
                  className="inline-editor-row"
                >
                  <strong>{item.positionTitle}</strong>
                  <span>Status: {item.status}</span>
                  <span>Likes: {item.likesCount ?? 0}</span>
                </Link>
              ))}
            </div>
          )}
        </section>

        <section className="card-block">
          <h2>Users</h2>

          {!users.length ? (
            <div>No users found.</div>
          ) : (
            <div className="stack-list">
              {users.map((item: any) => (
                <div key={item.id} className="inline-editor-row">
                  <strong>{item.email}</strong>
                  <span>{(item.roles ?? []).join(', ')}</span>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </section>
  );
}
