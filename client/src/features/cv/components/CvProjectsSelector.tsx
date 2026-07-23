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
  return (
    <section className="card-block">
      <div className="section-header-inline">
        <h2>Projects</h2>
        <span>Selected: {selectedProjectIds.length}/{maxProjects}</span>
      </div>

      <div className="stack-list">
        {projects.map((project) => {
          const selected = selectedProjectIds.includes(project.id);
          const disabled = !selected && selectedProjectIds.length >= maxProjects;

          return (
            <label key={project.id} className="cv-project-select-row">
              <input
                type="checkbox"
                checked={selected}
                disabled={!canEdit || disabled}
                onChange={() => onToggle(project.id)}
              />

              <div>
                <strong>{project.name}</strong>
                <div>{project.startDate ?? '—'} — {project.endDate ?? 'Present'}</div>
                <div className="tag-cloud">
                  {project.tags.map((tag) => (
                    <span key={tag.name} className="tag-pill">
                      {tag.name}
                    </span>
                  ))}
                </div>
              </div>
            </label>
          );
        })}
      </div>
    </section>
  );
}
