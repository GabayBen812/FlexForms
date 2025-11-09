export interface ChatGroup {
  id: string;
  name: string;
  organizationId: string;
  memberIds: string[];
  createdBy: string;
  isArchived: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ChatMessage {
  id: string;
  groupId: string;
  senderId: string;
  content: string;
  createdAt: string;
  updatedAt: string;
  readBy: string[];
}

export interface ChatMessagesResponse {
  messages: ChatMessage[];
  hasMore: boolean;
}

export interface CreateChatGroupInput {
  name: string;
  memberIds?: string[];
}

export interface UpdateChatGroupInput {
  name?: string;
  memberIds?: string[];
}

export interface SendChatMessageInput {
  groupId: string;
  content: string;
}


