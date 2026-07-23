import { useQuery } from '@tanstack/react-query';
import { statsApi } from '../../shared/api/stats.api';
import * as React from 'react';
import { PositionHighlightsList } from '../../features/positions/components/PositionHighlightsList';

export function HomePage() {
  const { data: stats } = useQuery({
    queryKey: ['public-stats'],
    queryFn: () => statsApi.getPublicStats()
  });

  const { data: latestPositions } = useQuery({
    queryKey: ['latest-positions'],
    queryFn: () => statsApi.getLatestPositions()
  });

  const { data: popularPositions } = useQuery({
    queryKey: ['popular-positions'],
    queryFn: () => statsApi.getPopularPositions()
  });

  const { data: tagCloud } = useQuery({
    queryKey: ['tag-cloud'],
    queryFn: () => statsApi.getTagCloud()
  });

  return (
    <section className="page-section">
      <div className="hero-block">
        <h1>CV Management System</h1>
        <p>Reusable profiles, customizable positions, automatically generated CVs.</p>
      </div>

      <div className="stats-grid">
        <div className="stat-card">CVs last 24h: {stats?.newCvsLast24Hours ?? 0}</div>
        <div className="stat-card">Positions: {stats?.totalPositions ?? 0}</div>
        <div className="stat-card">Candidates: {stats?.totalCandidates ?? 0}</div>
        <div className="stat-card">Recruiters: {stats?.totalRecruiters ?? 0}</div>
        <div className="stat-card">Published CVs: {stats?.totalSubmittedCvs ?? 0}</div>
      </div>

      <PositionHighlightsList
        title="Latest positions"
        positions={latestPositions ?? []}
        mode="latest"
      />

      <PositionHighlightsList
        title="Most popular positions"
        positions={popularPositions ?? []}
        mode="popular"
      />

      <section className="card-block">
        <h2>Tag cloud</h2>
        <div className="tag-cloud">
          {(tagCloud ?? []).map((tag: { id: string; name: string; count: number }) => (
            <span key={tag.id} className="tag-pill">
              {tag.name} ({tag.count})
            </span>
          ))}
        </div>
      </section>
    </section>
  );
}
