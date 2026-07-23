import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate, useParams } from 'react-router-dom';
import { positionsApi } from '../../shared/api/positions.api';
import { attributesApi } from '../../shared/api/attributes.api';
import { PositionForm } from '../../features/positions/components/PositionForm';
import { usePosition } from '../../features/positions/hooks/usePosition';
import { PositionPayload } from '../../features/positions/types';
import * as React from 'react';

export function PositionEditorPage() {
  const { positionId } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const isEditMode = Boolean(positionId);

  const { data: position, isLoading: isPositionLoading } = usePosition(positionId);

  const { data: attributesResponse, isLoading: isAttributesLoading } = useQuery({
    queryKey: ['attributes-library-for-position-form'],
    queryFn: () => attributesApi.list({ pageSize: 100 })
  });

  const mutation = useMutation({
    mutationFn: (payload: PositionPayload) =>
      isEditMode ? positionsApi.update(positionId!, payload) : positionsApi.create(payload),
    onSuccess: (saved) => {
      void queryClient.invalidateQueries({ queryKey: ['positions'] });
      void queryClient.invalidateQueries({ queryKey: ['attributes-library'] });

      if (positionId) {
        void queryClient.invalidateQueries({ queryKey: ['position', positionId] });
      }

      navigate(`/positions/${saved.id}`);
    }
  });

  if (isPositionLoading || isAttributesLoading) {
    return <div className="page-section">Loading form...</div>;
  }

  const allAttributes =
    attributesResponse?.items?.map(
      (item: {
        id: string;
        name: string;
        category: string;
        type: string;
      }) => ({
        id: item.id,
        name: item.name,
        category: item.category,
        type: item.type
      })
    ) ?? [];

  return (
    <section className="page-section">
      <div className="page-header">
        <h1>{isEditMode ? 'Edit position' : 'Create position'}</h1>
      </div>

      <PositionForm
        initialValue={position ?? null}
        allAttributes={allAttributes}
        onSubmit={(payload) => mutation.mutate(payload)}
        isSubmitting={mutation.isPending}
      />
    </section>
  );
}
