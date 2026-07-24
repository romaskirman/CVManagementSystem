import { http } from './http';
import { ProjectPayload } from '../../features/projects/types';

function toIsoDateTime(value?: string | null) {
  if (!value) {
    return null;
  }

  return new Date(`${value}T00:00:00.000Z`).toISOString();
}

function toInputDate(value?: string | null) {
  if (!value) {
    return null;
  }

  return value.slice(0, 10);
}

function mapProject(project: any) {
  return {
    ...project,
    startDate: toInputDate(project.periodStart),
    endDate: toInputDate(project.periodEnd)
  };
}

export const projectsApi = {
  async listMine() {
    const { data } = await http.get('/projects/me');

    return {
      items: Array.isArray(data) ? data.map(mapProject) : []
    };
  },

  async getById(projectId: string) {
    const { data } = await http.get(`/projects/user/${projectId}`);

    return Array.isArray(data)
      ? {
          items: data.map(mapProject)
        }
      : data;
  },

  async create(payload: ProjectPayload) {
    const normalizedPayload = {
      name: payload.name,
      periodStart: toIsoDateTime(payload.startDate),
      periodEnd: toIsoDateTime(payload.endDate),
      descriptionMarkdown: payload.descriptionMarkdown,
      tags: payload.tags
    };

    const { data } = await http.post('/projects/me', normalizedPayload);
    return mapProject(data);
  },

  async update(projectId: string, payload: ProjectPayload) {
    const normalizedPayload = {
      name: payload.name,
      periodStart: toIsoDateTime(payload.startDate),
      periodEnd: toIsoDateTime(payload.endDate),
      descriptionMarkdown: payload.descriptionMarkdown,
      tags: payload.tags,
      ...(typeof payload.version === 'number' ? { version: payload.version } : {})
    };

    const { data } = await http.patch(`/projects/me/${projectId}`, normalizedPayload);
    return mapProject(data);
  },

  async remove(projectId: string) {
    const { data } = await http.delete(`/projects/me/${projectId}`);
    return data;
  },

  async suggestTags(params?: { q?: string }) {
    const query = params?.q?.trim();

    const { data } = await http.get('/projects/tags/suggest', {
      params: query ? { query } : {}
    });

    return {
      items: Array.isArray(data) ? data : data?.items ?? []
    };
  }
};
