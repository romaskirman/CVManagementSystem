import { useState } from 'react';
import { CvAttributeItem } from '../types';
import * as React from 'react';

type CvAttributeInlineEditorProps = {
  item: CvAttributeItem;
  canEdit: boolean;
  onSave: (patch: Partial<CvAttributeItem>) => Promise<void>;
};

export function CvAttributeInlineEditor({
  item,
  canEdit,
  onSave
}: CvAttributeInlineEditorProps) {
  const [draft, setDraft] = useState<CvAttributeItem>(item);
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    try {
      setIsSaving(true);
      await onSave(draft);
    } finally {
      setIsSaving(false);
    }
  };

  const renderValueEditor = () => {
    switch (item.attributeType) {
      case 'STRING':
        return (
          <input
            value={draft.valueString ?? ''}
            onChange={(e) => setDraft((prev) => ({ ...prev, valueString: e.target.value }))}
            disabled={!canEdit}
          />
        );

      case 'TEXT':
        return (
          <textarea
            rows={4}
            value={draft.valueText ?? ''}
            onChange={(e) => setDraft((prev) => ({ ...prev, valueText: e.target.value }))}
            disabled={!canEdit}
          />
        );

      case 'NUMERIC':
        return (
          <input
            type="number"
            value={draft.valueNumber ?? ''}
            onChange={(e) =>
              setDraft((prev) => ({
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
                setDraft((prev) => ({
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
          <input
            type="date"
            value={draft.valueDate ?? ''}
            onChange={(e) => setDraft((prev) => ({ ...prev, valueDate: e.target.value }))}
            disabled={!canEdit}
          />
        );

      case 'PERIOD':
        return (
          <div className="form-grid">
            <input
              type="date"
              value={draft.periodStart ?? ''}
              onChange={(e) => setDraft((prev) => ({ ...prev, periodStart: e.target.value }))}
              disabled={!canEdit}
            />
            <input
              type="date"
              value={draft.periodEnd ?? ''}
              onChange={(e) => setDraft((prev) => ({ ...prev, periodEnd: e.target.value }))}
              disabled={!canEdit}
            />
          </div>
        );

      case 'IMAGE':
        return (
          <input
            value={draft.valueImageUrl ?? ''}
            onChange={(e) => setDraft((prev) => ({ ...prev, valueImageUrl: e.target.value }))}
            disabled={!canEdit}
          />
        );

      case 'ONE_OF_MANY':
        return (
          <input
            value={draft.valueOptionId ?? ''}
            onChange={(e) => setDraft((prev) => ({ ...prev, valueOptionId: e.target.value }))}
            disabled={!canEdit}
            placeholder="Option id"
          />
        );

      default:
        return (
          <input
            value={draft.valueString ?? ''}
            onChange={(e) => setDraft((prev) => ({ ...prev, valueString: e.target.value }))}
            disabled={!canEdit}
          />
        );
    }
  };

  return (
    <div className={`cv-attribute-row ${item.isEmpty ? 'cv-attribute-row--empty' : ''}`}>
      <div className="cv-attribute-row__header">
        <div>
          <strong>{item.attributeName}</strong>
          {item.isRequired && <span className="required-mark"> * required</span>}
        </div>

        {canEdit && (
          <button type="button" onClick={() => void handleSave()} disabled={isSaving}>
            {isSaving ? 'Saving...' : 'Save'}
          </button>
        )}
      </div>

      <div className="cv-attribute-row__body">{renderValueEditor()}</div>
    </div>
  );
}
