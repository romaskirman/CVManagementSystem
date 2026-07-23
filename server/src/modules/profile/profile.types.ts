export interface ProfileAttributeValueInput {
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

export interface UpdateProfileInput {
  version: number;
  attributes: ProfileAttributeValueInput[];
}
