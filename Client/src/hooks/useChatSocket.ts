import { useContext, useEffect, useRef, useState } from "react";
import { io, Socket } from "socket.io-client";
import { useQueryClient, InfiniteData } from "@tanstack/react-query";
import apiClient from "@/api/apiClient";
import { AuthContext } from "@/contexts/AuthContext";
import {
  chatQueryKeys,
} from "@/features/chat/api/chatQueries";
import {
  ChatGroup,
  ChatMessage,
  ChatMessagesResponse,
} from "@/api/chat";

const CHAT_NAMESPACE = "/chat";

interface UseChatSocketOptions {
  enabled?: boolean;
}

interface ConnectionReadyPayload {
  groupIds: string[];
}

function getJwtToken(): string | null {
  if (typeof document === "undefined") {
    return null;
  }
  const match = document.cookie.match(/(?:^|;\s*)jwt=([^;]+)/);
  return match ? decodeURIComponent(match[1]) : null;
}

function sortGroupsByUpdatedAt(groups: ChatGroup[]): ChatGroup[] {
  return [...groups].sort((a, b) => {
    const aTime = new Date(a.updatedAt).getTime();
    const bTime = new Date(b.updatedAt).getTime();
    return bTime - aTime;
  });
}

export function useChatSocket({ enabled = true }: UseChatSocketOptions = {}) {
  const { user } = useContext(AuthContext);
  const queryClient = useQueryClient();
  const [isConnected, setIsConnected] = useState(false);
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    if (!enabled || !user?.organizationId || !user.id) {
      return;
    }

    const token = getJwtToken();
    if (!token) {
      return;
    }

    const baseURL =
      apiClient.defaults.baseURL?.replace(/\/$/, "") ??
      window.location.origin.replace(/\/$/, "");

    const socket = io(`${baseURL}${CHAT_NAMESPACE}`, {
      withCredentials: true,
      auth: { token },
      transports: ["websocket", "polling"],
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

      queryClient.setQueryData<ChatGroup>(
        chatQueryKeys.group(group.id),
        group
      );
    };

    socket.on("connect", handleConnect);
    socket.on("disconnect", handleDisconnect);
    socket.on("connection:ready", handleConnectionReady);
    socket.on("message:new", handleMessage);
    socket.on("group:updated", handleGroupUpdated);

    socket.on("connect_error", (error) => {
      console.error("Chat socket connection error:", error);
    });

    return () => {
      socket.off("connect", handleConnect);
      socket.off("disconnect", handleDisconnect);
      socket.off("connection:ready", handleConnectionReady);
      socket.off("message:new", handleMessage);
      socket.off("group:updated", handleGroupUpdated);
      socket.off("connect_error");
      socket.disconnect();
      socketRef.current = null;
      setIsConnected(false);
    };
  }, [
    enabled,
    queryClient,
    user?.organizationId,
    user?.id,
  ]);

  return {
    socket: socketRef.current,
    isConnected,
  };
}


