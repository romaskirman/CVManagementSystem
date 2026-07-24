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
    <div className="card-block add-attribute-panel">
      <div className="add-attribute-panel__header">
        <h3>Add attribute</h3>
        <p>Find an attribute by prefix and add it to your profile.</p>
      </div>

      <div className="add-attribute-panel__search">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Lookup by prefix..."
          aria-label="Lookup attribute by prefix"
        />
      </div>

      <div className="add-attribute-panel__list">
        {filtered.slice(0, 10).length === 0 ? (
          <div className="add-attribute-panel__empty">No matching attributes found.</div>
        ) : (
          filtered.slice(0, 10).map((attribute) => (
            <div key={attribute.id} className="add-attribute-row">
              <div className="add-attribute-row__content">
                <div className="add-attribute-row__name">{attribute.name}</div>
                <div className="add-attribute-row__meta">
                  <span>{attribute.category}</span>
                  <span>{attribute.type}</span>
                </div>
              </div>

              <button
                type="button"
                className="btn-secondary add-attribute-row__button"
                onClick={() => void handleAdd(attribute.id)}
              >
                Add
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
