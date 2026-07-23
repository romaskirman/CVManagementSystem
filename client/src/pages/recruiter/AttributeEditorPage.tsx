import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { attributesApi, AttributePayload } from '../../shared/api/attributes.api';
import { AttributeForm } from '../../features/attributes/components/AttributeForm';
import * as React from 'react';

export function AttributeEditorPage() {
  const { attributeId } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const isEditMode = Boolean(attributeId);

  const { data: attribute, isLoading } = useQuery({
    queryKey: ['attribute-details', attributeId],
    queryFn: () => attributesApi.getById(attributeId!),
    enabled: Boolean(attributeId)
  });

  const saveMutation = useMutation({
    mutationFn: (payload: AttributePayload) =>
      isEditMode ? attributesApi.update(attributeId!, payload) : attributesApi.create(payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['attributes-library'] });
      void queryClient.invalidateQueries({ queryKey: ['recently-used-attributes'] });
      navigate('/recruiter/attributes');
    }
  });

  const deleteMutation = useMutation({
    mutationFn: () => attributesApi.remove(attributeId!),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['attributes-library'] });
      void queryClient.invalidateQueries({ queryKey: ['recently-used-attributes'] });
      navigate('/recruiter/attributes');
    }
  });

  if (isEditMode && isLoading) {
    return <div className="page-section">Loading attribute...</div>;
  }

  return (
    <section className="page-section">
      <div className="page-header page-header--row">
        <div>
          <h1>{isEditMode ? 'Edit attribute' : 'Create attribute'}</h1>
          <p>Manage reusable library metadata and dropdown options.</p>
        </div>

        {isEditMode && (
          <button
            className="btn-danger"
            onClick={() => deleteMutation.mutate()}
            disabled={deleteMutation.isPending}
          >
            Delete
          </button>
        )}
      </div>

      <AttributeForm
        initialValue={attribute ?? null}
        onSubmit={(payload) => saveMutation.mutate(payload)}
        isSubmitting={saveMutation.isPending}
      />
    </section>
  );
}
