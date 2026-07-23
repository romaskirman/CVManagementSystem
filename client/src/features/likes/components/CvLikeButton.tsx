import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { likesApi } from '../../../shared/api/likes.api';
import { useAuth } from '../../../app/providers/AuthProvider';
import * as React from 'react';

type CvLikeButtonProps = {
  cvId: string;
  initialLikesCount: number;
};

export function CvLikeButton({ cvId, initialLikesCount }: CvLikeButtonProps) {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const canLike = Boolean(user?.roles.includes('RECRUITER') || user?.roles.includes('ADMIN'));

  const { data } = useQuery({
    queryKey: ['cv-like-state', cvId],
    queryFn: () => likesApi.getCvLikeState(cvId),
    enabled: canLike
  });

  const likeMutation = useMutation({
    mutationFn: () => likesApi.likeCv(cvId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['cv-like-state', cvId] });
      void queryClient.invalidateQueries({ queryKey: ['recruiter-cv-view', cvId] });
      void queryClient.invalidateQueries({ queryKey: ['cv-details', cvId] });
      void queryClient.invalidateQueries({ queryKey: ['my-cvs'] });
      void queryClient.invalidateQueries({ queryKey: ['position-cvs'] });
      void queryClient.invalidateQueries({ queryKey: ['global-search'] });
    }
  });

  const unlikeMutation = useMutation({
    mutationFn: () => likesApi.unlikeCv(cvId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['cv-like-state', cvId] });
      void queryClient.invalidateQueries({ queryKey: ['recruiter-cv-view', cvId] });
      void queryClient.invalidateQueries({ queryKey: ['cv-details', cvId] });
      void queryClient.invalidateQueries({ queryKey: ['my-cvs'] });
      void queryClient.invalidateQueries({ queryKey: ['position-cvs'] });
      void queryClient.invalidateQueries({ queryKey: ['global-search'] });
    }
  });

  const likesCount = data?.likesCount ?? initialLikesCount;
  const likedByMe = data?.likedByMe ?? false;

  if (!canLike) {
    return <span>Likes: {likesCount}</span>;
  }

  return (
    <div className="inline-actions">
      <span>Likes: {likesCount}</span>

      {likedByMe ? (
        <button onClick={() => unlikeMutation.mutate()} disabled={unlikeMutation.isPending}>
          {unlikeMutation.isPending ? 'Removing...' : 'Unlike'}
        </button>
      ) : (
        <button onClick={() => likeMutation.mutate()} disabled={likeMutation.isPending}>
          {likeMutation.isPending ? 'Liking...' : 'Like'}
        </button>
      )}
    </div>
  );
}
