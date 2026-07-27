import { http } from './http';
import { CvAttributeUpdatePayload, CvProjectsUpdatePayload, CvDetails } from '../../features/cv/types';

function toInputDate(value?: string | null) {
  if (!value) {
    return null;
  }

  return value.slice(0, 10);
}

function toIsoDateTime(value?: string | null) {
  if (!value) {
    return null;
  }

  if (value.includes('T')) {
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? null : date.toISOString();
  }

  const date = new Date(`${value}T00:00:00.000Z`);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

function mapCvAttribute(item: any) {
  const value = item?.value ?? null;

  return {
    attributeId: item.attributeId,
    attributeName: item.attributeName,
    attributeType: item.attributeType,
    version: item.version ?? null,
    isRequired: Boolean(item.isRequired),
    isEmpty: Boolean(item.isEmpty),
    valueString: value?.stringValue ?? null,
    valueText: value?.textValue ?? null,
    valueNumber: value?.numberValue ?? null,
    valueBoolean: value?.booleanValue ?? null,
    valueDate: toInputDate(value?.dateValue ?? null),
    valueImageUrl: value?.imageUrl ?? null,
    valueOptionId: value?.optionId ?? null,
    valueOptionLabel: value?.optionLabel ?? null,
    periodStart: toInputDate(value?.periodStart ?? null),
    periodEnd: toInputDate(value?.periodEnd ?? null),
    options: Array.isArray(item?.options) ? item.options : []
  };
}

function mapCvProject(project: any) {
  return {
    id: project.id,
    name: project.name,
    startDate: toInputDate(project.periodStart ?? null),
    endDate: toInputDate(project.periodEnd ?? null),
    descriptionMarkdown: project.descriptionMarkdown ?? '',
    tags: Array.isArray(project.tags) ? project.tags : []
  };
}

function mapCvDetails(data: any): CvDetails {
  return {
    id: data.id,
    positionId: data.position?.id ?? '',
    positionTitle: data.position?.title ?? 'Untitled position',
    candidateId: data.candidate?.userId ?? '',
    candidateName: null,
    candidateEmail: data.candidate?.email ?? null,
    status: data.status,
    isVisibleToRecruiters: data.status === 'PUBLISHED',
    likesCount: data.likesCount ?? 0,
    version: data.version ?? 1,
    builtInFields: {
      firstName: data.builtInFields?.firstName ?? '',
      lastName: data.builtInFields?.lastName ?? '',
      location: data.builtInFields?.location ?? '',
      photoUrl: data.builtInFields?.photoUrl ?? ''
    },
    attributes: Array.isArray(data.attributes) ? data.attributes.map(mapCvAttribute) : [],
    projects: Array.isArray(data.projects) ? data.projects.map(mapCvProject) : [],
    createdAt: data.createdAt,
    updatedAt: data.updatedAt
  };
}

function mapCvListItem(item: any) {
  return {
    id: item.id,
    positionTitle: item.positionTitle ?? item.position?.title ?? 'Untitled position',
    status: item.status,
    isVisibleToRecruiters:
      typeof item.isVisibleToRecruiters === 'boolean'
        ? item.isVisibleToRecruiters
        : item.status === 'PUBLISHED',
    hasPositionAccess:
      typeof item.hasPositionAccess === 'boolean' ? item.hasPositionAccess : true,
    likesCount: item.likesCount ?? 0,
    updatedAt: item.updatedAt
  };
}

export const cvApi = {
  async list(params?: Record<string, unknown>) {
    const { data } = await http.get('/cv', { params });

    const items = Array.isArray(data)
      ? data.map(mapCvListItem)
      : Array.isArray(data?.items)
        ? data.items.map(mapCvListItem)
        : [];

    return { items };
  },

  async getById(cvId: string) {
    const { data } = await http.get(`/cv/${cvId}`);
    return mapCvDetails(data);
  },

  async create(payload: { positionId: string }) {
    const { data } = await http.post('/cv', payload);
    return mapCvDetails(data);
  },

  async publish(cvId: string, payload: { version: number }) {
    const { data } = await http.post(`/cv/${cvId}/publish`, payload);
    return mapCvDetails(data);
  },

  async unpublish(cvId: string, payload: { version: number }) {
    const { data } = await http.post(`/cv/${cvId}/unpublish`, payload);
    return mapCvDetails(data);
  },

  async updateAttribute(cvId: string, payload: CvAttributeUpdatePayload) {
    const normalizedPayload = {
      ...payload,
      dateValue: toIsoDateTime(payload.dateValue ?? null),
      periodStart: toIsoDateTime(payload.periodStart ?? null),
      periodEnd: toIsoDateTime(payload.periodEnd ?? null)
    };

    const { data } = await http.patch(`/cv/${cvId}/attributes`, normalizedPayload);
    return mapCvDetails(data);
  },

  async updateProjects(cvId: string, payload: CvProjectsUpdatePayload) {
    const { data } = await http.patch(`/cv/${cvId}/projects`, payload);
    return mapCvDetails(data);
  },

  async remove(cvId: string) {
    const { data } = await http.delete(`/cv/${cvId}`);
    return data;
  }
};
