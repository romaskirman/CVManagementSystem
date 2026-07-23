import { http } from './http';

export const statsApi = {
  async getPublicStats() {
    const { data } = await http.get('/stats/public');
    return data;
  },

  async getLatestPositions() {
    const { data } = await http.get('/stats/latest-positions');
    return data;
  },

  async getPopularPositions() {
    const { data } = await http.get('/stats/popular-positions');
    return data;
  },

  async getTagCloud() {
    const { data } = await http.get('/stats/tag-cloud');
    return data;
  }
};
