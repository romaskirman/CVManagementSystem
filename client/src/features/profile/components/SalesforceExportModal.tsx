import { FormEvent, useState } from 'react';
import * as React from 'react';

type SalesforceExportModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (payload: { company: string; phone?: string | null; notes?: string | null }) => Promise<void>;
  userEmail: string;
};

export function SalesforceExportModal({
  isOpen,
  onClose,
  onSubmit,
  userEmail
}: SalesforceExportModalProps) {
  const [company, setCompany] = useState('');
  const [phone, setPhone] = useState('');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) {
    return null;
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      await onSubmit({
        company: company.trim(),
        phone: phone.trim() || null,
        notes: notes.trim() || null
      });
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to export to Salesforce');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="salesforce-modal-backdrop" role="presentation" onClick={onClose}>
      <div
        className="modal-shell salesforce-modal-shell"
        role="dialog"
        aria-modal="true"
        aria-labelledby="salesforce-modal-title"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-shell__salesforce-header">
          <h2 id="salesforce-modal-title" className="modal-shell__title">
            Create Salesforce record
          </h2>
          <button
            type="button"
            className="modal-shell__salesforce-close"
            onClick={onClose}
            aria-label="Close"
          >
            ×
          </button>
        </div>

        <form className="modal-shell__body salesforce-modal-body" onSubmit={handleSubmit}>
          <p className="salesforce-modal__hint">
            We will create or link an Account and Contact in Salesforce using your profile data.
          </p>

          <div className="salesforce-modal-grid">
            <label className="salesforce-modal-field">
              <span className="salesforce-modal-field__label">Email</span>
              <input
                className="salesforce-modal-field__input salesforce-modal-field__input--readonly"
                value={userEmail}
                readOnly
              />
            </label>

            <label className="salesforce-modal-field">
              <span className="salesforce-modal-field__label">Company</span>
              <input
                className="salesforce-modal-field__input"
                value={company}
                onChange={(e) => setCompany(e.target.value)}
                required
                placeholder="Company name"
              />
            </label>

            <label className="salesforce-modal-field">
              <span className="salesforce-modal-field__label">Phone</span>
              <input
                className="salesforce-modal-field__input"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="Optional phone number"
              />
            </label>

            <label className="salesforce-modal-field salesforce-modal-field--full">
              <span className="salesforce-modal-field__label">Notes</span>
              <textarea
                className="salesforce-modal-field__textarea"
                rows={4}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Add any notes for recruiters or admins"
              />
            </label>
          </div>

          {error && <div className="salesforce-modal-error conflict-banner">{error}</div>}

          <div className="form-actions salesforce-modal-actions">
            <button type="button" className="btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn-primary" disabled={isSubmitting}>
              {isSubmitting ? 'Sending...' : 'Send to Salesforce'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
