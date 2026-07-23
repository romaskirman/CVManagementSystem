import { FormEvent, useState } from 'react';
import * as React from 'react';

type PositionsFiltersBarProps = {
  initialSearch?: string;
  initialCompany?: string;
  initialLevel?: string;
  onApply: (params: {
    search?: string;
    company?: string;
    level?: string;
  }) => void;
};

export function PositionsFiltersBar({
  initialSearch = '',
  initialCompany = '',
  initialLevel = '',
  onApply
}: PositionsFiltersBarProps) {
  const [search, setSearch] = useState(initialSearch);
  const [company, setCompany] = useState(initialCompany);
  const [level, setLevel] = useState(initialLevel);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();

    onApply({
      search: search.trim() || undefined,
      company: company.trim() || undefined,
      level: level || undefined
    });
  };

  return (
    <form className="filters-bar" onSubmit={handleSubmit}>
      <input
        placeholder="Search positions..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />

      <input
        placeholder="Company"
        value={company}
        onChange={(e) => setCompany(e.target.value)}
      />

      <select value={level} onChange={(e) => setLevel(e.target.value)}>
        <option value="">Any level</option>
        <option value="JUNIOR">Junior</option>
        <option value="MIDDLE">Middle</option>
        <option value="SENIOR">Senior</option>
        <option value="C_LEVEL">C-Level</option>
      </select>

      <button type="submit">Apply</button>
    </form>
  );
}
