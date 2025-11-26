import { apiClient } from '@/lib/api';
import type { BackendExamAssignment, PaginatedResponse } from '@/types/backend';



export interface FetchResultsParams {
  page?: number;
  perPage?: number;
  all?: boolean;
  filter?: {
    name?: string;
    global?: string;
    status?: string;
    start_date?: string;
    end_date?: string;
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

  if (params.filter?.global) {
    queryParams['filter[global]'] = params.filter.global;
  }

  if (params.filter?.status) {
    queryParams['filter[resultStatus.slug]'] = params.filter.status;
  }

  if (params.filter?.start_date) {
    queryParams['filter[start_date]'] = params.filter.start_date;
  }

  if (params.filter?.end_date) {
    queryParams['filter[end_date]'] = params.filter.end_date;
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
