import { useQuery } from '@tanstack/react-query';
import { Link, useParams } from 'react-router-dom';
import { cvApi } from '../../shared/api/cv.api';
import { DataTable } from '../../shared/components/tables/DataTable';
import * as React from 'react';

type PositionCvRow = {
  id: string;
  status: string;
  likesCount: number;
  updatedAt: string;
  candidate: {
    email: string;
  };
};

type PositionCvsResponse = {
  items: PositionCvRow[];
  total: number;
  page: number;
  pageSize: number;
};

export function PositionCvsPage() {
  const { positionId } = useParams<{ positionId: string }>();

  const { data, isLoading } = useQuery<PositionCvsResponse>({
    queryKey: ['position-cvs', positionId],
    queryFn: () => cvApi.list({ positionId })
  });

  if (isLoading) {
    return <div className="page-section">Loading CVs...</div>;
  }

  const rows: PositionCvRow[] = data?.items ?? [];

  return (
    <section className="page-section">
      <div className="page-header">
        <h1>Position CVs</h1>
        <p>Submitted CVs for this position.</p>
      </div>

      <DataTable<PositionCvRow>
        rows={rows}
        emptyText="No CVs found"
        columns={[
          {
            key: 'candidate',
            title: 'Candidate',
            render: (row) => row.candidate.email
          },
          {
            key: 'status',
            title: 'Status',
            render: (row) => row.status
          },
          {
            key: 'likesCount',
            title: 'Likes',
            render: (row) => row.likesCount
          },
          {
            key: 'updatedAt',
            title: 'Updated',
            render: (row) => new Date(row.updatedAt).toLocaleString()
          },
          {
            key: 'open',
            title: 'Open',
            render: (row) => <Link to={`/recruiter/cvs/${row.id}`}>Open CV</Link>
          }
        ]}
      />
    </section>
  );
}
