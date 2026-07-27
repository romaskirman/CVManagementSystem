import { CandidateProject } from '../../projects/types';
import * as React from 'react';

type CvProjectsSelectorProps = {
  projects: CandidateProject[];
  selectedProjectIds: string[];
  maxProjects: number;
  canEdit: boolean;
  onToggle: (projectId: string) => void;
};

export function CvProjectsSelector({
  projects,
  selectedProjectIds,
  maxProjects,
  canEdit,
  onToggle
}: CvProjectsSelectorProps) {
  const visibleProjects = canEdit
    ? projects
    : projects.filter((project) => selectedProjectIds.includes(project.id));

  return (
    <section className="card-block">
      <div className="section-header-inline cv-editor-pojects-title">
        <h2>Projects</h2>
        <span>
          Selected: {selectedProjectIds.length}/{maxProjects}
        </span>
      </div>

      <div className="stack-list">
        {visibleProjects.length === 0 ? (
          <div className="cv-project-card">
            <div className="cv-project-meta-card">
              <div className="cv-project-meta-card__label">Projects</div>
              <div className="cv-project-meta-card__value">—</div>
            </div>
          </div>
        ) : (
          visibleProjects.map((project) => {
            const selected = selectedProjectIds.includes(project.id);
            const disabled = !selected && selectedProjectIds.length >= maxProjects;

            return (
              <div
                key={project.id}
                className={`cv-project-card ${selected ? 'cv-project-card--selected' : ''} ${
                  !canEdit ? 'cv-project-card--readonly' : ''
                }`}
              >
                {canEdit && (
                  <label className="cv-project-select-row">
                    <input
                      type="checkbox"
                      checked={selected}
                      disabled={!canEdit || disabled}
                      onChange={() => onToggle(project.id)}
                    />
                    <span>{selected ? 'Selected' : 'Select project'}</span>
                  </label>
                )}

                <div className="cv-project-meta-grid">
                  <div className="cv-project-meta-card">
                    <div className="cv-project-meta-card__label">Project name</div>
                    <div className="cv-project-meta-card__value">{project.name || '—'}</div>
                  </div>

                  <div className="cv-project-meta-card">
                    <div className="cv-project-meta-card__label">Start date</div>
                    <div className="cv-project-meta-card__value">{project.startDate ?? '—'}</div>
                  </div>

                  <div className="cv-project-meta-card">
                    <div className="cv-project-meta-card__label">End date</div>
                    <div className="cv-project-meta-card__value">{project.endDate ?? 'Present'}</div>
                  </div>

                  <div className="cv-project-meta-card cv-project-meta-card--full">
                    <div className="cv-project-meta-card__label">Description</div>
                    <div className="cv-project-meta-card__value">
                      {project.descriptionMarkdown?.trim() || '—'}
                    </div>
                  </div>

                  <div className="cv-project-meta-card cv-project-meta-card--full">
                    <div className="cv-project-meta-card__label">Tags</div>
                    <div className="cv-project-meta-card__value">
                      {project.tags.length > 0 ? (
                        <div className="tag-cloud">
                          {project.tags.map((tag) => (
                            <span key={tag.name} className="tag-pill">
                              {tag.name}
                            </span>
                          ))}
                        </div>
                      ) : (
                        '—'
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </section>
  );
}
