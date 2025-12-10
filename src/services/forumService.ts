import { apiClient } from '@/lib/api';

export interface Category {
  id: number;
  name: string;
  slug: string;
  description: string;
  color: string;
  order: number;
}

export interface User {
  id: number;
  name: string;
  rank?: string;
}

export interface Topic {
  id: number;
  title: string;
  content: string;
  user: User;
  category: Category;
  is_resolved: boolean;
  is_pinned: boolean;
  tags: string[];
  views_count: number;
  last_activity_at: string;
  created_at: string;
  posts_count: number;
  is_liked: boolean;
  likes_count: number;
}

export interface Post {
  id: number;
  content: string;
  user: User;
  is_solution: boolean;
  created_at: string;
  is_liked: boolean;
  likes_count: number;
}

export interface TopicResponse {
  data: Topic[];
  current_page: number;
  last_page: number;
  total: number;
}

export const forumService = {
  getCategories: async (): Promise<Category[]> => {
    const { data } = await apiClient.get<{ data: Category[] }>('/forum/categories');
    return data.data; // Unwrap from Laravel Resource collection
  },

  getTopics: async (params: {
    page?: number;
    category?: string;
    search?: string;
    status?: string;
    sort_by?: string;
  }): Promise<TopicResponse> => {
    const { data } = await apiClient.get<TopicResponse>('/forum/topics', { params });
    return data;
  },

  createTopic: async (payload: {
    title: string;
    content: string;
    category: string;
    tags: string[];
  }): Promise<Topic> => {
    const { data } = await apiClient.post<{ data: Topic }>('/forum/topics', payload);
    return data.data; // Unwrap from Laravel Resource
  },

  getTopic: async (id: string): Promise<{ topic: Topic; posts: Post[] }> => {
    const { data } = await apiClient.get<{ topic: Topic; posts: Post[] }>(`/forum/topics/${id}`);
    return data; // Already in correct format from response()->json()
  },

  reply: async (topicId: string, content: string): Promise<Post> => {
    const { data } = await apiClient.post<{ data: Post }>(`/forum/topics/${topicId}/reply`, { content });
    return data.data; // Unwrap from Laravel Resource
  },

  like: async (type: 'topic' | 'post', id: number): Promise<{ liked: boolean; likes_count: number }> => {
    const { data } = await apiClient.post<{ liked: boolean; likes_count: number }>('/forum/like', { type, id });
    return data;
  },

  resolve: async (topicId: string, postId: number): Promise<void> => {
    await apiClient.post(`/forum/topics/${topicId}/posts/${postId}/resolve`);
  },
};
