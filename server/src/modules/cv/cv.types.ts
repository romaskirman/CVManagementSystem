export interface CreateCvInput {
  positionId: string;
}

export interface UpdateCvAttributeInput {
  attributeId: string;
  version?: number;
  stringValue?: string | null;
  textValue?: string | null;
  numberValue?: number | null;
  booleanValue?: boolean | null;
  dateValue?: string | null;
  periodStart?: string | null;
  periodEnd?: string | null;
  imageUrl?: string | null;
  optionId?: string | null;
}

export interface ReorderCvProjectsItemInput {
  projectId: string;
  sortOrder?: number;
}

export interface UpdateCvProjectsInput {
  version?: number;
  projects: ReorderCvProjectsItemInput[];
}

export interface ListCvsQuery {
  page?: number;
  pageSize?: number;
  status?: 'DRAFT' | 'PUBLISHED';
  positionId?: string;
  candidateUserId?: string;
}
