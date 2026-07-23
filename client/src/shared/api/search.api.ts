import { http } from './http';

export type SearchScope = 'ALL' | 'POSITIONS' | 'CVS' | 'USERS';

export const searchApi = {
  async global(params: {
    q: string;
    scope?: SearchScope;
    page?: number;
    pageSize?: number;
  }) {
    const { data } = await http.get('/search', { params });
    return data;
  }
};
