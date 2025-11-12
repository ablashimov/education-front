import { api } from './api';

export interface Module {
  id: number;
  title: string;
  description?: string;
  order: number;
  lessons_count: number;
  completed_lessons: number;
  start_date?: string;
  end_date?: string;
}

export async function getGroupModules(groupId: number): Promise<Module[]> {
  const response = await api.get(`/groups/${groupId}/modules`);
  return response.data;
}
