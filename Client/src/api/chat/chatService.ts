import apiClient from "@/api/apiClient";
import {
  ChatGroup,
  ChatMessage,
  ChatMessagesResponse,
  CreateChatGroupInput,
  SendChatMessageInput,
  UpdateChatGroupInput,
} from "./types";

const BASE_PATH = "/chat";

export async function fetchChatGroups(): Promise<ChatGroup[]> {
  const { data } = await apiClient.get<ChatGroup[]>(`${BASE_PATH}/groups`);
  return data;
}

export async function fetchChatGroup(
  groupId: string
): Promise<ChatGroup> {
  const { data } = await apiClient.get<ChatGroup>(
    `${BASE_PATH}/groups/${groupId}`
  );
  return data;
}

export async function createChatGroup(
  input: CreateChatGroupInput
): Promise<ChatGroup> {
  const { data } = await apiClient.post<ChatGroup>(
    `${BASE_PATH}/groups`,
    input
  );
  return data;
}

export async function updateChatGroup(
  groupId: string,
  input: UpdateChatGroupInput
): Promise<ChatGroup> {
  const { data } = await apiClient.patch<ChatGroup>(
    `${BASE_PATH}/groups/${groupId}`,
    input
  );
  return data;
}

export async function archiveChatGroup(groupId: string): Promise<ChatGroup> {
  const { data } = await apiClient.delete<ChatGroup>(
    `${BASE_PATH}/groups/${groupId}`
  );
  return data;
}

export async function fetchChatMessages(
  groupId: string,
  params?: { limit?: number; beforeId?: string }
): Promise<ChatMessagesResponse> {
  const { data } = await apiClient.get<ChatMessagesResponse>(
    `${BASE_PATH}/groups/${groupId}/messages`,
    {
      params: {
        limit: params?.limit,
        beforeId: params?.beforeId,
      },
    }
  );
  return data;
}

export async function sendChatMessage(
  input: SendChatMessageInput
): Promise<ChatMessage> {
  const { data } = await apiClient.post<ChatMessage>(
    `${BASE_PATH}/groups/${input.groupId}/messages`,
    { content: input.content }
  );
  return data;
}


