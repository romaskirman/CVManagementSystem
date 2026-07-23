export const CV_STATUSES = {
  DRAFT: 'DRAFT',
  PUBLISHED: 'PUBLISHED'
} as const;

export type CvStatusValue = (typeof CV_STATUSES)[keyof typeof CV_STATUSES];
