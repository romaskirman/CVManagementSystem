import { useMemo, useState } from 'react';
import { attributesApi } from '../../../shared/api/attributes.api';
import * as React from 'react';

type AttributeCandidate = {
  id: string;
  name: string;
  category: string;
  type: string;
};

type AddProfileAttributePanelProps = {
  libraryAttributes: AttributeCandidate[];
  selectedAttributeIds: string[];
  onAdd: (attributeId: string) => Promise<void> | void;
};

export function AddProfileAttributePanel({
  libraryAttributes,
  selectedAttributeIds,
  onAdd
}: AddProfileAttributePanelProps) {
  const [query, setQuery] = useState('');

  const filtered = useMemo(() => {
    const normalized = query.trim().toLowerCase();

    return libraryAttributes.filter((item) => {
      if (selectedAttributeIds.includes(item.id)) {
        return false;
      }

      if (!normalized) {
        return true;
      }

      return item.name.toLowerCase().startsWith(normalized);
    });
  }, [libraryAttributes, query, selectedAttributeIds]);

  const handleAdd = async (attributeId: string) => {
    await attributesApi.markAsUsed(attributeId);
    await onAdd(attributeId);
  };

  return (
    <div className="card-block">
      <h3>Add attribute</h3>

      <input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Lookup by prefix..."
      />

      <div className="stack-list">
        {filtered.slice(0, 10).map((attribute) => (
          <div key={attribute.id} className="list-row">
            <div>
              <div>{attribute.name}</div>
              <div>
                {attribute.category} · {attribute.type}
              </div>
            </div>

            <button type="button" onClick={() => void handleAdd(attribute.id)}>
              Add
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
