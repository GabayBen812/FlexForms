import {
  UseInfiniteQueryOptions,
  UseMutationOptions,
  UseQueryOptions,
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
  InfiniteData,
} from "@tanstack/react-query";
import {
  archiveChatGroup,
  createChatGroup,
  fetchChatGroup,
  fetchChatGroups,
  fetchChatMessages,
  sendChatMessage,
  updateChatGroup,
} from "@/api/chat";
import {
  ChatGroup,
  ChatMessage,
  ChatMessagesResponse,
  CreateChatGroupInput,
  SendChatMessageInput,
  UpdateChatGroupInput,
} from "@/api/chat/types";

const CHAT_QUERY_SCOPE = "chat" as const;

export const chatQueryKeys = {
  all: () => [CHAT_QUERY_SCOPE] as const,
  groups: () => [CHAT_QUERY_SCOPE, "groups"] as const,
  group: (groupId: string) =>
    [CHAT_QUERY_SCOPE, "groups", groupId] as const,
  messages: (groupId: string) =>
    [CHAT_QUERY_SCOPE, "groups", groupId, "messages"] as const,
};

export function useChatGroups(
  options?: UseQueryOptions<ChatGroup[]>
) {
  return useQuery({
    queryKey: chatQueryKeys.groups(),
    queryFn: fetchChatGroups,
    ...options,
  });
}

export function useChatGroup(
  groupId: string,
  options?: UseQueryOptions<ChatGroup, unknown, ChatGroup, ReturnType<typeof chatQueryKeys.group>>
) {
  return useQuery({
    queryKey: chatQueryKeys.group(groupId),
    queryFn: () => fetchChatGroup(groupId),
    enabled: Boolean(groupId),
    ...options,
  });
}

export function useChatMessages(
  groupId: string,
  {
    limit = 50,
    options,
  }: {
    limit?: number;
    options?: UseInfiniteQueryOptions<
      ChatMessagesResponse,
      unknown,
      ChatMessagesResponse,
      ChatMessagesResponse,
      ReturnType<typeof chatQueryKeys.messages>
    >;
  } = {}
) {
  return useInfiniteQuery({
    queryKey: chatQueryKeys.messages(groupId),
    enabled: Boolean(groupId),
    initialPageParam: undefined as string | undefined,
    queryFn: ({ pageParam }) =>
      fetchChatMessages(groupId, {
        limit,
        beforeId: pageParam as string | undefined,
      }),
    getNextPageParam: (lastPage) =>
      lastPage.hasMore
        ? lastPage.messages[0]?.id
        : undefined,
    ...options,
  });
}

export function useCreateChatGroup(
  options?: UseMutationOptions<
    ChatGroup,
    unknown,
    CreateChatGroupInput
  >
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createChatGroup,
    ...options,
    onSuccess: (group, variables, context) => {
      queryClient.setQueryData<ChatGroup[] | undefined>(
        chatQueryKeys.groups(),
        (existing) => {
          if (!existing) {
            return [group];
          }

          const hasGroup = existing.some((item) => item.id === group.id);

          if (hasGroup) {
            return existing.map((item) =>
              item.id === group.id ? group : item
            );
          }

          return [group, ...existing];
        }
      );

      queryClient.invalidateQueries({
        queryKey: chatQueryKeys.groups(),
      });
      options?.onSuccess?.(group, variables, context);
    },
  });
}

export function useUpdateChatGroup(
  groupId: string,
  options?: UseMutationOptions<
    ChatGroup,
    unknown,
    UpdateChatGroupInput
  >
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input) => updateChatGroup(groupId, input),
    ...options,
    onSuccess: (group, variables, context) => {
      queryClient.invalidateQueries({
        queryKey: chatQueryKeys.groups(),
      });
      queryClient.setQueryData(chatQueryKeys.group(group.id), group);
      options?.onSuccess?.(group, variables, context);
    },
  });
}

export function useArchiveChatGroup(
  options?: UseMutationOptions<ChatGroup, unknown, string>
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (groupId) => archiveChatGroup(groupId),
    ...options,
    onSuccess: (group, variables, context) => {
      queryClient.invalidateQueries({
        queryKey: chatQueryKeys.groups(),
      });
      queryClient.removeQueries({
        queryKey: chatQueryKeys.messages(group.id),
      });
      queryClient.setQueryData(chatQueryKeys.group(group.id), group);
      options?.onSuccess?.(group, variables, context);
    },
  });
}

export function useSendChatMessage(
  options?: UseMutationOptions<ChatMessage, unknown, SendChatMessageInput>
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: sendChatMessage,
    ...options,
    onSuccess: (message, variables, context) => {
      queryClient.setQueryData<
        InfiniteData<ChatMessagesResponse>
      >(chatQueryKeys.messages(message.groupId), (existing) => {
        if (!existing) {
          return existing;
        }

        const pages = existing.pages.map((page, index) => {
          if (index !== existing.pages.length - 1) {
            return page;
          }

          const alreadyExists = page.messages.some(
            (item) => item.id === message.id
          );

          if (alreadyExists) {
            return page;
          }

          return {
            ...page,
            messages: [...page.messages, message],
          };
        });

        return {
          ...existing,
          pages,
        };
      });

      options?.onSuccess?.(message, variables, context);
    },
  });
}


