import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
  type InfiniteData,
  type UseInfiniteQueryOptions,
  type UseMutationOptions,
  type UseQueryOptions,
} from '@tanstack/react-query';

import {
  fetchChatGroups,
  fetchChatMessages,
  sendChatMessage,
  type ChatGroup,
  type ChatMessage,
  type ChatMessagesResponse,
  type SendChatMessageInput,
} from '../../api/chat';

const CHAT_QUERY_SCOPE = 'chat' as const;

export const chatQueryKeys = {
  all: () => [CHAT_QUERY_SCOPE] as const,
  groups: () => [CHAT_QUERY_SCOPE, 'groups'] as const,
  group: (groupId: string) => [CHAT_QUERY_SCOPE, 'groups', groupId] as const,
  messages: (groupId: string) =>
    [CHAT_QUERY_SCOPE, 'groups', groupId, 'messages'] as const,
};

export function useChatGroups(options?: UseQueryOptions<ChatGroup[]>) {
  return useQuery({
    queryKey: chatQueryKeys.groups(),
    queryFn: fetchChatGroups,
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
    options?: Omit<
      UseInfiniteQueryOptions<
        ChatMessagesResponse,
        unknown,
        ChatMessagesResponse,
        ChatMessagesResponse,
        ReturnType<typeof chatQueryKeys.messages>
      >,
      'queryKey' | 'initialPageParam' | 'getNextPageParam' | 'queryFn'
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
      lastPage.hasMore ? lastPage.messages[0]?.id : undefined,
    ...options,
  } as UseInfiniteQueryOptions<
    ChatMessagesResponse,
    unknown,
    ChatMessagesResponse,
    ChatMessagesResponse,
    ReturnType<typeof chatQueryKeys.messages>
  >);
}

export function useSendChatMessage(
  options?: UseMutationOptions<ChatMessage, unknown, SendChatMessageInput>
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: sendChatMessage,
    ...options,
    onSuccess: (message, variables, context) => {
      queryClient.setQueryData<InfiniteData<ChatMessagesResponse>>(
        chatQueryKeys.messages(message.groupId),
        (existing) => {
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
        }
      );

      options?.onSuccess?.(message, variables, context);
    },
  });
}


