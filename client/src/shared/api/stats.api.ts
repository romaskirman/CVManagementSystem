import { http } from './http';

function mapPosition(item: any) {
  return {
    ...item,
    hasAccess: typeof item?.hasAccess === 'boolean' ? item.hasAccess : true
  };
}

export const statsApi = {
  async getPublicStats() {
    const { data } = await http.get('/stats/public');
    return data;
  },

  async getLatestPositions() {
    const { data } = await http.get('/stats/latest-positions');
    return Array.isArray(data) ? data.map(mapPosition) : [];
  },

  async getPopularPositions() {
    const { data } = await http.get('/stats/popular-positions');
    return Array.isArray(data) ? data.map(mapPosition) : [];
  },

  async getTagCloud() {
    const { data } = await http.get('/stats/tag-cloud');
    return data;
  }
};
