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

  const { data: tagSuggestions } = useQuery({
    queryKey: ['project-tag-suggestions'],
    queryFn: () => projectsApi.suggestTags()
  });

  const createMutation = useMutation({
    mutationFn: (payload: ProjectPayload) => projectsApi.create(payload),
    onSuccess: () => {
      setIsCreating(false);
      void queryClient.invalidateQueries({ queryKey: ['my-projects'] });
      void queryClient.invalidateQueries({ queryKey: ['project-tag-suggestions'] });
    }
  });

  const updateMutation = useMutation({
    mutationFn: (params: { projectId: string; payload: ProjectPayload }) =>
      projectsApi.update(params.projectId, params.payload),
    onSuccess: () => {
      setEditingProject(null);
      void queryClient.invalidateQueries({ queryKey: ['my-projects'] });
      void queryClient.invalidateQueries({ queryKey: ['project-tag-suggestions'] });
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (projectId: string) => projectsApi.remove(projectId),
    onSuccess: () => {
      setEditingProject(null);
      void queryClient.invalidateQueries({ queryKey: ['my-projects'] });
      void queryClient.invalidateQueries({ queryKey: ['project-tag-suggestions'] });
    }
  });

  const projects: CandidateProject[] = useMemo(() => data?.items ?? [], [data]);
  const suggestedTags: string[] = useMemo(() => tagSuggestions?.items ?? [], [tagSuggestions]);

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
                    <div className="section-header-inline">
                      <h2>Edit project</h2>
                      <button
                        className="btn-danger"
                        onClick={() => deleteMutation.mutate(project.id)}
                        disabled={deleteMutation.isPending}
                      >
                        Delete
                      </button>
                    </div>

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
                  </>
                ) : (
                  <>
                    <div className="section-header-inline">
                      <div>
                        <h2>{project.name}</h2>
                        <p>
                          {project.startDate ?? '—'} — {project.endDate ?? 'Present'}
                        </p>
                      </div>

                      <button onClick={() => setEditingProject(project)}>Edit</button>
                    </div>

                    <div className="markdown-preview">{project.descriptionMarkdown}</div>

                    <div className="tag-cloud">
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
