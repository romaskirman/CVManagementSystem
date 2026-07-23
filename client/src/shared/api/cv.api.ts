import { http } from './http';
import { CvAttributeUpdatePayload, CvProjectsUpdatePayload } from '../../features/cv/types';

export const cvApi = {
  async list(params?: Record<string, unknown>) {
    const { data } = await http.get('/cv', { params });
    return data;
  },

  async getById(cvId: string) {
    const { data } = await http.get(`/cv/${cvId}`);
    return data;
  },

  async create(payload: { positionId: string }) {
    const { data } = await http.post('/cv', payload);
    return data;
  },

  async publish(cvId: string, payload: { version: number }) {
    const { data } = await http.post(`/cv/${cvId}/publish`, payload);
    return data;
  },

  async unpublish(cvId: string, payload: { version: number }) {
    const { data } = await http.post(`/cv/${cvId}/unpublish`, payload);
    return data;
  },

  async updateAttribute(cvId: string, payload: CvAttributeUpdatePayload) {
    const { data } = await http.patch(`/cv/${cvId}/attributes/${payload.attributeId}`, payload);
    return data;
  },

  async updateProjects(cvId: string, payload: CvProjectsUpdatePayload) {
    const { data } = await http.patch(`/cv/${cvId}/projects`, payload);
    return data;
  },

  async remove(cvId: string) {
    const { data } = await http.delete(`/cv/${cvId}`);
    return data;
  }
};
