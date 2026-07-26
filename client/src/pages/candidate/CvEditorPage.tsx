import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { cvApi } from '../../shared/api/cv.api';
import { projectsApi } from '../../shared/api/projects.api';
import { positionsApi } from '../../shared/api/positions.api';
import { CvAttributeInlineEditor } from '../../features/cv/components/CvAttributeInlineEditor';
import { CvProjectsSelector } from '../../features/cv/components/CvProjectsSelector';
import { CandidateProject } from '../../features/projects/types';
import { CvAttributeItem, CvDetails } from '../../features/cv/types';
import * as React from 'react';

type DraftRegistryItem = {
  draft: CvAttributeItem;
  isDirty: boolean;
  isEmpty: boolean;
};

function normalizeStringOrNull(value?: string | null) {
  if (typeof value !== 'string') {
    return null;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function areAttributesEqual(left: CvAttributeItem, right: CvAttributeItem) {
  return (
    (left.valueString ?? null) === (right.valueString ?? null) &&
    (left.valueText ?? null) === (right.valueText ?? null) &&
    (left.valueNumber ?? null) === (right.valueNumber ?? null) &&
    (left.valueBoolean ?? null) === (right.valueBoolean ?? null) &&
    (left.valueDate ?? null) === (right.valueDate ?? null) &&
    (left.periodStart ?? null) === (right.periodStart ?? null) &&
    (left.periodEnd ?? null) === (right.periodEnd ?? null) &&
    (left.valueImageUrl ?? null) === (right.valueImageUrl ?? null) &&
    (left.valueOptionId ?? null) === (right.valueOptionId ?? null)
  );
}

export function CvEditorPage() {
  const { cvId } = useParams();
  const [searchParams] = useSearchParams();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const errorBannerRef = React.useRef<HTMLDivElement | null>(null);

  const positionIdForCreate = searchParams.get('positionId');
  const isCreateMode = !cvId && Boolean(positionIdForCreate);

  const [selectedProjectIdsState, setSelectedProjectIdsState] = React.useState<string[]>([]);
  const initializedCvIdRef = React.useRef<string | null>(null);
  const [attributeDrafts, setAttributeDrafts] = React.useState<Record<string, DraftRegistryItem>>({});

  const createMutation = useMutation({
    mutationFn: () => cvApi.create({ positionId: positionIdForCreate! }),
    onSuccess: (created) => {
      navigate(`/cvs/${created.id}`, { replace: true });
    }
  });

  const {
    data: cv,
    isLoading,
    refetch: refetchCv
  } = useQuery({
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
    queryFn: () => positionsApi.getById(cv!.positionId),
    enabled: Boolean(cv?.positionId)
  });

  const saveAttributeMutation = useMutation({
    mutationFn: (params: { cvId: string; payload: any }) =>
      cvApi.updateAttribute(params.cvId, params.payload),
    onSuccess: (updatedCv) => {
      queryClient.setQueryData(['cv-details', cvId], updatedCv);
      void queryClient.invalidateQueries({ queryKey: ['cv-details', cvId] });
      void queryClient.invalidateQueries({ queryKey: ['my-profile'] });
    }
  });

  const saveProjectsMutation = useMutation({
    mutationFn: (payload: {
      version?: number;
      projects: Array<{ projectId: string; sortOrder?: number }>;
    }) => cvApi.updateProjects(cvId!, payload),
    onSuccess: (updatedCv) => {
      queryClient.setQueryData(['cv-details', cvId], updatedCv);
      setSelectedProjectIdsState(updatedCv.projects.map((item) => item.id));
      void queryClient.invalidateQueries({ queryKey: ['cv-details', cvId] });
    }
  });

  const publishMutation = useMutation({
    mutationFn: () => {
      if (!cvId || !cv) {
        throw new Error('CV is not loaded');
      }

      return cvApi.publish(cvId, { version: cv.version });
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['cv-details', cvId] });
      void queryClient.invalidateQueries({ queryKey: ['my-cvs'] });
    }
  });

  const unpublishMutation = useMutation({
    mutationFn: () => {
      if (!cvId || !cv) {
        throw new Error('CV is not loaded');
      }

      return cvApi.unpublish(cvId, { version: cv.version });
    },
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

  React.useEffect(() => {
    if (!cv || !cvId) {
      return;
    }

    if (initializedCvIdRef.current !== cvId) {
      setSelectedProjectIdsState(cv.projects.map((item: { id: string }) => item.id));
      initializedCvIdRef.current = cvId;
      setAttributeDrafts({});
    }
  }, [cv, cvId]);

  const handleDraftChange = React.useCallback(
    (attributeId: string, draft: CvAttributeItem, isDirty: boolean, isEmpty: boolean) => {
      setAttributeDrafts((prev) => {
        const current = prev[attributeId];

        const isSame =
          current &&
          current.isDirty === isDirty &&
          current.isEmpty === isEmpty &&
          areAttributesEqual(current.draft, draft);

        if (isSame) {
          return prev;
        }

        return {
          ...prev,
          [attributeId]: {
            draft,
            isDirty,
            isEmpty
          }
        };
      });
    },
    []
  );

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
  const canEditCv = typedCv.status === 'DRAFT';
  const availableProjects: CandidateProject[] = myProjects?.items ?? [];
  const maxProjects = position?.maxProjects ?? 3;

  const hasEmptyRequired = typedCv.attributes.some((item) => {
    const draftState = attributeDrafts[item.attributeId];
    if (draftState?.isDirty) {
      return item.isRequired && draftState.isEmpty;
    }

    return item.isRequired && item.isEmpty;
  });

  const saveAttribute = async (item: CvAttributeItem, patch: Partial<CvAttributeItem>) => {
    if (!canEditCv) {
      return;
    }

    await saveAttributeMutation.mutateAsync({
      cvId: typedCv.id,
      payload: {
        version: patch.version ?? item.version ?? undefined,
        attributeId: item.attributeId,
        stringValue: normalizeStringOrNull(patch.valueString ?? null),
        textValue: normalizeStringOrNull(patch.valueText ?? null),
        numberValue: patch.valueNumber ?? null,
        booleanValue: patch.valueBoolean ?? null,
        dateValue: patch.valueDate ?? null,
        imageUrl: normalizeStringOrNull(patch.valueImageUrl ?? null),
        optionId: patch.valueOptionId ?? null,
        periodStart: patch.periodStart ?? null,
        periodEnd: patch.periodEnd ?? null
      }
    });

    setAttributeDrafts((prev) => {
      const current = prev[item.attributeId];
      if (!current) {
        return prev;
      }

      return {
        ...prev,
        [item.attributeId]: {
          ...current,
          isDirty: false
        }
      };
    });
  };

  const saveAllDirtyAttributes = async () => {
    if (!canEditCv) {
      return;
    }

    const dirtyEntries = typedCv.attributes.filter((item) => attributeDrafts[item.attributeId]?.isDirty);

    for (const item of dirtyEntries) {
      const draftState = attributeDrafts[item.attributeId];
      if (!draftState) {
        continue;
      }

      await saveAttribute(item, draftState.draft);
    }
  };

  const scrollToErrorBanner = () => {
    errorBannerRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const handlePublish = async () => {
    if (!canEditCv) {
      return;
    }

    await saveAllDirtyAttributes();
    const refreshed = await refetchCv();
    const latestCv = refreshed.data as CvDetails | undefined;

    if (!latestCv) {
      return;
    }

    const hasEmptyAfterSave = latestCv.attributes.some(
      (item: CvAttributeItem) => item.isRequired && item.isEmpty
    );

    if (hasEmptyAfterSave) {
      scrollToErrorBanner();
      return;
    }

    publishMutation.mutate();
  };

  const toggleProject = (projectId: string) => {
    if (!canEditCv || saveProjectsMutation.isPending) {
      return;
    }

    const next = selectedProjectIdsState.includes(projectId)
      ? selectedProjectIdsState.filter((id) => id !== projectId)
      : [...selectedProjectIdsState, projectId];

    setSelectedProjectIdsState(next);

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
              onClick={() => void handlePublish()}
              disabled={publishMutation.isPending || saveAttributeMutation.isPending}
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

      {hasEmptyRequired && typedCv.status === 'DRAFT' && (
        <div ref={errorBannerRef} className="conflict-banner">
          Some required fields are empty. Fill them before publishing.
        </div>
      )}

      <section className="card-block form-section">
        <div className="section-header-inline">
          <h2>Candidate</h2>
          <Link className="btn-secondary" to="/profile">
            Open profile
          </Link>
        </div>

        <div className="cv-candidate-grid">
          <div className="cv-candidate-card">
            <div className="cv-candidate-card__label">First name</div>
            <div className="cv-candidate-card__value">
              {typedCv.builtInFields?.firstName || '—'}
            </div>
          </div>

          <div className="cv-candidate-card">
            <div className="cv-candidate-card__label">Last name</div>
            <div className="cv-candidate-card__value">
              {typedCv.builtInFields?.lastName || '—'}
            </div>
          </div>

          <div className="cv-candidate-card">
            <div className="cv-candidate-card__label">Location</div>
            <div className="cv-candidate-card__value">
              {typedCv.builtInFields?.location || '—'}
            </div>
          </div>

          <div className="cv-candidate-card">
            <div className="cv-candidate-card__label">Email</div>
            <div className="cv-candidate-card__value">
              {typedCv.candidateEmail || '—'}
            </div>
          </div>

          <div className="cv-candidate-card">
            <div className="cv-candidate-card__label">Photo</div>
            <div className="cv-candidate-card__value">
              {typedCv.builtInFields?.photoUrl ? (
                <a href={typedCv.builtInFields.photoUrl} target="_blank" rel="noopener noreferrer">
                  Open image
                </a>
              ) : (
                '—'
              )}
            </div>
          </div>
        </div>
      </section>

      <section className="form-section">
        <div className="section-header-inline">
          <h2>Attributes</h2>
          {canEditCv && (
            <Link className="btn-secondary" to="/profile">
              Open profile
            </Link>
          )}
        </div>

        <div className="stack-list">
          {typedCv.attributes.map((item) => (
            <CvAttributeInlineEditor
              key={item.attributeId}
              item={item}
              canEdit={canEditCv}
              onDraftChange={handleDraftChange}
              onSave={async (patch) => {
                await saveAttribute(item, patch);
              }}
            />
          ))}
        </div>
      </section>

      <CvProjectsSelector
        projects={availableProjects}
        selectedProjectIds={selectedProjectIdsState}
        maxProjects={maxProjects}
        canEdit={canEditCv && !saveProjectsMutation.isPending}
        onToggle={toggleProject}
      />
    </section>
  );
}
