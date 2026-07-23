import { http } from './http';

export const likesApi = {
  async getCvLikeState(cvId: string) {
    const { data } = await http.get(`/likes/cv/${cvId}`);
    return data;
  },

  async likeCv(cvId: string) {
    const { data } = await http.post(`/likes/cv/${cvId}`);
    return data;
  },

  async unlikeCv(cvId: string) {
    const { data } = await http.delete(`/likes/cv/${cvId}`);
    return data;
  }
};
