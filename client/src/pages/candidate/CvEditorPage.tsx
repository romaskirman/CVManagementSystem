import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { cvApi } from '../../shared/api/cv.api';
import { projectsApi } from '../../shared/api/projects.api';
import { positionsApi } from '../../shared/api/positions.api';
import { CvAttributeInlineEditor } from '../../features/cv/components/CvAttributeInlineEditor';
import { CvProjectsSelector } from '../../features/cv/components/CvProjectsSelector';
import { CandidateProject } from '../../features/projects/types';
import { CvDetails } from '../../features/cv/types';
import * as React from 'react';

export function CvEditorPage() {
  const { cvId } = useParams();
  const [searchParams] = useSearchParams();
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const positionIdForCreate = searchParams.get('positionId');
  const isCreateMode = !cvId && Boolean(positionIdForCreate);

  const createMutation = useMutation({
    mutationFn: () => cvApi.create({ positionId: positionIdForCreate! }),
    onSuccess: (created) => {
      navigate(`/cvs/${created.id}`, { replace: true });
    }
  });

  const { data: cv, isLoading } = useQuery({
    queryKey: ['cv-details', cvId],
    queryFn: () => cvApi.getById(cvId!),
    enabled: Boolean(cvId)
  });

  const { data: myProjects } = useQuery({
    queryKey: ['my-projects-for-cv'],
    queryFn: () => projectsApi.listMine(),
    enabled: Boolean(cvId)
  });

  const { data: position } = useQuery({
    queryKey: ['position-for-cv', cv?.positionId],
    queryFn: () => positionsApi.getById(cv.positionId),
    enabled: Boolean(cv?.positionId)
  });

  const saveAttributeMutation = useMutation({
    mutationFn: (params: { cvId: string; payload: any }) =>
      cvApi.updateAttribute(params.cvId, params.payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['cv-details', cvId] });
      void queryClient.invalidateQueries({ queryKey: ['my-profile'] });
    }
  });

  const saveProjectsMutation = useMutation({
    mutationFn: (payload: {
      version?: number;
      projects: Array<{ projectId: string; sortOrder?: number }>;
    }) => cvApi.updateProjects(cvId!, payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['cv-details', cvId] });
    }
  });

  const publishMutation = useMutation({
    mutationFn: () => cvApi.publish(cvId!, { version: cv.version }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['cv-details', cvId] });
      void queryClient.invalidateQueries({ queryKey: ['my-cvs'] });
    }
  });

  const unpublishMutation = useMutation({
    mutationFn: () => cvApi.unpublish(cvId!, { version: cv.version }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['cv-details', cvId] });
      void queryClient.invalidateQueries({ queryKey: ['my-cvs'] });
    }
  });

  const deleteMutation = useMutation({
    mutationFn: () => cvApi.remove(cvId!),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['my-cvs'] });
      navigate('/cvs');
    }
  });

  if (isCreateMode) {
    return (
      <section className="page-section">
        <div className="page-header">
          <h1>Create CV</h1>
          <p>A new CV will be generated from your profile and the selected position.</p>
        </div>

        <button
          className="btn-primary"
          onClick={() => createMutation.mutate()}
          disabled={createMutation.isPending}
        >
          {createMutation.isPending ? 'Creating...' : 'Generate CV'}
        </button>
      </section>
    );
  }

  if (isLoading || !cv) {
    return <div className="page-section">Loading CV...</div>;
  }

  const typedCv = cv as CvDetails;
  const availableProjects: CandidateProject[] = myProjects?.items ?? [];
  const selectedProjectIds = typedCv.projects.map((item) => item.id);
  const maxProjects = position?.maxProjects ?? 3;
  const hasEmptyRequired = typedCv.attributes.some((item) => item.isRequired && item.isEmpty);

  const toggleProject = (projectId: string) => {
    const next = selectedProjectIds.includes(projectId)
      ? selectedProjectIds.filter((id) => id !== projectId)
      : [...selectedProjectIds, projectId];

    saveProjectsMutation.mutate({
      version: typedCv.version,
      projects: next.map((id, index) => ({
        projectId: id,
        sortOrder: index
      }))
    });
  };

  return (
    <section className="page-section">
      <div className="page-header page-header--row">
        <div>
          <h1>{typedCv.positionTitle}</h1>
          <p>Status: {typedCv.status} · Likes: {typedCv.likesCount}</p>
        </div>

        <div className="inline-actions">
          {typedCv.status === 'DRAFT' ? (
            <button
              className="btn-primary"
              onClick={() => publishMutation.mutate()}
              disabled={publishMutation.isPending || hasEmptyRequired}
            >
              Publish
            </button>
          ) : (
            <button
              className="btn-secondary"
              onClick={() => unpublishMutation.mutate()}
              disabled={unpublishMutation.isPending}
            >
              Unpublish
            </button>
          )}

          <button
            className="btn-danger"
            onClick={() => deleteMutation.mutate()}
            disabled={deleteMutation.isPending}
          >
            Delete
          </button>
        </div>
      </div>

      {hasEmptyRequired && (
        <div className="conflict-banner">
          Some required fields are empty. Fill them before publishing.
        </div>
      )}

      <section className="card-block form-section">
        <h2>Candidate</h2>
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

      <section className="form-section">
        <div className="section-header-inline">
          <h2>Attributes</h2>
          <Link className="btn-secondary" to="/profile">
            Open profile
          </Link>
        </div>

        <div className="stack-list">
          {typedCv.attributes.map((item) => (
            <CvAttributeInlineEditor
              key={item.attributeId}
              item={item}
              canEdit={true}
              onSave={async (patch) => {
                await saveAttributeMutation.mutateAsync({
                  cvId: typedCv.id,
                  payload: {
                    version: typedCv.version,
                    attributeId: item.attributeId,
                    stringValue: patch.valueString ?? null,
                    textValue: patch.valueText ?? null,
                    numberValue: patch.valueNumber ?? null,
                    booleanValue: patch.valueBoolean ?? null,
                    dateValue: patch.valueDate ?? null,
                    imageUrl: patch.valueImageUrl ?? null,
                    optionId: patch.valueOptionId ?? null,
                    periodStart: patch.periodStart ?? null,
                    periodEnd: patch.periodEnd ?? null
                  }
                });
              }}
            />
          ))}
        </div>
      </section>

      <CvProjectsSelector
        projects={availableProjects}
        selectedProjectIds={selectedProjectIds}
        maxProjects={maxProjects}
        canEdit={true}
        onToggle={toggleProject}
      />
    </section>
  );
}
