import { http } from './http';
import { ProfileSavePayload } from '../../features/profile/types';

export const profileApi = {
  async getMine() {
    const { data } = await http.get('/profile/me');
    return data;
  },

  async saveMine(payload: ProfileSavePayload) {
    const { data } = await http.patch('/profile/me', payload);
    return data;
  },

  async upsertAttribute(
    attributeId: string,
    payload: {
      version?: number;
      stringValue?: string | null;
      textValue?: string | null;
      numberValue?: number | null;
      booleanValue?: boolean | null;
      dateValue?: string | null;
      imageUrl?: string | null;
      optionId?: string | null;
      periodStart?: string | null;
      periodEnd?: string | null;
    }
  ) {
    const { data } = await http.put(`/profile/me/attributes/${attributeId}`, {
      attributeId,
      ...payload
    });

    return data;
  },

  async removeAttribute(attributeId: string) {
    const { data } = await http.delete(`/profile/me/attributes/${attributeId}`);
    return data;
  },

  async getMyCvs() {
    const { data } = await http.get('/profile/me/cvs');
    return data;
  }
};
