export interface PaginationParams {
  page?: number;
  pageSize?: number;
}

export interface PaginationResult {
  page: number;
  pageSize: number;
  skip: number;
  take: number;
}

const DEFAULT_PAGE = 1;
const DEFAULT_PAGE_SIZE = 10;
const MAX_PAGE_SIZE = 100;

export function getPagination(params: PaginationParams): PaginationResult {
  const page = Math.max(Number(params.page) || DEFAULT_PAGE, 1);
  const requestedPageSize = Math.max(Number(params.pageSize) || DEFAULT_PAGE_SIZE, 1);
  const pageSize = Math.min(requestedPageSize, MAX_PAGE_SIZE);

  return {
    page,
    pageSize,
    skip: (page - 1) * pageSize,
    take: pageSize
  };
}
