import { apiClient } from '@/lib/api';
import type {
  BackendGroup,
  BackendModule,
  BackendLesson,
  BackendUserGroupInvite,
  BackendUser,
  PaginatedResponse,
} from '@/types/backend';

type ApiResource<T> = { data: T };

const hasDataProp = (value: unknown): value is { data: unknown } =>
  typeof value === 'object' && value !== null && 'data' in value;

const unwrapResource = <T>(payload: ApiResource<T> | T): T => {
  if (hasDataProp(payload)) {
    return (payload as ApiResource<T>).data;
  }
  return payload as T;
};

const isPaginatedResponse = <T>(value: unknown): value is PaginatedResponse<T> =>
  !!value && typeof value === 'object' && Array.isArray((value as PaginatedResponse<T>).data);

const unwrapPaginated = <T>(
  payload: PaginatedResponse<T> | ApiResource<PaginatedResponse<T>> | T[],
): PaginatedResponse<T> => {
  if (Array.isArray(payload)) {
    return { data: payload };
  }

  if (isPaginatedResponse<T>(payload)) {
    return payload;
  }

  if (hasDataProp(payload)) {
    const nested = (payload as ApiResource<PaginatedResponse<T>>).data;
    if (isPaginatedResponse<T>(nested)) {
      return nested;
    }
  }

  return { data: [] };
};

export interface FetchGroupsParams {
  page?: number;
  perPage?: number;
}

export interface FetchGroupInvitesParams {
  page?: number;
  perPage?: number;
}

export async function fetchMyGroups(
  params: FetchGroupsParams = {},
): Promise<PaginatedResponse<BackendGroup>> {
  const { data } = await apiClient.get<PaginatedResponse<BackendGroup> | ApiResource<PaginatedResponse<BackendGroup>> | BackendGroup[]>(
    '/groups',
    {
      params: {
        page: params.page,
        per_page: params.perPage,
      },
    },
  );

  return unwrapPaginated(data);
}

export async function fetchAvailableGroups(
  params: FetchGroupsParams = {},
): Promise<PaginatedResponse<BackendGroup>> {
  const { data } = await apiClient.get<PaginatedResponse<BackendGroup> | ApiResource<PaginatedResponse<BackendGroup>> | BackendGroup[]>(
    '/available-groups',
    {
      params: {
        page: params.page,
        per_page: params.perPage,
      },
    },
  );

  return unwrapPaginated(data);
}

export async function getAvailableGroupById(groupId: string): Promise<BackendGroup> {
  const response = await apiClient.get<{ data: BackendGroup }>(`/available-groups/${groupId}`);
  return response.data.data;
}

export async function fetchGroupAvailableUsers(
  groupId: number,
  search = '',
): Promise<BackendUser[]> {
  const { data } = await apiClient.get<
    PaginatedResponse<BackendUser> | ApiResource<PaginatedResponse<BackendUser>> | BackendUser[]
  >(`/groups/${groupId}/invites/available-users`, {
    params: {
      search,
    },
  });

  return unwrapPaginated(data).data;
}

export async function fetchGroupInvites(
  groupId: number,
  params: FetchGroupInvitesParams = {},
): Promise<PaginatedResponse<BackendUserGroupInvite>> {
  const { data } = await apiClient.get<
    PaginatedResponse<BackendUserGroupInvite> | ApiResource<PaginatedResponse<BackendUserGroupInvite>> | BackendUserGroupInvite[]
  >(`/groups/${groupId}/invites`, {
    params: {
      page: params.page,
      per_page: params.perPage,
    },
  });

  return unwrapPaginated(data);
}

export async function getGroupById(groupId: number): Promise<BackendGroup> {
  const response = await apiClient.get<{ data: BackendGroup }>(`/groups/${groupId}`);
  return response.data.data;
}

export async function createGroupInvite(groupId: number, userId: number): Promise<BackendUserGroupInvite> {
  const { data } = await apiClient.post<ApiResource<BackendUserGroupInvite> | BackendUserGroupInvite>(
    `/groups/${groupId}/invites`,
    {
      user_id: userId,
    },
  );

  return hasDataProp(data) ? unwrapResource(data as ApiResource<BackendUserGroupInvite>) : (data as BackendUserGroupInvite);
}

export async function deleteGroupInvite(groupId: number, inviteId: number): Promise<void> {
  await apiClient.delete(`/groups/${groupId}/invites/${inviteId}`);
}

export async function fetchGroupModules(groupId: number): Promise<BackendModule[]> {
  const { data } = await apiClient.get<
    PaginatedResponse<BackendModule> | ApiResource<PaginatedResponse<BackendModule>> | BackendModule[]
  >(`/groups/${groupId}/modules`);

  return unwrapPaginated(data).data;
}

export async function fetchGroupModule(groupId: number, moduleId: number): Promise<BackendModule> {
  const { data } = await apiClient.get<ApiResource<BackendModule> | BackendModule>(
    `/groups/${groupId}/modules/${moduleId}`,
  );
  return hasDataProp(data) ? unwrapResource(data as ApiResource<BackendModule>) : (data as BackendModule);
}

export async function fetchModuleLessons(groupId: number, moduleId: number): Promise<BackendLesson[]> {
  const { data } = await apiClient.get<
    PaginatedResponse<BackendLesson> | ApiResource<PaginatedResponse<BackendLesson>> | BackendLesson[]
  >(`/groups/${groupId}/modules/${moduleId}/lessons`);

  return unwrapPaginated(data).data;
}

export async function fetchLesson(
  groupId: number,
  moduleId: number,
  lessonId: number,
): Promise<BackendLesson> {
  const { data } = await apiClient.get<ApiResource<BackendLesson> | BackendLesson>(
    `/groups/${groupId}/modules/${moduleId}/lessons/${lessonId}`,
  );
  return hasDataProp(data) ? unwrapResource(data as ApiResource<BackendLesson>) : (data as BackendLesson);
}

export interface FetchGroupsParams {
  page?: number;
  perPage?: number;
}
