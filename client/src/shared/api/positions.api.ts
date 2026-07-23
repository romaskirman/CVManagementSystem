import { http } from './http';
import { PositionPayload } from '../../features/positions/types';

export const positionsApi = {
  async list(params?: Record<string, unknown>) {
    const { data } = await http.get('/positions', { params });
    return data;
  },

  async getById(positionId: string) {
    const { data } = await http.get(`/positions/${positionId}`);
    return data;
  },

  async create(payload: PositionPayload) {
    const { data } = await http.post('/positions', payload);
    return data;
  },

  async update(positionId: string, payload: PositionPayload) {
    const { data } = await http.patch(`/positions/${positionId}`, payload);
    return data;
  },

  async duplicate(positionId: string) {
    const { data } = await http.post(`/positions/${positionId}/duplicate`);
    return data;
  },

  async remove(positionId: string) {
    const { data } = await http.delete(`/positions/${positionId}`);
    return data;
  }
};
