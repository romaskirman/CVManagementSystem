import { FormEvent, useMemo, useState } from 'react';
import { CandidateProject, ProjectPayload } from '../types';
import * as React from 'react';

type ProjectFormProps = {
  initialValue?: CandidateProject | null;
  suggestedTags?: string[];
  onSubmit: (payload: ProjectPayload) => void;
  isSubmitting?: boolean;
};

export function ProjectForm({
  initialValue,
  suggestedTags = [],
  onSubmit,
  isSubmitting = false
}: ProjectFormProps) {
  const [name, setName] = useState(initialValue?.name ?? '');
  const [startDate, setStartDate] = useState(initialValue?.startDate ?? '');
  const [endDate, setEndDate] = useState(initialValue?.endDate ?? '');
  const [descriptionMarkdown, setDescriptionMarkdown] = useState(
    initialValue?.descriptionMarkdown ?? ''
  );
  const [tagsInput, setTagsInput] = useState(
    initialValue?.tags.map((tag) => tag.name).join(', ') ?? ''
  );

  const visibleSuggestions = useMemo(() => {
    const currentTokens = tagsInput
      .split(',')
      .map((item) => item.trim().toLowerCase())
      .filter(Boolean);

    return suggestedTags
      .filter((tag) => !currentTokens.includes(tag.toLowerCase()))
      .slice(0, 8);
  }, [suggestedTags, tagsInput]);

  const addSuggestedTag = (tag: string) => {
    const parts = tagsInput
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean);

    setTagsInput([...parts, tag].join(', '));
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();

    onSubmit({
      name: name.trim(),
      startDate: startDate || null,
      endDate: endDate || null,
      descriptionMarkdown,
      tags: tagsInput
        .split(',')
        .map((item) => item.trim())
        .filter(Boolean),
      ...(typeof initialValue?.version === 'number' ? { version: initialValue.version } : {})
    });
  };

  return (
    <form className="entity-form" onSubmit={handleSubmit}>
      <section className="card-block form-section">
        <h2>Project</h2>

        <label>
          Name
          <input value={name} onChange={(e) => setName(e.target.value)} required />
        </label>

        <div className="form-grid">
          <label>
            Start date
            <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
          </label>

          <label>
            End date
            <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
          </label>
        </div>

        <label>
          Description (Markdown)
          <textarea
            rows={10}
            value={descriptionMarkdown}
            onChange={(e) => setDescriptionMarkdown(e.target.value)}
            placeholder="Describe the project, responsibilities, stack, outcomes..."
          />
        </label>

        <label>
          Technology tags
          <input
            value={tagsInput}
            onChange={(e) => setTagsInput(e.target.value)}
            placeholder="react, typescript, postgresql"
          />
        </label>

        {!!visibleSuggestions.length && (
          <div className="tag-cloud">
            {visibleSuggestions.map((tag) => (
              <button
                key={tag}
                type="button"
                className="tag-pill tag-pill--button"
                onClick={() => addSuggestedTag(tag)}
              >
                + {tag}
              </button>
            ))}
          </div>
        )}
      </section>

      <div className="form-actions">
        <button className="btn-primary" type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Saving...' : 'Save project'}
        </button>
      </div>
    </form>
  );
}
