import { apiClient } from '@/lib/api'
import { handleApiError } from '@/lib/errorUtils'
import type {
  BackendExamAssignment,
  BackendExamInstance,
  PaginatedResponse,
  BackendExamResultStatus,
} from '@/types/backend'

function unwrapPaginated<T>(payload: PaginatedResponse<T> | T[]): T[] {
  if (Array.isArray(payload)) {
    return payload
  }
  if ('data' in payload && Array.isArray(payload.data)) {
    return payload.data
  }
  return []
}

export async function fetchAssignedExams() {
  const { data } = await apiClient.get<PaginatedResponse<BackendExamAssignment> | BackendExamAssignment[]>(
    `/exams`,
  )
  return unwrapPaginated(data)
}

export async function fetchAllAssignedExams() {
  const { data } = await apiClient.get<PaginatedResponse<BackendExamAssignment> | BackendExamAssignment[]>(
    `/exams`,
  )
  return unwrapPaginated(data)
}

export async function fetchAllExamStatuses(): Promise<BackendExamResultStatus[]> {
  const { data } = await apiClient.get<BackendExamResultStatus[]>(`/exams/statuses`)
  return unwrapPaginated(data)
}

export async function fetchGroupAssignedExams(groupId: number) {
  const { data } = await apiClient.get<PaginatedResponse<BackendExamAssignment> | BackendExamAssignment[]>(
    `/groups/${groupId}/assigned-exams`,
  )
  return unwrapPaginated(data)
}

export async function fetchExamStatuses(): Promise<BackendExamResultStatus[]> {
  const { data } = await apiClient.get<BackendExamResultStatus[]>(`/exams/statuses`)

  return unwrapPaginated(data)
}

export async function fetchAssignedExam(groupId: number, assignedExamId: number): Promise<BackendExamAssignment> {
  const { data } = await apiClient.get<{ data: BackendExamAssignment }>(
    `/groups/${groupId}/assigned-exams/${assignedExamId}`,
  )

  return data.data
}

export async function createExamInstance(groupId: number, assignedExamId: number) {
  try {
    const { data } = await apiClient.post<{ data: BackendExamInstance }>(
      `/groups/${groupId}/assigned-exams/${assignedExamId}/exam-instances`,
    )
    return data.data
  } catch (error) {
    handleApiError(error, 'Failed to create exam instance')
  }
}

export async function listExamInstances(groupId: number, assignedExamId: number) {
  try {
    const { data } = await apiClient.get<BackendExamInstance[]>(
      `/groups/${groupId}/assigned-exams/${assignedExamId}/exam-instances`,
    )
    return data
  } catch (error) {
    throw error
  }
}

export async function fetchExamInstance(examInstanceId: number) {
  const { data } = await apiClient.get<{ data: BackendExamInstance }>(`/exam-instances/${examInstanceId}`)
  return data.data
}

export async function submitExamAttempt(instanceId: number, attemptId: number, answers: { answers: Array<{ question_id: number; choice_ids?: number[]; text?: string }> }) {
  try {
    const { data } = await apiClient.post(
      `/exam-instances/${instanceId}/attempts/${attemptId}/answers`,
      answers
    )
    return data
  } catch (error) {
    handleApiError(error, 'Failed to submit exam')
  }
}
