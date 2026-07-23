export const ATTRIBUTE_TYPES = {
  STRING: 'STRING',
  TEXT: 'TEXT',
  IMAGE: 'IMAGE',
  NUMERIC: 'NUMERIC',
  DATE: 'DATE',
  PERIOD: 'PERIOD',
  BOOLEAN: 'BOOLEAN',
  ONE_OF_MANY: 'ONE_OF_MANY'
} as const;

export type AttributeTypeValue = (typeof ATTRIBUTE_TYPES)[keyof typeof ATTRIBUTE_TYPES];
