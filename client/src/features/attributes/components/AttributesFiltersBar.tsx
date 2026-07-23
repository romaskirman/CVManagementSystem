import { FormEvent, useState } from 'react';
import { AttributeCategory } from '../../../shared/api/attributes.api';
import { ATTRIBUTE_CATEGORY_OPTIONS } from '../constants';
import * as React from 'react';

type AttributesFiltersBarProps = {
  initialSearch?: string;
  initialCategory?: string;
  initialRecentlyUsedOnly?: boolean;
  onApply: (params: {
    search?: string;
    category?: AttributeCategory;
    recentlyUsedOnly?: boolean;
  }) => void;
};

export function AttributesFiltersBar({
  initialSearch = '',
  initialCategory = '',
  initialRecentlyUsedOnly = false,
  onApply
}: AttributesFiltersBarProps) {
  const [search, setSearch] = useState(initialSearch);
  const [category, setCategory] = useState(initialCategory);
  const [recentlyUsedOnly, setRecentlyUsedOnly] = useState(initialRecentlyUsedOnly);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();

    onApply({
      search: search.trim() || undefined,
      category: (category || undefined) as AttributeCategory | undefined,
      recentlyUsedOnly: recentlyUsedOnly ? true : undefined
    });
  };

  return (
    <form className="filters-bar" onSubmit={handleSubmit}>
      <input
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Search by prefix..."
      />

      <select value={category} onChange={(e) => setCategory(e.target.value)}>
        <option value="">All categories</option>
        {ATTRIBUTE_CATEGORY_OPTIONS.map((item) => (
          <option key={item.value} value={item.value}>
            {item.label}
          </option>
        ))}
      </select>

      <label className="checkbox-inline">
        <input
          type="checkbox"
          checked={recentlyUsedOnly}
          onChange={(e) => setRecentlyUsedOnly(e.target.checked)}
        />
        Recently used only
      </label>

      <button type="submit">Apply</button>
    </form>
  );
}
