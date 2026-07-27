import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { projectsApi } from '../../shared/api/projects.api';
import { ProjectForm } from '../../features/projects/components/ProjectForm';
import { CandidateProject, ProjectPayload } from '../../features/projects/types';
import * as React from 'react';

export function MyProjectsPage() {
  const queryClient = useQueryClient();
  const [editingProject, setEditingProject] = useState<CandidateProject | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ['my-projects'],
    queryFn: () => projectsApi.listMine()
  });

  const createMutation = useMutation({
    mutationFn: (payload: ProjectPayload) => projectsApi.create(payload),
    onSuccess: () => {
      setIsCreating(false);
      void queryClient.invalidateQueries({ queryKey: ['my-projects'] });
    }
  });

  const updateMutation = useMutation({
    mutationFn: (params: { projectId: string; payload: ProjectPayload }) =>
      projectsApi.update(params.projectId, params.payload),
    onSuccess: () => {
      setEditingProject(null);
      void queryClient.invalidateQueries({ queryKey: ['my-projects'] });
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (projectId: string) => projectsApi.remove(projectId),
    onSuccess: () => {
      setEditingProject(null);
      void queryClient.invalidateQueries({ queryKey: ['my-projects'] });
    }
  });

  const projects: CandidateProject[] = useMemo(() => data?.items ?? [], [data]);
  const suggestedTags: string[] = [];

  if (isLoading) {
    return <div className="page-section">Loading projects...</div>;
  }

  return (
    <section className="page-section">
      <div className="page-header page-header--row">
        <div>
          <h1>My projects</h1>
          <p>Projects are reused when generating CVs for positions.</p>
        </div>

        <button className="btn-primary" onClick={() => setIsCreating((prev) => !prev)}>
          {isCreating ? 'Cancel' : 'Add project'}
        </button>
      </div>

      {isCreating && (
        <ProjectForm
          suggestedTags={suggestedTags}
          onSubmit={(payload) => createMutation.mutate(payload)}
          isSubmitting={createMutation.isPending}
        />
      )}

      {!projects.length ? (
        <div className="card-block">No projects yet.</div>
      ) : (
        <div className="stack-list">
          {projects.map((project) => {
            const isEditing = editingProject?.id === project.id;

            return (
              <section key={project.id} className="card-block">
                {isEditing ? (
                  <>
                    <div className="section-header-inline edit-project-section">
                      <h2>Edit project</h2>
                      <button
                        className="btn-danger"
                        onClick={() => deleteMutation.mutate(project.id)}
                        disabled={deleteMutation.isPending}
                      >
                        Delete
                      </button>
                    </div>

                    <div className="project-edit-form-shell">
                      <ProjectForm
                        initialValue={project}
                        suggestedTags={suggestedTags}
                        onSubmit={(payload) =>
                          updateMutation.mutate({
                            projectId: project.id,
                            payload
                          })
                        }
                        isSubmitting={updateMutation.isPending}
                      />
                    </div>
                  </>
                ) : (
                  <>
                    <div className="section-header-inline project-card__header">
                      <div className="project-card__title-block">
                        <h2>{project.name}</h2>
                      </div>

                      <button
                        type="button"
                        className="btn-secondary project-card__edit-button"
                        onClick={() => setEditingProject(project)}
                      >
                        Edit
                      </button>
                    </div>

                    <div className="project-card__dates">
                      <div className="project-date-card">
                        <div className="project-date-card__label">Start date</div>
                        <div className="project-date-card__value">{project.startDate ?? '—'}</div>
                      </div>

                      <div className="project-date-card">
                        <div className="project-date-card__label">End date</div>
                        <div className="project-date-card__value">{project.endDate ?? 'Present'}</div>
                      </div>
                    </div>

                    <div className="project-description-card">
                      <div className="project-description-card__label">Description</div>
                      <div className="markdown-preview project-description-card__content">
                        {project.descriptionMarkdown || '—'}
                      </div>
                    </div>

                    <div className="tag-cloud project-card__tags">
                      {project.tags.map((tag) => (
                        <span key={tag.name} className="tag-pill">
                          {tag.name}
                        </span>
                      ))}
                    </div>
                  </>
                )}
              </section>
            );
          })}
        </div>
      )}
    </section>
  );
}
