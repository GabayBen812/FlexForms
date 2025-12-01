import { api } from './client';

export type ChatGroup = {
  id: string;
  name: string;
  organizationId: string;
  memberIds: string[];
  createdBy: string;
  isArchived: boolean;
  createdAt: string;
  updatedAt: string;
  /**
   * Optional fields that may be provided by the backend to support
   * richer list UIs (last message preview, unread counters, etc.).
   */
  unreadCount?: number;
  lastMessagePreview?: string | null;
};

export type ChatMessage = {
  id: string;
  groupId: string;
  senderId: string;
  content: string;
  createdAt: string;
  updatedAt: string;
  readBy: string[];
};

export type ChatMessagesResponse = {
  messages: ChatMessage[];
  hasMore: boolean;
};

export type SendChatMessageInput = {
  groupId: string;
  content: string;
};

export async function fetchChatGroups(): Promise<ChatGroup[]> {
  const response = await api.get<ChatGroup[]>('/chat/groups');
  return response.data;
}

export async function fetchChatMessages(
  groupId: string,
  params?: { limit?: number; beforeId?: string }
): Promise<ChatMessagesResponse> {
  const response = await api.get<ChatMessagesResponse>(
    `/chat/groups/${groupId}/messages`,
    {
      params: {
        limit: params?.limit,
        beforeId: params?.beforeId,
      },
    }
  );

  return response.data;
}

export async function sendChatMessage(
  input: SendChatMessageInput
): Promise<ChatMessage> {
  const response = await api.post<ChatMessage>(
    `/chat/groups/${input.groupId}/messages`,
    { content: input.content }
  );

  return response.data;
}

