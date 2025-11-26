import { apiClient } from '@/lib/api';
import type { BackendUser, PaginatedResponse, PaginationMeta } from '@/types/backend';

type ApiResource<T> = { data: T };

const unwrap = <T>(payload: ApiResource<T> | T): T =>
  payload && typeof payload === 'object' && 'data' in payload
    ? (payload as ApiResource<T>).data
    : (payload as T);

export interface CreateUserPayload {
  name: string;
  email: string;
  password: string;
  rank: string;
}

export interface FetchUsersParams {
  page?: number;
  perPage?: number;
  filter?: {
    name?: string;
    email?: string;
  };
  sort?: string;
}

export interface FetchUsersResult {
  users: BackendUser[];
  meta?: PaginationMeta;
}

export async function fetchUsers(params: FetchUsersParams = {}): Promise<FetchUsersResult> {
  const queryParams: any = {
    page: params.page,
    per_page: params.perPage,
  };

  if (params.filter?.name) {
    queryParams['filter[name]'] = params.filter.name;
  }

  if (params.filter?.email) {
    queryParams['filter[email]'] = params.filter.email;
  }

  if (params.sort) {
    queryParams.sort = params.sort;
  }

  const { data } = await apiClient.get<ApiResource<PaginatedResponse<BackendUser>>>('/users', {
    params: queryParams,
  });

  const result = unwrap(data);

  if (Array.isArray(result)) {
    return { users: result };
  }

  return {
    users: result.data ?? [],
    meta: result.meta,
  };
}

export async function fetchUser(userId: number): Promise<BackendUser> {
  const { data } = await apiClient.get<ApiResource<BackendUser>>(`/users/${userId}`);
  return unwrap(data);
}

export async function createUser(payload: CreateUserPayload): Promise<BackendUser> {
  const { data } = await apiClient.post<ApiResource<BackendUser>>('/users', payload);
  return unwrap(data);
}

export async function deleteUser(userId: number): Promise<void> {
  await apiClient.delete(`/users/${userId}`);
}
