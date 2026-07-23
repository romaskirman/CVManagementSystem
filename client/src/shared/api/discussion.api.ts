import { http } from './http';

export type DiscussionPostPayload = {
  contentMarkdown: string;
};

export const discussionApi = {
  async listByPosition(positionId: string) {
    const { data } = await http.get(`/discussion/positions/${positionId}/posts`);
    return data;
  },

  async createForPosition(positionId: string, payload: DiscussionPostPayload) {
    const { data } = await http.post(`/discussion/positions/${positionId}/posts`, {
      bodyMarkdown: payload.contentMarkdown
    });
    return data;
  }
};
