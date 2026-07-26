import { useEffect, useMemo, useState } from 'react';
import { CvAttributeItem, CvAttributeOption } from '../types';
import * as React from 'react';

type CvAttributeInlineEditorProps = {
  item: CvAttributeItem;
  canEdit: boolean;
  onSave: (patch: Partial<CvAttributeItem>) => Promise<void>;
  onDraftChange?: (attributeId: string, draft: CvAttributeItem, isDirty: boolean, isEmpty: boolean) => void;
};

function isBlankString(value?: string | null) {
  return value === null || value === undefined || value.trim().length === 0;
}

function isAttributeEmpty(attribute: CvAttributeItem) {
  switch (attribute.attributeType) {
    case 'STRING':
      return isBlankString(attribute.valueString);
    case 'TEXT':
      return isBlankString(attribute.valueText);
    case 'NUMERIC':
      return attribute.valueNumber === null || attribute.valueNumber === undefined;
    case 'BOOLEAN':
      return attribute.valueBoolean === null || attribute.valueBoolean === undefined;
    case 'DATE':
      return isBlankString(attribute.valueDate);
    case 'PERIOD':
      return isBlankString(attribute.periodStart) && isBlankString(attribute.periodEnd);
    case 'IMAGE':
      return isBlankString(attribute.valueImageUrl);
    case 'ONE_OF_MANY':
      return isBlankString(attribute.valueOptionId);
    default:
      return (
        isBlankString(attribute.valueString) &&
        isBlankString(attribute.valueText) &&
        (attribute.valueNumber === null || attribute.valueNumber === undefined) &&
        (attribute.valueBoolean === null || attribute.valueBoolean === undefined) &&
        isBlankString(attribute.valueDate) &&
        isBlankString(attribute.periodStart) &&
        isBlankString(attribute.periodEnd) &&
        isBlankString(attribute.valueImageUrl) &&
        isBlankString(attribute.valueOptionId)
      );
  }
}

function areAttributesEqual(left: CvAttributeItem, right: CvAttributeItem) {
  return (
    (left.valueString ?? null) === (right.valueString ?? null) &&
    (left.valueText ?? null) === (right.valueText ?? null) &&
    (left.valueNumber ?? null) === (right.valueNumber ?? null) &&
    (left.valueBoolean ?? null) === (right.valueBoolean ?? null) &&
    (left.valueDate ?? null) === (right.valueDate ?? null) &&
    (left.periodStart ?? null) === (right.periodStart ?? null) &&
    (left.periodEnd ?? null) === (right.periodEnd ?? null) &&
    (left.valueImageUrl ?? null) === (right.valueImageUrl ?? null) &&
    (left.valueOptionId ?? null) === (right.valueOptionId ?? null)
  );
}

function renderReadonlyValue(item: CvAttributeItem) {
  switch (item.attributeType) {
    case 'STRING':
      return item.valueString?.trim() || '—';

    case 'TEXT':
      return item.valueText?.trim() || '—';

    case 'NUMERIC':
      return item.valueNumber ?? '—';

    case 'BOOLEAN':
      if (item.valueBoolean === null || item.valueBoolean === undefined) {
        return '—';
      }
      return item.valueBoolean ? 'Yes' : 'No';

    case 'DATE':
      return item.valueDate || '—';

    case 'PERIOD':
      if (!item.periodStart && !item.periodEnd) {
        return '—';
      }
      return `${item.periodStart || '—'} — ${item.periodEnd || '—'}`;

    case 'IMAGE':
      return item.valueImageUrl ? (
        <a href={item.valueImageUrl} target="_blank" rel="noopener noreferrer">
          Open image
        </a>
      ) : (
        '—'
      );

    case 'ONE_OF_MANY':
      return item.valueOptionLabel || '—';

    default:
      return item.valueString?.trim() || item.valueText?.trim() || '—';
  }
}

export function CvAttributeInlineEditor({
  item,
  canEdit,
  onSave,
  onDraftChange
}: CvAttributeInlineEditorProps) {
  const [draft, setDraft] = useState<CvAttributeItem>(item);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    setDraft(item);
  }, [item]);

  const isDirty = useMemo(() => !areAttributesEqual(draft, item), [draft, item]);
  const isDraftEmpty = useMemo(() => isAttributeEmpty(draft), [draft]);
  const shouldHighlightInvalid = item.isRequired && isDraftEmpty;

  const updateDraft = (updater: (prev: CvAttributeItem) => CvAttributeItem) => {
    if (!canEdit) {
      return;
    }

    setDraft((prev) => {
      const next = updater(prev);
      const nextIsDirty = !areAttributesEqual(next, item);
      const nextIsEmpty = isAttributeEmpty(next);

      onDraftChange?.(item.attributeId, next, nextIsDirty, nextIsEmpty);
      return next;
    });
  };

  const handleSave = async () => {
    if (!canEdit) {
      return;
    }

    try {
      setIsSaving(true);
      await onSave(draft);
      onDraftChange?.(item.attributeId, draft, false, isAttributeEmpty(draft));
    } finally {
      setIsSaving(false);
    }
  };

  const renderValueEditor = () => {
    if (!canEdit) {
      return <div className="cv-attribute-readonly-value">{renderReadonlyValue(item)}</div>;
    }

    switch (item.attributeType) {
      case 'STRING':
        return (
          <input
            value={draft.valueString ?? ''}
            onChange={(e) => updateDraft((prev) => ({ ...prev, valueString: e.target.value }))}
            disabled={!canEdit}
          />
        );

      case 'TEXT':
        return (
          <textarea
            rows={4}
            value={draft.valueText ?? ''}
            onChange={(e) => updateDraft((prev) => ({ ...prev, valueText: e.target.value }))}
            disabled={!canEdit}
          />
        );

      case 'NUMERIC':
        return (
          <input
            type="number"
            value={draft.valueNumber ?? ''}
            onChange={(e) =>
              updateDraft((prev) => ({
                ...prev,
                valueNumber: e.target.value ? Number(e.target.value) : null
              }))
            }
            disabled={!canEdit}
          />
        );

      case 'BOOLEAN':
        return (
          <label className="checkbox-inline">
            <input
              type="checkbox"
              checked={draft.valueBoolean === true}
              onChange={(e) =>
                updateDraft((prev) => ({
                  ...prev,
                  valueBoolean: e.target.checked
                }))
              }
              disabled={!canEdit}
            />
            Checked
          </label>
        );

      case 'DATE':
        return (
          <div className="cv-attribute-control-card cv-attribute-control-card--single">
            <label className="cv-attribute-field">
              <span className="cv-attribute-field__label">Date</span>
              <div className="cv-attribute-date-shell">
                <input
                  className="cv-attribute-date-input"
                  type="date"
                  value={draft.valueDate ?? ''}
                  onChange={(e) =>
                    updateDraft((prev) => ({
                      ...prev,
                      valueDate: e.target.value || null
                    }))
                  }
                  disabled={!canEdit}
                />
              </div>
            </label>
          </div>
        );

      case 'PERIOD':
        return (
          <div className="cv-attribute-period-grid">
            <div className="cv-attribute-control-card">
              <label className="cv-attribute-field">
                <span className="cv-attribute-field__label">Start date</span>
                <div className="cv-attribute-date-shell">
                  <input
                    className="cv-attribute-date-input"
                    type="date"
                    value={draft.periodStart ?? ''}
                    onChange={(e) =>
                      updateDraft((prev) => ({
                        ...prev,
                        periodStart: e.target.value || null
                      }))
                    }
                    disabled={!canEdit}
                  />
                </div>
              </label>
            </div>

            <div className="cv-attribute-control-card">
              <label className="cv-attribute-field">
                <span className="cv-attribute-field__label">End date</span>
                <div className="cv-attribute-date-shell">
                  <input
                    className="cv-attribute-date-input"
                    type="date"
                    value={draft.periodEnd ?? ''}
                    onChange={(e) =>
                      updateDraft((prev) => ({
                        ...prev,
                        periodEnd: e.target.value || null
                      }))
                    }
                    disabled={!canEdit}
                  />
                </div>
              </label>
            </div>
          </div>
        );

      case 'IMAGE':
        return (
          <input
            value={draft.valueImageUrl ?? ''}
            onChange={(e) =>
              updateDraft((prev) => ({
                ...prev,
                valueImageUrl: e.target.value
              }))
            }
            disabled={!canEdit}
            placeholder="https://example.com/image.jpg"
          />
        );

      case 'ONE_OF_MANY':
        return (
          <div className="cv-attribute-control-card cv-attribute-control-card--single">
            <label className="cv-attribute-field">
              <span className="cv-attribute-field__label">Select value</span>
              <div className="cv-attribute-select-shell">
                <select
                  className="cv-attribute-select"
                  value={draft.valueOptionId ?? ''}
                  onChange={(e) =>
                    updateDraft((prev) => ({
                      ...prev,
                      valueOptionId: e.target.value || null,
                      valueOptionLabel:
                        item.options?.find((option: CvAttributeOption) => option.id === e.target.value)?.label ?? null
                    }))
                  }
                  disabled={!canEdit}
                >
                  <option value="">Select an option</option>
                  {(item.options ?? []).map((option: CvAttributeOption) => (
                    <option key={option.id} value={option.id}>
                      {option.label}
                    </option>
                  ))}
                </select>
                <span className="cv-attribute-select-shell__icon" aria-hidden="true">
                  ▾
                </span>
              </div>
            </label>
          </div>
        );

      default:
        return (
          <input
            value={draft.valueString ?? ''}
            onChange={(e) => updateDraft((prev) => ({ ...prev, valueString: e.target.value }))}
            disabled={!canEdit}
          />
        );
    }
  };

  return (
    <div className={`cv-attribute-row ${shouldHighlightInvalid ? 'cv-attribute-row--empty' : ''}`}>
      <div className="cv-attribute-row__header">
        <div>
          <strong>{item.attributeName}</strong>
          {item.isRequired && <span className="required-mark"> * required</span>}
        </div>

        {canEdit && (
          <button
            type="button"
            className="btn-secondary"
            onClick={() => void handleSave()}
            disabled={isSaving}
          >
            {isSaving ? 'Saving...' : 'Save'}
          </button>
        )}
      </div>

      <div className="cv-attribute-row__body">{renderValueEditor()}</div>
    </div>
  );
}
