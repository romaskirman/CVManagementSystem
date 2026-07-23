import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { DataTable } from '../../shared/components/tables/DataTable';
import { usePositions } from '../../features/positions/hooks/usePositions';
import { PositionsFiltersBar } from '../../features/positions/components/PositionsFiltersBar';
import { PositionListItem } from '../../features/positions/types';
import { useAuth } from '../../app/providers/AuthProvider';
import * as React from 'react';

export function PositionsPage() {
  const { user } = useAuth();
  const [filters, setFilters] = useState<Record<string, unknown>>({});

  const { data, isLoading } = usePositions(filters);

  const rows: PositionListItem[] = useMemo(() => data?.items ?? [], [data]);

  return (
    <section className="page-section">
      <div className="page-header page-header--row">
        <div>
          <h1>Positions</h1>
          <p>Browse available positions and open the details page.</p>
        </div>

        {user?.roles.includes('RECRUITER') && (
          <Link className="btn-primary" to="/recruiter/positions/new">
            Create position
          </Link>
        )}
      </div>

      <PositionsFiltersBar onApply={(params) => setFilters(params)} />

      {isLoading ? (
        <div>Loading positions...</div>
      ) : (
        <DataTable
          rows={rows}
          emptyText="No positions found"
          columns={[
            {
              key: 'title',
              title: 'Title',
              render: (row) => <Link to={`/positions/${row.id}`}>{row.title}</Link>
            },
            {
              key: 'company',
              title: 'Company',
              render: (row) => row.company ?? '—'
            },
            {
              key: 'level',
              title: 'Level',
              render: (row) => row.level ?? '—'
            },
            {
              key: 'visibilityMode',
              title: 'Visibility',
              render: (row) => row.visibilityMode
            },
            {
              key: 'submittedCvCount',
              title: 'Submitted CVs',
              render: (row) => row.submittedCvCount ?? 0
            },
            {
              key: 'updatedAt',
              title: 'Updated',
              render: (row) => new Date(row.updatedAt).toLocaleString()
            }
          ]}
        />
      )}
    </section>
  );
}
