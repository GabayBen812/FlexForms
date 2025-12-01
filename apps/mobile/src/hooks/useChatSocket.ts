import { useEffect, useRef, useState } from 'react';
import { io, type Socket } from 'socket.io-client';
import {
  useQueryClient,
  type InfiniteData,
} from '@tanstack/react-query';

import { api } from '../api/client';
import { useAuth } from '../providers/AuthProvider';
import {
  chatQueryKeys,
} from '../features/chat/chatQueries';
import type {
  ChatGroup,
  ChatMessage,
  ChatMessagesResponse,
} from '../api/chat';
import { getAuthCookie } from '../utils/authCookie';

const CHAT_NAMESPACE = '/chat';

type UseChatSocketOptions = {
  enabled?: boolean;
};

type ConnectionReadyPayload = {
  groupIds: string[];
};

function sortGroupsByUpdatedAt(groups: ChatGroup[]): ChatGroup[] {
  return [...groups].sort((a, b) => {
    const aTime = new Date(a.updatedAt).getTime();
    const bTime = new Date(b.updatedAt).getTime();
    return bTime - aTime;
  });
}

async function getJwtTokenFromCookie(): Promise<string | null> {
  const cookie = await getAuthCookie();
  if (!cookie) return null;

  const match = cookie.match(/(?:^|;\s*)jwt=([^;]+)/);
  return match ? decodeURIComponent(match[1]) : null;
}

export function useChatSocket({ enabled = true }: UseChatSocketOptions = {}) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [isConnected, setIsConnected] = useState(false);
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    let isMounted = true;

    if (!enabled || !user?.organizationId || !user.id) {
      return;
    }

    const setupSocket = async () => {
      const token = await getJwtTokenFromCookie();
      if (!token || !isMounted) {
        return;
      }

      const baseURL =
        api.defaults.baseURL?.replace(/\/$/, '') ?? 'http://localhost:3101';

      const socket = io(`${baseURL}${CHAT_NAMESPACE}`, {
        withCredentials: true,
        auth: { token },
        transports: ['websocket', 'polling'],
      });

      socketRef.current = socket;

      const handleConnect = () => {
        setIsConnected(true);
      };

      const handleDisconnect = () => {
        setIsConnected(false);
      };

      const handleConnectionReady = (_payload: ConnectionReadyPayload) => {
        // placeholder for future use (joining rooms handled server-side)
      };

      const handleMessage = (message: ChatMessage) => {
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

        queryClient.setQueryData<ChatGroup[]>(
          chatQueryKeys.groups(),
          (groups) => {
            if (!groups) {
              return groups;
            }

            const index = groups.findIndex(
              (group) => group.id === message.groupId
            );

            if (index === -1) {
              return groups;
            }

            const updatedGroup: ChatGroup = {
              ...groups[index],
              updatedAt: message.createdAt,
            };

            const nextGroups = [...groups];
            nextGroups.splice(index, 1);
            nextGroups.unshift(updatedGroup);

            return sortGroupsByUpdatedAt(nextGroups);
          }
        );

        queryClient.setQueryData<ChatGroup>(
          chatQueryKeys.group(message.groupId),
          (group) =>
            group
              ? {
                  ...group,
                  updatedAt: message.createdAt,
                }
              : group
        );
      };

      const handleGroupUpdated = (group: ChatGroup) => {
        queryClient.setQueryData<ChatGroup[]>(
          chatQueryKeys.groups(),
          (groups) => {
            if (!groups) {
              return group.isArchived ? groups : [group];
            }

            const filtered = groups.filter((item) => item.id !== group.id);

            if (group.isArchived) {
              return sortGroupsByUpdatedAt(filtered);
            }

            return sortGroupsByUpdatedAt([group, ...filtered]);
          }
        );

        if (group.isArchived) {
          queryClient.removeQueries({
            queryKey: chatQueryKeys.messages(group.id),
          });
        }

        queryClient.setQueryData<ChatGroup>(chatQueryKeys.group(group.id), group);
      };

      socket.on('connect', handleConnect);
      socket.on('disconnect', handleDisconnect);
      socket.on('connection:ready', handleConnectionReady);
      socket.on('message:new', handleMessage);
      socket.on('group:updated', handleGroupUpdated);

      socket.on('connect_error', (error) => {
        // eslint-disable-next-line no-console
        console.error('Chat socket connection error:', error);
      });
    };

    void setupSocket();

    return () => {
      isMounted = false;
      const socket = socketRef.current;
      if (socket) {
        socket.off('connect');
        socket.off('disconnect');
        socket.off('connection:ready');
        socket.off('message:new');
        socket.off('group:updated');
        socket.off('connect_error');
        socket.disconnect();
        socketRef.current = null;
      }
      setIsConnected(false);
    };
  }, [enabled, queryClient, user?.organizationId, user?.id]);

  return {
    socket: socketRef.current,
    isConnected,
  };
}


