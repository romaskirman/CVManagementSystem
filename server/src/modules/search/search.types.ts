export interface GlobalSearchQuery {
  q: string;
  scope?: 'ALL' | 'POSITIONS' | 'CVS' | 'USERS';
  page?: number;
  pageSize?: number;
}
