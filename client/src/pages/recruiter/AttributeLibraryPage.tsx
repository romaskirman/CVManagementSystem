import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { attributesApi } from '../../shared/api/attributes.api';
import { DataTable } from '../../shared/components/tables/DataTable';
import { AttributesFiltersBar } from '../../features/attributes/components/AttributesFiltersBar';
import { RecentlyUsedAttributes } from '../../features/attributes/components/RecentlyUsedAttributes';
import { AttributeListItem } from '../../features/attributes/types';
import * as React from 'react';

export function AttributeLibraryPage() {
  const [filters, setFilters] = useState<Record<string, unknown>>({});

  const { data, isLoading } = useQuery({
    queryKey: ['attributes-library', filters],
    queryFn: () => attributesApi.list(filters)
  });

  const { data: recentData } = useQuery({
    queryKey: ['recently-used-attributes'],
    queryFn: () => attributesApi.getRecentlyUsed({ limit: 12 })
  });

  const rows: AttributeListItem[] = useMemo(() => data?.items ?? [], [data]);
  const recentRows: AttributeListItem[] = useMemo(() => recentData?.items ?? [], [recentData]);

  return (
    <section className="page-section">
      <div className="page-header page-header--row">
        <div>
          <h1>Attribute Library</h1>
          <p>Reusable structured attributes for profiles, positions and CVs.</p>
        </div>

        <Link className="btn-primary" to="/recruiter/attributes/new">
          Create attribute
        </Link>
      </div>

      <RecentlyUsedAttributes items={recentRows} />

      <AttributesFiltersBar onApply={(params) => setFilters(params)} />

      {isLoading ? (
        <div>Loading attributes...</div>
      ) : (
        <DataTable
          rows={rows}
          emptyText="No attributes found"
          columns={[
            {
              key: 'name',
              title: 'Name',
              render: (row) => (
                <Link to={`/recruiter/attributes/${row.id}/edit`}>
                  {row.name}
                </Link>
              )
            },
            {
              key: 'category',
              title: 'Category',
              render: (row) => row.category
            },
            {
              key: 'type',
              title: 'Type',
              render: (row) => row.type
            },
            {
              key: 'optionsCount',
              title: 'Options',
              render: (row) => row.optionsCount ?? 0
            },
            {
              key: 'usageCount',
              title: 'Usage',
              render: (row) => row.usageCount ?? 0
            },
            {
              key: 'updatedAt',
              title: 'Updated',
              render: (row) => (row.updatedAt ? new Date(row.updatedAt).toLocaleString() : '—')
            }
          ]}
        />
      )}
    </section>
  );
}
