import { http } from './http';
import { ProjectPayload } from '../../features/projects/types';

export const projectsApi = {
  async listMine() {
    const { data } = await http.get('/projects/mine');
    return data;
  },

  async getById(projectId: string) {
    const { data } = await http.get(`/projects/${projectId}`);
    return data;
  },

  async create(payload: ProjectPayload) {
    const { data } = await http.post('/projects', payload);
    return data;
  },

  async update(projectId: string, payload: ProjectPayload) {
    const { data } = await http.patch(`/projects/${projectId}`, payload);
    return data;
  },

  async remove(projectId: string) {
    const { data } = await http.delete(`/projects/${projectId}`);
    return data;
  },

  async suggestTags(params?: { q?: string }) {
    const { data } = await http.get('/projects/tag-suggestions', { params });
    return data;
  }
};
