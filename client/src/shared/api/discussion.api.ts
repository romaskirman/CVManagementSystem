import { http } from './http';
import type { DiscussionPost } from '../../features/discussion/types';

export type DiscussionPostPayload = {
  contentMarkdown: string;
};

function mapDiscussionPost(item: any): DiscussionPost {
  return {
    id: item.id,
    authorId: item.author?.id ?? '',
    authorName: item.author?.email ?? 'Unknown user',
    authorRoles: Array.isArray(item.author?.roles) ? item.author.roles : [],
    authorPublicProfileUrl: item.author?.profileUrl ?? null,
    createdAt: item.createdAt,
    contentMarkdown: item.bodyMarkdown ?? '',
    bodyMarkdown: item.bodyMarkdown ?? ''
  };
}

export const discussionApi = {
  async listByPosition(positionId: string) {
    const { data } = await http.get(`/discussion/positions/${positionId}/posts`);

    return {
      ...data,
      items: Array.isArray(data?.items) ? data.items.map(mapDiscussionPost) : []
    };
  },

  async createForPosition(positionId: string, payload: DiscussionPostPayload) {
    const { data } = await http.post(`/discussion/positions/${positionId}/posts`, {
      bodyMarkdown: payload.contentMarkdown
    });

    return mapDiscussionPost(data);
  }
};
