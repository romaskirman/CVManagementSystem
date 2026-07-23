export interface AttributeOptionInput {
  label: string;
  sortOrder?: number;
}

export interface CreateAttributeInput {
  category:
    | 'PERSONAL_INFORMATION'
    | 'CERTIFICATION'
    | 'DOMAIN_KNOWLEDGE'
    | 'SOFT_SKILLS'
    | 'HARD_SKILLS'
    | 'EDUCATION'
    | 'LANGUAGE'
    | 'EXPERIENCE'
    | 'OTHER';
  name: string;
  description: string;
  type: 'STRING' | 'TEXT' | 'IMAGE' | 'NUMERIC' | 'DATE' | 'PERIOD' | 'BOOLEAN' | 'ONE_OF_MANY';
  options: AttributeOptionInput[];
}

export interface UpdateAttributeInput extends CreateAttributeInput {
  version?: number;
}

export interface AttributesQuery {
  page?: number;
  pageSize?: number;
  search?: string;
  prefix?: string;
  category?:
    | 'PERSONAL_INFORMATION'
    | 'CERTIFICATION'
    | 'DOMAIN_KNOWLEDGE'
    | 'SOFT_SKILLS'
    | 'HARD_SKILLS'
    | 'EDUCATION'
    | 'LANGUAGE'
    | 'EXPERIENCE'
    | 'OTHER';
  type?: 'STRING' | 'TEXT' | 'IMAGE' | 'NUMERIC' | 'DATE' | 'PERIOD' | 'BOOLEAN' | 'ONE_OF_MANY';
  recentlyUsedOnly?: boolean;
}
