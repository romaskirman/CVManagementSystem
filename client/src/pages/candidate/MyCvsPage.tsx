import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { profileApi } from '../../shared/api/profile.api';
import { DataTable } from '../../shared/components/tables/DataTable';
import * as React from 'react';

type MyCvRow = {
  id: string;
  positionTitle: string;
  status: string;
  isVisibleToRecruiters: boolean;
  likesCount?: number;
  updatedAt: string;
};

export function MyCvsPage() {
  const { data, isLoading } = useQuery<{ items: MyCvRow[] }>({
    queryKey: ['my-cvs'],
    queryFn: () => profileApi.getMyCvs()
  });

  if (isLoading) {
    return <div className="page-section">Loading CVs...</div>;
  }

  const rows: MyCvRow[] = data?.items ?? [];

  return (
    <section className="page-section">
      <div className="page-header">
        <h1>My CVs</h1>
        <p>Each candidate may have at most one CV per position.</p>
      </div>

      <DataTable<MyCvRow>
        rows={rows}
        emptyText="No CVs yet. Open a position and create one from there."
        columns={[
          {
            key: 'positionTitle',
            title: 'Position',
            render: (row) => row.positionTitle
          },
          {
            key: 'status',
            title: 'Status',
            render: (row) => row.status
          },
          {
            key: 'visibility',
            title: 'Visible to recruiters',
            render: (row) => (row.isVisibleToRecruiters ? 'Yes' : 'No')
          },
          {
            key: 'likesCount',
            title: 'Likes',
            render: (row) => row.likesCount ?? 0
          },
          {
            key: 'updatedAt',
            title: 'Updated',
            render: (row) => new Date(row.updatedAt).toLocaleString()
          },
          {
            key: 'open',
            title: 'Open',
            render: (row) => <Link to={`/cvs/${row.id}`}>Open CV</Link>
          }
        ]}
      />
    </section>
  );
}
