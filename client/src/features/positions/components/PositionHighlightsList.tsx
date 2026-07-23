import * as React from 'react';
import { Link } from 'react-router-dom';
import type { PositionListItem } from '../types';

type PositionHighlightsListProps = {
  title: string;
  positions?: PositionListItem[];
  mode: 'latest' | 'popular';
};

function formatVisibility(value: PositionListItem['visibilityMode']) {
  return value === 'PUBLIC' ? 'Public' : 'Restricted';
}

function formatLevel(value?: PositionListItem['level'] | null) {
  if (!value) {
    return 'Not set';
  }

  return value
    .split('_')
    .map((part) => part.charAt(0) + part.slice(1).toLowerCase())
    .join('-');
}

function formatUpdatedAt(value?: string) {
  if (!value) {
    return 'Unknown date';
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return 'Unknown date';
  }

  return new Intl.DateTimeFormat('en', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  }).format(date);
}

function sortPositions(positions: PositionListItem[], mode: 'latest' | 'popular') {
  const normalized = [...positions];

  if (mode === 'popular') {
    return normalized.sort((a, b) => {
      const countDiff = (b.submittedCvCount ?? 0) - (a.submittedCvCount ?? 0);

      if (countDiff !== 0) {
        return countDiff;
      }

      return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
    });
  }

  return normalized.sort((a, b) => {
    return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
  });
}

export function PositionHighlightsList({
  title,
  positions = [],
  mode
}: PositionHighlightsListProps) {
  const visiblePositions = React.useMemo(() => {
    return sortPositions(positions, mode).slice(0, 3);
  }, [positions, mode]);

  return (
    <section className="card-block">
      <div className="section-header-inline">
        <h2>{title}</h2>
      </div>

      {visiblePositions.length === 0 ? (
        <p className="position-highlights__empty">Positions not found</p>
      ) : (
        <div className="position-highlights">
          {visiblePositions.map((position) => (
            <article key={position.id} className="position-highlight-card">
              <div className="position-highlight-card__top">
                <div>
                  <h3 className="position-highlight-card__title">
                    <Link
                      to={`/positions/${position.id}`}
                      className="position-highlight-card__title-link"
                    >
                      {position.title}
                    </Link>
                  </h3>
                  <p className="position-highlight-card__company">
                    {position.company?.trim() || 'Company not specified'}
                  </p>
                </div>

                <span
                  className={`position-visibility-badge ${
                    position.visibilityMode === 'PUBLIC'
                      ? 'position-visibility-badge--public'
                      : 'position-visibility-badge--restricted'
                  }`}
                >
                  {formatVisibility(position.visibilityMode)}
                </span>
              </div>

              {position.shortDescription ? (
                <p className="position-highlight-card__description">{position.shortDescription}</p>
              ) : null}

              <dl className="position-highlight-card__meta">
                <div className="position-highlight-card__meta-item">
                  <dt>Level</dt>
                  <dd>{formatLevel(position.level)}</dd>
                </div>

                <div className="position-highlight-card__meta-item">
                  <dt>Submitted CVs</dt>
                  <dd>{position.submittedCvCount ?? 0}</dd>
                </div>

                <div className="position-highlight-card__meta-item">
                  <dt>Updated</dt>
                  <dd>{formatUpdatedAt(position.updatedAt)}</dd>
                </div>

                <div className="position-highlight-card__meta-item">
                  <dt>Max projects</dt>
                  <dd>{position.maxProjects ?? 'Not set'}</dd>
                </div>
              </dl>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
