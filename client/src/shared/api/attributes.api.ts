import { http } from './http';

export type AttributeType =
  | 'STRING'
  | 'TEXT'
  | 'IMAGE'
  | 'NUMERIC'
  | 'DATE'
  | 'PERIOD'
  | 'BOOLEAN'
  | 'ONE_OF_MANY';

export type AttributeCategory =
  | 'PERSONAL_INFORMATION'
  | 'CERTIFICATION'
  | 'DOMAIN_KNOWLEDGE'
  | 'SOFT_SKILLS'
  | 'HARD_SKILLS'
  | 'EDUCATION'
  | 'LANGUAGE'
  | 'EXPERIENCE'
  | 'OTHER';

export type AttributeOptionPayload = {
  label: string;
  sortOrder?: number;
};

export type AttributePayload = {
  category: AttributeCategory;
  name: string;
  description?: string | null;
  type: AttributeType;
  options?: AttributeOptionPayload[];
  version?: number;
};

export const attributesApi = {
  async list(params?: Record<string, unknown>) {
    const normalizedParams = Object.fromEntries(
      Object.entries(params ?? {}).filter(([, value]) => value !== '' && value !== undefined && value !== null)
    );

    const { data } = await http.get('/attributes', { params: normalizedParams });
    return data;
  },

  async getById(attributeId: string) {
    const { data } = await http.get(`/attributes/${attributeId}`);
    return data;
  },

  async create(payload: AttributePayload) {
    const { data } = await http.post('/attributes', payload);
    return data;
  },

  async update(attributeId: string, payload: AttributePayload) {
    const { data } = await http.patch(`/attributes/${attributeId}`, payload);
    return data;
  },

  async remove(attributeId: string) {
    const { data } = await http.delete(`/attributes/${attributeId}`);
    return data;
  },

  async getRecentlyUsed(params?: { limit?: number }) {
    const { data } = await http.get('/attributes', {
      params: {
        pageSize: params?.limit ?? 12,
        recentlyUsedOnly: true
      }
    });
    return data;
  },

  async markAsUsed(attributeId: string) {
    const { data } = await http.post(`/attributes/${attributeId}/use`);
    return data;
  },
};
