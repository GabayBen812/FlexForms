import { api } from './client';

export type ChatGroup = {
  id: string;
  name: string;
  unreadCount?: number;
  lastMessagePreview?: string | null;
  updatedAt?: string;
};

export async function fetchChatGroups(): Promise<ChatGroup[]> {
  const response = await api.get<ChatGroup[]>('/chat/groups');
  return response.data;
}

