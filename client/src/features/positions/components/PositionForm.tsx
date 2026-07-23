import { FormEvent, useMemo, useState } from 'react';
import { PositionDetails, PositionPayload } from '../types';
import { attributesApi } from '../../../shared/api/attributes.api';
import * as React from 'react';

type AttributeOption = {
  id: string;
  name: string;
  category: string;
  type: string;
};

type PositionFormProps = {
  initialValue?: PositionDetails | null;
  allAttributes: AttributeOption[];
  onSubmit: (payload: PositionPayload) => void;
  isSubmitting?: boolean;
};

export function PositionForm({
  initialValue,
  allAttributes,
  onSubmit,
  isSubmitting = false
}: PositionFormProps) {
  const [title, setTitle] = useState(initialValue?.title ?? '');
  const [shortDescription, setShortDescription] = useState(initialValue?.shortDescription ?? '');
  const [visibilityMode, setVisibilityMode] = useState<'PUBLIC' | 'RESTRICTED'>(
    initialValue?.visibilityMode ?? 'PUBLIC'
  );
  const [company, setCompany] = useState(initialValue?.company ?? '');
  const [level, setLevel] = useState(initialValue?.level ?? '');
  const [maxProjects, setMaxProjects] = useState(initialValue?.maxProjects ?? 3);
  const [projectTagsInput, setProjectTagsInput] = useState(
    initialValue?.projectTags.map((tag) => tag.name).join(', ') ?? ''
  );

  const [selectedAttributes, setSelectedAttributes] = useState(
    initialValue?.attributes.map((item) => ({
      attributeId: item.attributeId,
      isRequired: item.isRequired
    })) ?? []
  );

  const [accessRules, setAccessRules] = useState(
    initialValue?.accessRules.map((rule) => ({
      attributeId: rule.attributeId,
      operator: rule.operator,
      stringValue: rule.stringValue ?? '',
      numberValue: rule.numberValue ?? null,
      booleanValue: rule.booleanValue ?? null,
      dateValue: rule.dateValue ?? '',
      secondDateValue: rule.secondDateValue ?? '',
      optionId: rule.optionId ?? ''
    })) ?? []
  );

  const availableAttributes = useMemo(() => allAttributes, [allAttributes]);

  const addAttribute = () => {
    setSelectedAttributes((prev) => [
      ...prev,
      {
        attributeId: '',
        isRequired: true
      }
    ]);
  };

  const updateAttribute = (index: number, patch: Partial<{ attributeId: string; isRequired: boolean }>) => {
    setSelectedAttributes((prev) =>
      prev.map((item, idx) => (idx === index ? { ...item, ...patch } : item))
    );
  };

  const removeAttribute = (index: number) => {
    setSelectedAttributes((prev) => prev.filter((_, idx) => idx !== index));
  };

  const addRule = () => {
    setAccessRules((prev) => [
      ...prev,
      {
        attributeId: '',
        operator: 'EQUALS',
        stringValue: '',
        numberValue: null,
        booleanValue: null,
        dateValue: '',
        secondDateValue: '',
        optionId: ''
      }
    ]);
  };

  const updateRule = (index: number, patch: Record<string, unknown>) => {
    setAccessRules((prev) =>
      prev.map((item, idx) => (idx === index ? { ...item, ...patch } : item))
    );
  };

  const removeRule = (index: number) => {
    setAccessRules((prev) => prev.filter((_, idx) => idx !== index));
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();

    const payload: PositionPayload = {
      title,
      shortDescription,
      visibilityMode,
      company: company || null,
      level: level ? (level as PositionPayload['level']) : null,
      maxProjects: Number(maxProjects),
      attributes: selectedAttributes.map((item, index) => ({
        attributeId: item.attributeId,
        isRequired: item.isRequired,
        sortOrder: index
      })),
      accessRules:
        visibilityMode === 'RESTRICTED'
          ? accessRules.map((rule, index) => ({
              attributeId: rule.attributeId,
              operator: rule.operator,
              stringValue: typeof rule.stringValue === 'string' ? rule.stringValue || null : null,
              numberValue: typeof rule.numberValue === 'number' ? rule.numberValue : null,
              booleanValue: typeof rule.booleanValue === 'boolean' ? rule.booleanValue : null,
              dateValue: typeof rule.dateValue === 'string' && rule.dateValue ? rule.dateValue : null,
              secondDateValue:
                typeof rule.secondDateValue === 'string' && rule.secondDateValue
                  ? rule.secondDateValue
                  : null,
              optionId: typeof rule.optionId === 'string' ? rule.optionId || null : null,
              sortOrder: index
            }))
          : [],
      projectTags: projectTagsInput
        .split(',')
        .map((item) => item.trim())
        .filter(Boolean),
      ...(typeof initialValue?.version === 'number' ? { version: initialValue.version } : {})
    };

    onSubmit(payload);
  };

  return (
    <form className="entity-form" onSubmit={handleSubmit}>
      <section className="card-block form-section">
        <h2>Basic information</h2>

        <label>
          Title
          <input value={title} onChange={(e) => setTitle(e.target.value)} required />
        </label>

        <label>
          Short description
          <textarea
            rows={5}
            value={shortDescription}
            onChange={(e) => setShortDescription(e.target.value)}
            required
          />
        </label>

        <div className="form-grid">
          <label>
            Visibility
            <select
              value={visibilityMode}
              onChange={(e) => setVisibilityMode(e.target.value as 'PUBLIC' | 'RESTRICTED')}
            >
              <option value="PUBLIC">Public</option>
              <option value="RESTRICTED">Restricted</option>
            </select>
          </label>

          <label>
            Company
            <input value={company} onChange={(e) => setCompany(e.target.value)} />
          </label>

          <label>
            Level
            <select value={level} onChange={(e) => setLevel(e.target.value)}>
              <option value="">Not specified</option>
              <option value="JUNIOR">Junior</option>
              <option value="MIDDLE">Middle</option>
              <option value="SENIOR">Senior</option>
              <option value="C_LEVEL">C-Level</option>
            </select>
          </label>

          <label>
            Max projects
            <input
              type="number"
              min={0}
              max={20}
              value={maxProjects}
              onChange={(e) => setMaxProjects(Number(e.target.value))}
            />
          </label>
        </div>

        <label>
          Project tags (comma separated)
          <input
            value={projectTagsInput}
            onChange={(e) => setProjectTagsInput(e.target.value)}
            placeholder="react, node.js, postgresql"
          />
        </label>
      </section>

      <section className="card-block form-section">
        <div className="section-header-inline">
          <h2>Attributes</h2>
          <button type="button" onClick={addAttribute}>
            Add attribute
          </button>
        </div>

        <div className="stack-list">
          {selectedAttributes.map((item, index) => (
            <div key={index} className="inline-editor-row">
              <select
                value={item.attributeId}
                onChange={(e) => {
                  const attributeId = e.target.value;
                  updateAttribute(index, { attributeId });

                  if (attributeId) {
                    void attributesApi.markAsUsed(attributeId);
                  }
                }}
              >
                <option value="">Select attribute</option>
                {availableAttributes.map((attribute) => (
                  <option key={attribute.id} value={attribute.id}>
                    {attribute.name} ({attribute.type})
                  </option>
                ))}
              </select>

              <label className="checkbox-inline">
                <input
                  type="checkbox"
                  checked={item.isRequired}
                  onChange={(e) => updateAttribute(index, { isRequired: e.target.checked })}
                />
                Required
              </label>

              <button type="button" onClick={() => removeAttribute(index)}>
                Remove
              </button>
            </div>
          ))}
        </div>
      </section>

      <section className="card-block form-section">
        <div className="section-header-inline">
          <h2>Access rules</h2>
          <button type="button" onClick={addRule} disabled={visibilityMode !== 'RESTRICTED'}>
            Add rule
          </button>
        </div>

        {visibilityMode === 'PUBLIC' ? (
          <div>This position is public. Access rules are disabled.</div>
        ) : (
          <div className="stack-list">
            {accessRules.map((rule, index) => (
              <div key={index} className="rule-editor-card">
                <div className="form-grid">
                  <label>
                    Attribute
                    <select
                      value={rule.attributeId}
                      onChange={(e) => {
                        const attributeId = e.target.value;
                        updateRule(index, { attributeId });

                        if (attributeId) {
                          void attributesApi.markAsUsed(attributeId);
                        }
                      }}
                    >
                      <option value="">Select attribute</option>
                      {availableAttributes.map((attribute) => (
                        <option key={attribute.id} value={attribute.id}>
                          {attribute.name}
                        </option>
                      ))}
                    </select>
                  </label>

                  <label>
                    Operator
                    <select
                      value={rule.operator}
                      onChange={(e) => updateRule(index, { operator: e.target.value })}
                    >
                      <option value="EQUALS">Equals</option>
                      <option value="NOT_EQUALS">Not equals</option>
                      <option value="CONTAINS">Contains</option>
                      <option value="STARTS_WITH">Starts with</option>
                      <option value="GREATER_THAN">Greater than</option>
                      <option value="GREATER_THAN_OR_EQUAL">Greater or equal</option>
                      <option value="LESS_THAN">Less than</option>
                      <option value="LESS_THAN_OR_EQUAL">Less or equal</option>
                      <option value="IS_TRUE">Is true</option>
                      <option value="IS_FALSE">Is false</option>
                      <option value="BEFORE">Before</option>
                      <option value="AFTER">After</option>
                      <option value="ON">On</option>
                      <option value="OVERLAPS">Overlaps</option>
                      <option value="IN_SET">In set</option>
                    </select>
                  </label>

                  <label>
                    String value
                    <input
                      value={rule.stringValue ?? ''}
                      onChange={(e) => updateRule(index, { stringValue: e.target.value })}
                    />
                  </label>

                  <label>
                    Number value
                    <input
                      type="number"
                      value={rule.numberValue ?? ''}
                      onChange={(e) =>
                        updateRule(index, {
                          numberValue: e.target.value ? Number(e.target.value) : null
                        })
                      }
                    />
                  </label>

                  <label>
                    Date value
                    <input
                      type="datetime-local"
                      value={rule.dateValue ?? ''}
                      onChange={(e) => updateRule(index, { dateValue: e.target.value })}
                    />
                  </label>

                  <label>
                    Second date
                    <input
                      type="datetime-local"
                      value={rule.secondDateValue ?? ''}
                      onChange={(e) => updateRule(index, { secondDateValue: e.target.value })}
                    />
                  </label>

                  <label>
                    Option id
                    <input
                      value={rule.optionId ?? ''}
                      onChange={(e) => updateRule(index, { optionId: e.target.value })}
                    />
                  </label>

                  <label className="checkbox-inline">
                    <input
                      type="checkbox"
                      checked={rule.booleanValue === true}
                      onChange={(e) => updateRule(index, { booleanValue: e.target.checked })}
                    />
                    Boolean true
                  </label>
                </div>

                <button type="button" onClick={() => removeRule(index)}>
                  Remove rule
                </button>
              </div>
            ))}
          </div>
        )}
      </section>

      <div className="form-actions">
        <button className="btn-primary" type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Saving...' : 'Save position'}
        </button>
      </div>
    </form>
  );
}
