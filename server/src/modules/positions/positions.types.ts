export interface PositionAttributeInput {
  attributeId: string;
  sortOrder?: number;
  isRequired: boolean;
}

export interface PositionAccessRuleInput {
  attributeId: string;
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
  sortOrder?: number;
}

export interface CreatePositionInput {
  title: string;
  shortDescription: string;
  visibilityMode: 'PUBLIC' | 'RESTRICTED';
  company?: string | null;
  level?: 'JUNIOR' | 'MIDDLE' | 'SENIOR' | 'C_LEVEL' | null;
  maxProjects: number;
  attributes: PositionAttributeInput[];
  accessRules: PositionAccessRuleInput[];
  projectTags: string[];
}

export interface UpdatePositionInput extends CreatePositionInput {
  version: number;
}

export interface PositionsQuery {
  page?: number;
  pageSize?: number;
  search?: string;
  visibilityMode?: 'PUBLIC' | 'RESTRICTED';
  company?: string;
  level?: 'JUNIOR' | 'MIDDLE' | 'SENIOR' | 'C_LEVEL';
  accessibleOnly?: boolean;
}
