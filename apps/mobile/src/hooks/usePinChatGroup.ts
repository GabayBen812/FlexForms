import { useMutation, useQueryClient } from '@tanstack/react-query';
import { togglePinChatGroup, type ChatGroup } from '../api/chat';

export function usePinChatGroup() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ groupId, isPinned }: { groupId: string; isPinned: boolean }) =>
      togglePinChatGroup(groupId, isPinned),
    onMutate: async ({ groupId, isPinned }) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['chat', 'groups'] });

      // Snapshot previous value
      const previousGroups = queryClient.getQueryData<ChatGroup[]>(['chat', 'groups']);

      // Optimistically update
      queryClient.setQueryData<ChatGroup[]>(['chat', 'groups'], (old) => {
        if (!old) return old;

        return old.map((group) =>
          group.id === groupId
            ? {
                ...group,
                isPinned,
                pinnedAt: isPinned ? new Date().toISOString() : null,
              }
            : group
        );
      });

      return { previousGroups };
    },
    onError: (_error, _variables, context) => {
      // Rollback on error
      if (context?.previousGroups) {
        queryClient.setQueryData(['chat', 'groups'], context.previousGroups);
      }
    },
    onSettled: () => {
      // Refetch after mutation
      queryClient.invalidateQueries({ queryKey: ['chat', 'groups'] });
    },
  });
}



