export type PositionVisibilityMode = 'PUBLIC' | 'RESTRICTED';
export type PositionLevel = 'JUNIOR' | 'MIDDLE' | 'SENIOR' | 'C_LEVEL';

export type PositionAttribute = {
  id: string;
  attributeId: string;
  sortOrder: number;
  isRequired: boolean;
  attribute: {
    id: string;
    name: string;
    category: string;
    type: string;
    options: Array<{
      id: string;
      label: string;
      sortOrder: number;
    }>;
  };
};

export type PositionAccessRule = {
  id?: string;
  attributeId: string;
  attributeName?: string;
  operator:
    | 'EQUALS'
    | 'NOT_EQUALS'
    | 'CONTAINS'
    | 'STARTS_WITH'
    | 'GREATER_THAN'
    | 'GREATER_THAN_OR_EQUAL'
    | 'LESS_THAN'
    | 'LESS_THAN_OR_EQUAL'
    | 'IS_TRUE'
    | 'IS_FALSE'
    | 'BEFORE'
    | 'AFTER'
    | 'ON'
    | 'OVERLAPS'
    | 'IN_SET';
  stringValue?: string | null;
  numberValue?: number | null;
  booleanValue?: boolean | null;
  dateValue?: string | null;
  secondDateValue?: string | null;
  optionId?: string | null;
  optionLabel?: string | null;
  sortOrder?: number;
};

export type PositionTag = {
  id: string;
  name: string;
};

export type PositionListItem = {
  id: string;
  title: string;
  shortDescription: string;
  visibilityMode: PositionVisibilityMode;
  company?: string | null;
  level?: PositionLevel | null;
  maxProjects?: number;
  version?: number;
  submittedCvCount?: number;
  updatedAt: string;
};

export type PositionDetails = PositionListItem & {
  attributes: PositionAttribute[];
  accessRules: PositionAccessRule[];
  projectTags: PositionTag[];
};

export type PositionPayload = {
  title: string;
  shortDescription: string;
  visibilityMode: PositionVisibilityMode;
  company?: string | null;
  level?: PositionLevel | null;
  maxProjects: number;
  attributes: Array<{
    attributeId: string;
    sortOrder?: number;
    isRequired: boolean;
  }>;
  accessRules: Array<{
    attributeId: string;
    operator: PositionAccessRule['operator'];
    stringValue?: string | null;
    numberValue?: number | null;
    booleanValue?: boolean | null;
    dateValue?: string | null;
    secondDateValue?: string | null;
    optionId?: string | null;
    sortOrder?: number;
  }>;
  projectTags: string[];
  version?: number;
};
