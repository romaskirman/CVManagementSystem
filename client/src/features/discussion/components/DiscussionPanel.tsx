import { FormEvent, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { discussionApi } from '../../../shared/api/discussion.api';
import { useAuth } from '../../../app/providers/AuthProvider';
import { DiscussionPost } from '../types';
import * as React from 'react';

type DiscussionPanelProps = {
  positionId: string;
};

function formatRoles(roles?: string[]) {
  if (!roles?.length) {
    return '';
  }

  return roles
    .map((role) =>
      role
        .split('_')
        .map((part) => part.charAt(0) + part.slice(1).toLowerCase())
        .join(' ')
    )
    .join(', ');
}

export function DiscussionPanel({ positionId }: DiscussionPanelProps) {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const [contentMarkdown, setContentMarkdown] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['position-discussion', positionId],
    queryFn: () => discussionApi.listByPosition(positionId),
    refetchInterval: 3000
  });

  const createMutation = useMutation({
    mutationFn: () => discussionApi.createForPosition(positionId, { contentMarkdown }),
    onSuccess: () => {
      setContentMarkdown('');
      void queryClient.invalidateQueries({ queryKey: ['position-discussion', positionId] });
    }
  });

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();

    if (!contentMarkdown.trim()) {
      return;
    }

    createMutation.mutate();
  };

  const posts: DiscussionPost[] = data?.items ?? [];

  return (
    <section className="card-block form-section">
      <div className="section-header-inline discussions-block-dark">
        <h2>Discussion</h2>
        <span>{posts.length} posts</span>
      </div>

      {user && (
        <form className="entity-form" onSubmit={handleSubmit}>
          <label>
            New post
            <textarea
              rows={5}
              value={contentMarkdown}
              onChange={(e) => setContentMarkdown(e.target.value)}
              placeholder="Write a Markdown-supported discussion message..."
            />
          </label>

          <div className="form-actions">
            <button className="btn-primary" type="submit" disabled={createMutation.isPending}>
              {createMutation.isPending ? 'Posting...' : 'Post message'}
            </button>
          </div>
        </form>
      )}

      {isLoading ? (
        <div>Loading discussion...</div>
      ) : posts.length === 0 ? (
        <div>No discussion posts yet.</div>
      ) : (
        <div className="stack-list discussion-posts-list">
          {posts.map((post) => (
            <article key={post.id} className="discussion-post">
              <div className="discussion-post__meta">
                <div className="discussion-post__author-line">
                  {post.authorPublicProfileUrl ? (
                    <Link to={post.authorPublicProfileUrl}>{post.authorName}</Link>
                  ) : (
                    <strong>{post.authorName}</strong>
                  )}

                  {!!post.authorRoles?.length && (
                    <span className="discussion-post__role">{formatRoles(post.authorRoles)}</span>
                  )}
                </div>

                <span>{new Date(post.createdAt).toLocaleString()}</span>
              </div>

              <div className="markdown-preview">{post.bodyMarkdown}</div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
