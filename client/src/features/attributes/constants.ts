import { AttributeCategory, AttributeType } from '../../shared/api/attributes.api';

export const ATTRIBUTE_CATEGORY_OPTIONS: Array<{ value: AttributeCategory; label: string }> = [
  { value: 'CERTIFICATION', label: 'Certification' },
  { value: 'DOMAIN_KNOWLEDGE', label: 'Domain knowledge' },
  { value: 'PERSONAL_INFORMATION', label: 'Personal information' },
  { value: 'SOFT_SKILLS', label: 'Soft skills' },
  { value: 'HARD_SKILLS', label: 'Hard skills' },
  { value: 'LANGUAGE', label: 'Language' },
  { value: 'EDUCATION', label: 'Education' },
  { value: 'EXPERIENCE', label: 'Experience' },
  { value: 'OTHER', label: 'Other' }
];

export const ATTRIBUTE_TYPE_OPTIONS: Array<{ value: AttributeType; label: string }> = [
  { value: 'STRING', label: 'String' },
  { value: 'TEXT', label: 'Text (Markdown)' },
  { value: 'IMAGE', label: 'Image URL / external storage' },
  { value: 'NUMERIC', label: 'Numeric' },
  { value: 'DATE', label: 'Date' },
  { value: 'PERIOD', label: 'Period' },
  { value: 'BOOLEAN', label: 'Boolean' },
  { value: 'ONE_OF_MANY', label: 'One of many (dropdown)' }
];
