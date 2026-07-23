import { AttributeCategory, AttributeType } from '../../shared/api/attributes.api';

export type AttributeOption = {
  id?: string;
  label: string;
  sortOrder: number;
};

export type AttributeListItem = {
  id: string;
  category: AttributeCategory;
  name: string;
  description?: string | null;
  type: AttributeType;
  optionsCount?: number;
  usageCount?: number;
  version?: number;
  updatedAt?: string;
};

export type AttributeDetails = {
  id: string;
  category: AttributeCategory;
  name: string;
  description?: string | null;
  type: AttributeType;
  options: AttributeOption[];
  version: number;
  createdAt?: string;
  updatedAt?: string;
};
