import { FormEvent, useMemo, useState } from 'react';
import { AttributePayload } from '../../../shared/api/attributes.api';
import { AttributeDetails } from '../types';
import { ATTRIBUTE_CATEGORY_OPTIONS, ATTRIBUTE_TYPE_OPTIONS } from '../constants';
import * as React from 'react';

type AttributeFormProps = {
  initialValue?: AttributeDetails | null;
  onSubmit: (payload: AttributePayload) => void;
  isSubmitting?: boolean;
};

export function AttributeForm({
  initialValue,
  onSubmit,
  isSubmitting = false
}: AttributeFormProps) {
  const [category, setCategory] = useState(initialValue?.category ?? 'OTHER');
  const [name, setName] = useState(initialValue?.name ?? '');
  const [description, setDescription] = useState(initialValue?.description ?? '');
  const [type, setType] = useState(initialValue?.type ?? 'STRING');
  const [options, setOptions] = useState(
    initialValue?.options?.map((item, index) => ({
      label: item.label,
      sortOrder: item.sortOrder ?? index
    })) ?? []
  );

  const isDropdownType = useMemo(() => type === 'ONE_OF_MANY', [type]);

  const addOption = () => {
    setOptions((prev) => [
      ...prev,
      {
        label: '',
        sortOrder: prev.length
      }
    ]);
  };

  const updateOption = (index: number, label: string) => {
    setOptions((prev) =>
      prev.map((item, idx) => (idx === index ? { ...item, label } : item))
    );
  };

  const removeOption = (index: number) => {
    setOptions((prev) =>
      prev
        .filter((_, idx) => idx !== index)
        .map((item, idx) => ({ ...item, sortOrder: idx }))
    );
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();

    const payload: AttributePayload = {
      category,
      name: name.trim(),
      description: description.trim() || null,
      type,
      options: isDropdownType
        ? options
            .map((item, index) => ({
              label: item.label.trim(),
              sortOrder: index
            }))
            .filter((item) => item.label)
        : [],
      ...(typeof initialValue?.version === 'number' ? { version: initialValue.version } : {})
    };

    onSubmit(payload);
  };

  return (
    <form className="entity-form" onSubmit={handleSubmit}>
      <section className="card-block form-section">
        <h2>Attribute</h2>

        <div className="form-grid">
          <label>
            Category
            <select value={category} onChange={(e) => setCategory(e.target.value as typeof category)}>
              {ATTRIBUTE_CATEGORY_OPTIONS.map((item) => (
                <option key={item.value} value={item.value}>
                  {item.label}
                </option>
              ))}
            </select>
          </label>

          <label>
            Type
            <select value={type} onChange={(e) => setType(e.target.value as typeof type)}>
              {ATTRIBUTE_TYPE_OPTIONS.map((item) => (
                <option key={item.value} value={item.value}>
                  {item.label}
                </option>
              ))}
            </select>
          </label>
        </div>

        <label>
          Name
          <input value={name} onChange={(e) => setName(e.target.value)} required />
        </label>

        <label>
          Description
          <textarea
            rows={4}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Short explanation of the attribute usage"
          />
        </label>
      </section>

      {isDropdownType && (
        <section className="card-block form-section">
          <div className="section-header-inline">
            <h2>Dropdown options</h2>
            <button type="button" onClick={addOption}>
              Add option
            </button>
          </div>

          <div className="stack-list">
            {options.map((item, index) => (
              <div key={index} className="inline-editor-row">
                <input
                  value={item.label}
                  onChange={(e) => updateOption(index, e.target.value)}
                  placeholder={`Option ${index + 1}`}
                />

                <button type="button" onClick={() => removeOption(index)}>
                  Remove
                </button>
              </div>
            ))}
          </div>
        </section>
      )}

      <div className="form-actions">
        <button className="btn-primary" type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Saving...' : 'Save attribute'}
        </button>
      </div>
    </form>
  );
}
