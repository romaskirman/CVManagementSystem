export type CvStatus = 'DRAFT' | 'PUBLISHED';

export type CvAttributeItem = {
  attributeId: string;
  attributeName: string;
  attributeType: string;
  isRequired: boolean;
  isEmpty: boolean;
  valueString?: string | null;
  valueText?: string | null;
  valueNumber?: number | null;
  valueBoolean?: boolean | null;
  valueDate?: string | null;
  valueImageUrl?: string | null;
  valueOptionId?: string | null;
  valueOptionLabel?: string | null;
  periodStart?: string | null;
  periodEnd?: string | null;
};

export type CvProjectItem = {
  id: string;
  name: string;
  startDate?: string | null;
  endDate?: string | null;
  descriptionMarkdown: string;
  tags: Array<{ id?: string; name: string }>;
};

export type CvDetails = {
  id: string;
  positionId: string;
  positionTitle: string;
  candidateId: string;
  candidateName?: string | null;
  candidateEmail?: string | null;
  status: CvStatus;
  isVisibleToRecruiters: boolean;
  likesCount: number;
  version: number;
  builtInFields: {
    firstName: string;
    lastName: string;
    location: string;
    photoUrl: string;
  };
  attributes: CvAttributeItem[];
  projects: CvProjectItem[];
  createdAt: string;
  updatedAt: string;
};

export type CvAttributeUpdatePayload = {
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
};

export type CvProjectSelectionItem = {
  projectId: string;
  sortOrder?: number;
};

export type CvProjectsUpdatePayload = {
  version?: number;
  projects: CvProjectSelectionItem[];
};
