import { useState } from 'react';
import { ProfileAttributeValue } from '../types';
import * as React from 'react';

type ProfileAttributeValueEditorProps = {
  item: ProfileAttributeValue;
  onChange: (patch: Partial<ProfileAttributeValue>) => void;
  onRemove?: () => void;
};

function toIsoDate(value: string) {
  return value ? new Date(`${value}T00:00:00.000Z`).toISOString() : null;
}

function fromIsoDate(value?: string | null) {
  return value ? value.slice(0, 10) : '';
}

function renderValue(item: ProfileAttributeValue) {
  switch (item.attributeType) {
    case 'STRING':
      return item.stringValue || '—';
    case 'TEXT':
      return item.textValue || '—';
    case 'IMAGE':
      return item.imageUrl || '—';
    case 'NUMERIC':
      return item.numberValue ?? '—';
    case 'BOOLEAN':
      return item.booleanValue === true ? 'Yes' : item.booleanValue === false ? 'No' : '—';
    case 'DATE':
      return fromIsoDate(item.dateValue) || '—';
    case 'PERIOD':
      return item.periodStart || item.periodEnd
        ? `${fromIsoDate(item.periodStart)} — ${fromIsoDate(item.periodEnd)}`
        : '—';
    case 'ONE_OF_MANY':
      return item.optionLabel || item.optionId || '—';
    default:
      return '—';
  }
}

export function ProfileAttributeValueEditor({
  item,
  onChange,
  onRemove
}: ProfileAttributeValueEditorProps) {
  const type = item.attributeType;
  const [isEditing, setIsEditing] = useState(false);

  const finishEdit = () => {
    setIsEditing(false);
  };

  const handlePeriodBlur = (e: React.FocusEvent<HTMLDivElement>) => {
    const nextFocusedElement = e.relatedTarget as Node | null;

    if (nextFocusedElement && e.currentTarget.contains(nextFocusedElement)) {
      return;
    }

    finishEdit();
  };

  return (
    <div className="card-block profile-attribute-card">
      <div className="section-header-inline profile-attribute-card__header">
        <h3>{item.attributeName}</h3>

        <div className="inline-actions profile-attribute-card__actions">
          <button
            type="button"
            className="btn-secondary profile-attribute-card__action"
            onClick={() => setIsEditing(true)}
          >
            Edit
          </button>

          {onRemove && (
            <button
              type="button"
              className="btn-secondary profile-attribute-card__action profile-attribute-card__action--danger"
              onClick={onRemove}
            >
              Remove
            </button>
          )}
        </div>
      </div>

      {!isEditing && (
        <div className="profile-attribute-card__value">
          {renderValue(item)}
        </div>
      )}

      {isEditing && type === 'STRING' && (
        <input
          autoFocus
          className="profile-attribute-input"
          value={item.stringValue ?? ''}
          onChange={(e) => onChange({ stringValue: e.target.value })}
          onBlur={finishEdit}
          placeholder="Enter value"
        />
      )}

      {isEditing && type === 'TEXT' && (
        <textarea
          autoFocus
          rows={5}
          className="profile-attribute-input profile-attribute-input--textarea"
          value={item.textValue ?? ''}
          onChange={(e) => onChange({ textValue: e.target.value })}
          onBlur={finishEdit}
          placeholder="Markdown-supported text"
        />
      )}

      {isEditing && type === 'IMAGE' && (
        <input
          autoFocus
          className="profile-attribute-input"
          value={item.imageUrl ?? ''}
          onChange={(e) => onChange({ imageUrl: e.target.value })}
          onBlur={finishEdit}
          placeholder="External image URL"
        />
      )}

      {isEditing && type === 'NUMERIC' && (
        <input
          autoFocus
          type="number"
          className="profile-attribute-input"
          value={item.numberValue ?? ''}
          onChange={(e) =>
            onChange({
              numberValue: e.target.value ? Number(e.target.value) : null
            })
          }
          onBlur={finishEdit}
          placeholder="Enter number"
        />
      )}

      {isEditing && type === 'BOOLEAN' && (
        <label className="profile-attribute-checkbox">
          <input
            autoFocus
            type="checkbox"
            checked={item.booleanValue === true}
            onChange={(e) => onChange({ booleanValue: e.target.checked })}
            onBlur={finishEdit}
          />
          <span>Checked</span>
        </label>
      )}

      {isEditing && type === 'DATE' && (
        <div className="profile-attribute-date-shell">
          <input
            autoFocus
            type="date"
            className="profile-attribute-date-input"
            value={fromIsoDate(item.dateValue)}
            onChange={(e) => onChange({ dateValue: toIsoDate(e.target.value) })}
            onBlur={finishEdit}
          />
        </div>
      )}

      {isEditing && type === 'PERIOD' && (
        <div className="form-grid profile-attribute-period-grid" onBlur={handlePeriodBlur}>
          <label className="profile-attribute-field">
            <span className="profile-attribute-field__label">Start</span>
            <div className="profile-attribute-date-shell">
              <input
                autoFocus
                type="date"
                className="profile-attribute-date-input"
                value={fromIsoDate(item.periodStart)}
                onChange={(e) => onChange({ periodStart: toIsoDate(e.target.value) })}
              />
            </div>
          </label>

          <label className="profile-attribute-field">
            <span className="profile-attribute-field__label">End</span>
            <div className="profile-attribute-date-shell">
              <input
                type="date"
                className="profile-attribute-date-input"
                value={fromIsoDate(item.periodEnd)}
                onChange={(e) => onChange({ periodEnd: toIsoDate(e.target.value) })}
              />
            </div>
          </label>
        </div>
      )}

      {isEditing && type === 'ONE_OF_MANY' && (
        <div className="profile-attribute-select-shell">
          <select
            autoFocus
            className="profile-attribute-select"
            value={item.optionId ?? ''}
            onChange={(e) => onChange({ optionId: e.target.value || null })}
            onBlur={finishEdit}
          >
            <option value="">Select option</option>
            {(item.options ?? []).map((option) => (
              <option key={option.id} value={option.id}>
                {option.label}
              </option>
            ))}
          </select>

          <span className="profile-attribute-select-shell__icon">▾</span>
        </div>
      )}
    </div>
  );
}
