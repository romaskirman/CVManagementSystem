export interface SortingParams {
  sortBy?: string;
  sortOrder?: string;
}

export interface SortingResult {
  sortBy: string;
  sortOrder: 'asc' | 'desc';
}

export function getSorting(
  params: SortingParams,
  allowedFields: string[],
  defaultField: string
): SortingResult {
  const sortBy = allowedFields.includes(String(params.sortBy)) ? String(params.sortBy) : defaultField;
  const sortOrder = params.sortOrder === 'asc' ? 'asc' : 'desc';

  return {
    sortBy,
    sortOrder
  };
}
