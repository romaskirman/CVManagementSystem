import { FormEvent, useState } from 'react';
import * as React from 'react';

type UsersFiltersBarProps = {
  initialQuery?: string;
  initialStatus?: 'ACTIVE' | 'BLOCKED' | 'ALL';
  onApply: (filters: { q: string; status: 'ACTIVE' | 'BLOCKED' | 'ALL' }) => void;
};

export function UsersFiltersBar({
  initialQuery = '',
  initialStatus = 'ALL',
  onApply
}: UsersFiltersBarProps) {
  const [q, setQ] = useState(initialQuery);
  const [status, setStatus] = useState<'ACTIVE' | 'BLOCKED' | 'ALL'>(initialStatus);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    onApply({ q, status });
  };

  return (
    <form className="filters-bar" onSubmit={handleSubmit}>
      <input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Search by email or name..."
      />

      <select value={status} onChange={(e) => setStatus(e.target.value as 'ACTIVE' | 'BLOCKED' | 'ALL')}>
        <option value="ALL">All statuses</option>
        <option value="ACTIVE">Active</option>
        <option value="BLOCKED">Blocked</option>
      </select>

      <button type="submit" className="btn-secondary">
        Apply
      </button>
    </form>
  );
}
