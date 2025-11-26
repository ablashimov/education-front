import { apiClient } from '@/lib/api';

export interface ExamStatus {
    id: number;
    slug: string;
    name: string;
}

export async function fetchExamStatuses(): Promise<ExamStatus[]> {
    const { data } = await apiClient.get<{ data: ExamStatus[] }>('/exams/statuses');
    return data.data;
}
