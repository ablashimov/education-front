import { apiClient } from '@/lib/api';
import type { BackendExamAssignment, PaginatedResponse } from '@/types/backend';

function unwrapPaginated<T>(payload: PaginatedResponse<T> | T[] | { data: T[] }): T[] {
  if (Array.isArray(payload)) return payload;
  // Some APIs wrap in { data: [] }
  if (payload && typeof payload === 'object' && 'data' in payload && Array.isArray((payload as any).data)) {
    return (payload as any).data as T[];
  }
  return [];
}

export interface FetchResultsParams {
  page?: number;
  perPage?: number;
  all?: boolean;
  filter?: {
    name?: string;
  };
  sort?: string;
}

export interface FetchResultsResult {
  assignments: BackendExamAssignment[];
  meta?: {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
  };
}

export async function fetchResults(params: FetchResultsParams = {}): Promise<FetchResultsResult> {
  const queryParams: any = {
    page: params.page,
    per_page: params.perPage,
    all: params.all ? 'true' : undefined,
  };

  if (params.filter?.name) {
    queryParams['filter[user.name]'] = params.filter.name;
  }

  if (params.sort) {
    queryParams.sort = params.sort;
  }

  const { data } = await apiClient.get<PaginatedResponse<BackendExamAssignment> | BackendExamAssignment[] | { data: BackendExamAssignment[] }>(
    '/results',
    {
      params: queryParams,
    },
  );

  if (Array.isArray(data)) {
    return { assignments: data };
  }

  if (data && typeof data === 'object' && 'data' in data && Array.isArray(data.data)) {
    const paginatedData = data as PaginatedResponse<BackendExamAssignment>;
    return {
      assignments: paginatedData.data,
      meta: paginatedData.meta,
    };
  }

  return {
    assignments: [],
  };
}

export async function fetchResultDetail(resultId: string): Promise<BackendExamAssignment> {
  const { data } = await apiClient.get<{ data: BackendExamAssignment }>(`/results/${resultId}`);
  return data.data;
}
