import { useQuery } from '@tanstack/react-query';
import { useParams } from 'react-router-dom';
import { cvApi } from '../../shared/api/cv.api';
import { useAuth } from '../../app/providers/AuthProvider';
import { CvDetails } from '../../features/cv/types';
import { CvLikeButton } from '../../features/likes/components/CvLikeButton';
import * as React from 'react';

export function CandidateCvViewPage() {
  const { cvId } = useParams();
  const { user } = useAuth();

  const { data: cv, isLoading } = useQuery({
    queryKey: ['recruiter-cv-view', cvId],
    queryFn: () => cvApi.getById(cvId!),
    enabled: Boolean(cvId)
  });

  if (isLoading || !cv) {
    return <div className="page-section">Loading CV...</div>;
  }

  const typedCv = cv as CvDetails;
  const isAdmin = user?.roles.includes('ADMIN') ?? false;

  return (
    <section className="page-section">
      <div className="page-header">
        <h1>{typedCv.positionTitle}</h1>
        <p>
          Candidate: {typedCv.candidateName ?? typedCv.candidateEmail ?? 'Unknown'} · Status:{' '}
          {typedCv.status}
        </p>
      </div>

      <div className="inline-actions">
        <CvLikeButton cvId={typedCv.id} initialLikesCount={typedCv.likesCount} />
      </div>

      <section className="card-block form-section">
        <h2>Built-in fields</h2>
        <div className="details-grid">
          <div><strong>First name:</strong> {typedCv.builtInFields.firstName || '—'}</div>
          <div><strong>Last name:</strong> {typedCv.builtInFields.lastName || '—'}</div>
          <div><strong>Location:</strong> {typedCv.builtInFields.location || '—'}</div>
          <div>
            <strong>Photo:</strong>{' '}
            {typedCv.builtInFields.photoUrl ? (
              <a href={typedCv.builtInFields.photoUrl} target="_blank" rel="noopener noreferrer">
                Open image
              </a>
            ) : (
              '—'
            )}
          </div>
        </div>
      </section>

      <section className="card-block form-section">
        <h2>Attributes</h2>

        <div className="stack-list">
          {typedCv.attributes.map((item) => (
            <div
              key={item.attributeId}
              className={`cv-attribute-row ${item.isEmpty ? 'cv-attribute-row--empty' : ''}`}
            >
              <div className="cv-attribute-row__header">
                <strong>{item.attributeName}</strong>
                {item.isRequired && <span className="required-mark"> * required</span>}
              </div>

              <div className="cv-attribute-row__body">
                {renderCvReadOnlyValue(item)}
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="card-block form-section">
        <h2>Projects</h2>

        {!typedCv.projects.length ? (
          <div>No projects selected.</div>
        ) : (
          <div className="stack-list">
            {typedCv.projects.map((project) => (
              <div key={project.id} className="inline-editor-row">
                <div>
                  <strong>{project.name}</strong>
                  <div>{project.startDate ?? '—'} — {project.endDate ?? 'Present'}</div>
                  <div className="markdown-preview">{project.descriptionMarkdown}</div>
                  <div className="tag-cloud">
                    {project.tags.map((tag) => (
                      <span key={tag.name} className="tag-pill">
                        {tag.name}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {isAdmin && (
        <section className="card-block">
          <h2>Administrator note</h2>
          <div>Administrator edit mode can be enabled here in the next iteration.</div>
        </section>
      )}
    </section>
  );
}

function renderCvReadOnlyValue(item: CvDetails['attributes'][number]) {
  if (item.isEmpty) {
    return <span className="empty-cv-value">Empty</span>;
  }

  switch (item.attributeType) {
    case 'STRING':
      return item.valueString ?? '—';
    case 'TEXT':
      return <div className="markdown-preview">{item.valueText ?? '—'}</div>;
    case 'NUMERIC':
      return item.valueNumber ?? '—';
    case 'BOOLEAN':
      return item.valueBoolean ? 'Yes' : 'No';
    case 'DATE':
      return item.valueDate ?? '—';
    case 'PERIOD':
      return `${item.periodStart ?? '—'} — ${item.periodEnd ?? '—'}`;
    case 'IMAGE':
      return item.valueImageUrl ? (
        <a href={item.valueImageUrl} target="_blank" rel="noopener noreferrer">
          Open image
        </a>
      ) : (
        '—'
      );
    case 'ONE_OF_MANY':
      return item.valueOptionLabel ?? item.valueOptionId ?? '—';
    default:
      return item.valueString ?? '—';
  }
}
