import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useState } from 'react';
import { positionsApi } from '../../shared/api/positions.api';
import { usePosition } from '../../features/positions/hooks/usePosition';
import { useAuth } from '../../app/providers/AuthProvider';
import { DiscussionPanel } from '../../features/discussion/components/DiscussionPanel';
import * as React from 'react';

type PositionTab = 'overview' | 'discussion';

type PositionAttributeItem = {
  id: string;
  isRequired: boolean;
  attribute: {
    name: string;
    type: string;
  };
};

type PositionAccessRule = {
  attributeId: string;
  attributeName?: string | null;
  operator: string;
};

type PositionProjectTag = {
  id: string;
  name: string;
};

export function PositionDetailsPage() {
  const { positionId } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { data: position, isLoading } = usePosition(positionId);
  const [activeTab, setActiveTab] = useState<PositionTab>('overview');

  const duplicateMutation = useMutation({
    mutationFn: () => positionsApi.duplicate(positionId!),
    onSuccess: (created) => {
      void queryClient.invalidateQueries({ queryKey: ['positions'] });
      navigate(`/recruiter/positions/${created.id}/edit`);
    }
  });

  const deleteMutation = useMutation({
    mutationFn: () => positionsApi.remove(positionId!),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['positions'] });
      navigate('/positions');
    }
  });

  if (isLoading) {
    return <div className="page-section">Loading position...</div>;
  }

  if (!position) {
    return <div className="page-section">Position not found.</div>;
  }

  const canManage = Boolean(
    user?.roles.includes('RECRUITER') || user?.roles.includes('ADMIN')
  );

  const canCreateCv = Boolean(
    user?.roles.includes('CANDIDATE') || user?.roles.includes('ADMIN')
  );

  return (
    <section className="page-section">
      <div className="page-header page-header--row">
        <div>
          <h1>{position.title}</h1>
          <p>{position.shortDescription}</p>
        </div>

        {canManage && (
          <div className="inline-actions">
            <Link className="btn-secondary" to={`/recruiter/positions/${position.id}/edit`}>
              Edit
            </Link>

            <button
              className="btn-secondary"
              onClick={() => duplicateMutation.mutate()}
              disabled={duplicateMutation.isPending}
            >
              Duplicate
            </button>

            <Link className="btn-secondary" to={`/recruiter/positions/${position.id}/cvs`}>
              View CVs
            </Link>

            <button
              className="btn-danger"
              onClick={() => deleteMutation.mutate()}
              disabled={deleteMutation.isPending}
            >
              Delete
            </button>
          </div>
        )}
      </div>

      <div className="tabs-row">
        <button
          className={activeTab === 'overview' ? 'tab-button tab-button--active' : 'tab-button'}
          onClick={() => setActiveTab('overview')}
        >
          Overview
        </button>

        <button
          className={activeTab === 'discussion' ? 'tab-button tab-button--active' : 'tab-button'}
          onClick={() => setActiveTab('discussion')}
        >
          Discussion
        </button>
      </div>

      {activeTab === 'overview' && (
        <>
          <div className="details-grid">
            <section className="card-block">
              <h2>Basic info</h2>
              <dl className="details-list">
                <div><dt>Company</dt><dd>{position.company ?? '—'}</dd></div>
                <div><dt>Level</dt><dd>{position.level ?? '—'}</dd></div>
                <div><dt>Visibility</dt><dd>{position.visibilityMode}</dd></div>
                <div><dt>Max projects</dt><dd>{position.maxProjects ?? 0}</dd></div>
              </dl>
            </section>

            <section className="card-block">
              <h2>Attributes</h2>
              <ul className="clean-list">
                {position.attributes.map((item: PositionAttributeItem) => (
                  <li key={item.id}>
                    <strong>{item.attribute.name}</strong> — {item.attribute.type}
                    {item.isRequired ? ' (required)' : ' (optional)'}
                  </li>
                ))}
              </ul>
            </section>

            <section className="card-block">
              <h2>Access rules</h2>
              {position.accessRules.length === 0 ? (
                <div>No access rules. This position is public.</div>
              ) : (
                <ul className="clean-list">
                  {position.accessRules.map((rule: PositionAccessRule, index: number) => (
                    <li key={`${rule.attributeId}-${index}`}>
                      {rule.attributeName ?? rule.attributeId} — {rule.operator}
                    </li>
                  ))}
                </ul>
              )}
            </section>

            <section className="card-block">
              <h2>Project tags</h2>
              <div className="tag-cloud">
                {position.projectTags.map((tag: PositionProjectTag) => (
                  <span key={tag.id} className="tag-pill">
                    {tag.name}
                  </span>
                ))}
              </div>
            </section>
          </div>

          {canCreateCv && (
            <div className="top-spaced">
              <Link className="btn-primary" to={`/cvs/new?positionId=${position.id}`}>
                Create CV for this position
              </Link>
            </div>
          )}
        </>
      )}

      {activeTab === 'discussion' && <DiscussionPanel positionId={position.id} />}
    </section>
  );
}
