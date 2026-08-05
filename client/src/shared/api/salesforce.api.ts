import { http } from './http';

export const salesforceApi = {
  async exportCurrentUser(payload: {
    company: string;
    phone?: string | null;
    notes?: string | null;
  }) {
    const { data } = await http.post('/integrations/salesforce/export/me', payload);
    return data;
  }
};
