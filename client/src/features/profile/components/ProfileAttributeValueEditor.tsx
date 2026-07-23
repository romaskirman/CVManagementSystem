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
    <div className="card-block">
      <div className="section-header-inline">
        <h3>{item.attributeName}</h3>

        <div className="inline-actions">
          <button type="button" onClick={() => setIsEditing(true)}>
            Edit
          </button>

          {onRemove && (
            <button type="button" onClick={onRemove}>
              Remove
            </button>
          )}
        </div>
      </div>

      {!isEditing && <div>{renderValue(item)}</div>}

      {isEditing && type === 'STRING' && (
        <input
          autoFocus
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
          value={item.textValue ?? ''}
          onChange={(e) => onChange({ textValue: e.target.value })}
          onBlur={finishEdit}
          placeholder="Markdown-supported text"
        />
      )}

      {isEditing && type === 'IMAGE' && (
        <input
          autoFocus
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
        <label className="checkbox-inline">
          <input
            autoFocus
            type="checkbox"
            checked={item.booleanValue === true}
            onChange={(e) => onChange({ booleanValue: e.target.checked })}
            onBlur={finishEdit}
          />
          Checked
        </label>
      )}

      {isEditing && type === 'DATE' && (
        <input
          autoFocus
          type="date"
          value={fromIsoDate(item.dateValue)}
          onChange={(e) => onChange({ dateValue: toIsoDate(e.target.value) })}
          onBlur={finishEdit}
        />
      )}

      {isEditing && type === 'PERIOD' && (
        <div className="form-grid" onBlur={handlePeriodBlur}>
          <label>
            Start
            <input
              autoFocus
              type="date"
              value={fromIsoDate(item.periodStart)}
              onChange={(e) => onChange({ periodStart: toIsoDate(e.target.value) })}
            />
          </label>

          <label>
            End
            <input
              type="date"
              value={fromIsoDate(item.periodEnd)}
              onChange={(e) => onChange({ periodEnd: toIsoDate(e.target.value) })}
            />
          </label>
        </div>
      )}

      {isEditing && type === 'ONE_OF_MANY' && (
        <select
          autoFocus
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
      )}
    </div>
  );
}
