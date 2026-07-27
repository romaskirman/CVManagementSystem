import { http } from './http';
import { PositionPayload } from '../../features/positions/types';

function mapPosition(item: any) {
  return {
    ...item,
    hasAccess: typeof item?.hasAccess === 'boolean' ? item.hasAccess : true
  };
}

export const positionsApi = {
  async list(params?: Record<string, unknown>) {
    const { data } = await http.get('/positions', { params });

    if (Array.isArray(data)) {
      return data.map(mapPosition);
    }

    if (Array.isArray(data?.items)) {
      return {
        ...data,
        items: data.items.map(mapPosition)
      };
    }

    return data;
  },

  async getById(positionId: string) {
    const { data } = await http.get(`/positions/${positionId}`);
    return mapPosition(data);
  },

  async create(payload: PositionPayload) {
    const { data } = await http.post('/positions', payload);
    return mapPosition(data);
  },

  async update(positionId: string, payload: PositionPayload) {
    const { data } = await http.patch(`/positions/${positionId}`, payload);
    return mapPosition(data);
  },

  async duplicate(positionId: string) {
    const { data } = await http.post(`/positions/${positionId}/duplicate`);
    return mapPosition(data);
  },

  async remove(positionId: string) {
    const { data } = await http.delete(`/positions/${positionId}`);
    return data;
  }
};
