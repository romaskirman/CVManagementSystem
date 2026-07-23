export type BuiltInProfileFieldKey =
  | 'firstName'
  | 'lastName'
  | 'location'
  | 'photoUrl';

export type BuiltInProfileFields = {
  firstName: string;
  lastName: string;
  location: string;
  photoUrl: string;
};

export type AttributeOption = {
  id: string;
  label: string;
  sortOrder?: number;
};

export type LibraryAttribute = {
  id: string;
  name: string;
  type: string;
  isBuiltIn: boolean;
  options?: AttributeOption[];
};

export type ProfileAttributeValue = {
  id?: string;
  attributeId: string;
  attributeName: string;
  attributeType: string;
  category?: string;
  isBuiltIn?: boolean;
  options?: AttributeOption[];
  stringValue?: string | null;
  textValue?: string | null;
  numberValue?: number | null;
  booleanValue?: boolean | null;
  dateValue?: string | null;
  imageUrl?: string | null;
  optionId?: string | null;
  optionLabel?: string | null;
  periodStart?: string | null;
  periodEnd?: string | null;
};

export type ProfileDetails = {
  userId: string;
  version: number;
  me: BuiltInProfileFields;
  infoAttributes: ProfileAttributeValue[];
  cvs?: any[];
};

export type ProfileSavePayload = {
  version: number;
  attributes: Array<{
    attributeId: string;
    stringValue?: string | null;
    textValue?: string | null;
    numberValue?: number | null;
    booleanValue?: boolean | null;
    dateValue?: string | null;
    imageUrl?: string | null;
    optionId?: string | null;
    periodStart?: string | null;
    periodEnd?: string | null;
  }>;
};
