import { useContext, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Loader2, Plus, Settings2, Trash2 } from "lucide-react";
import { InfiniteData } from "@tanstack/react-query";

import { AuthContext } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";
import {
  useChatGroups,
  useSendChatMessage,
  useArchiveChatGroup,
  useCreateChatGroup,
  useChatMessages,
  useUpdateChatGroup,
} from "@/features/chat/api/chatQueries";
import { useChatSocket } from "@/hooks/useChatSocket";
import { useOrganizationUsers } from "@/features/chat/api/useOrganizationUsers";
import { ChatComposer } from "@/features/chat/components/ChatComposer";
import { ChatGroupList } from "@/features/chat/components/ChatGroupList";
import { ChatMessageList } from "@/features/chat/components/ChatMessageList";
import { NewGroupDialog } from "@/features/chat/components/NewGroupDialog";
import { ChatGroup, ChatMessagesResponse } from "@/api/chat";

export default function MessagesPage() {
  const { t } = useTranslation();
  const { user } = useContext(AuthContext);

  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);
  const [isGroupDialogOpen, setIsGroupDialogOpen] = useState(false);
  const [groupDialogMode, setGroupDialogMode] = useState<"create" | "edit">(
    "create"
  );
  const [groupToEdit, setGroupToEdit] = useState<ChatGroup | null>(null);

  const { data: groups = [], isLoading: isGroupsLoading } = useChatGroups();
  const {
    data: messagesData,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading: isMessagesLoading,
  } = useChatMessages(selectedGroupId ?? "", {
    limit: 50,
    options: {
      enabled: Boolean(selectedGroupId),
    },
  });
  const messages =
    (messagesData as unknown as InfiniteData<ChatMessagesResponse> | undefined)?.pages.flatMap((page) => page.messages) ?? [];

  const { isConnected } = useChatSocket({ enabled: true });
  const {
    data: organizationUsers = [],
    isLoading: isUsersLoading,
  } = useOrganizationUsers();

  const createGroupMutation = useCreateChatGroup({
    onSuccess: (group) => {
      toast.success(
        t("chat:create_group_success", { name: group.name })
      );
      setSelectedGroupId(group.id);
      setIsGroupDialogOpen(false);
    },
    onError: (error) => {
      toast.error(
        t("chat:create_group_error"),
        { description: (error as Error)?.message }
      );
    },
  });

  const updateGroupMutation = useUpdateChatGroup(
    groupToEdit?.id ?? "",
    {
      onSuccess: (group) => {
        toast.success(
          t("chat:update_group_success", { name: group.name })
        );
        setGroupToEdit(null);
        setIsGroupDialogOpen(false);
      },
      onError: (error) => {
        toast.error(
          t("chat:update_group_error"),
          { description: (error as Error)?.message }
        );
      },
    }
  );

  const archiveGroupMutation = useArchiveChatGroup({
    onSuccess: (group) => {
      toast.info(
        t("chat:archive_group_success", { name: group.name })
      );
      if (selectedGroupId === group.id) {
        setSelectedGroupId(null);
      }
    },
    onError: (error) => {
      toast.error(
        t("chat:archive_group_error"),
        { description: (error as Error)?.message }
      );
    },
  });

  const sendMessageMutation = useSendChatMessage({
    onError: (error) => {
      toast.error(
        t("chat:send_message_error"),
        { description: (error as Error)?.message }
      );
    },
  });

  useEffect(() => {
    if (!selectedGroupId && groups.length > 0) {
      setSelectedGroupId(groups[0].id);
    }
  }, [groups, selectedGroupId]);

  const selectedGroup = useMemo(
    () => groups.find((group) => group.id === selectedGroupId) ?? null,
    [groups, selectedGroupId]
  );

  const memberOptions = useMemo(
    () =>
      organizationUsers
        .map((item) => ({
          value: item._id ?? (typeof item.id === "number" ? String(item.id) : item.id ?? ""),
          label: item.name,
        }))
        .filter((option) => option.value !== ""),
    [organizationUsers]
  );

  const memberLookup = useMemo(() => {
    const map: Record<string, string> = {
      __unknown: t("chat:unknown_user"),
    };

    organizationUsers.forEach((item) => {
      const key =
        item._id ?? (typeof item.id === "number" ? String(item.id) : item.id);
      if (key) {
        map[key] = item.name;
      }
    });

    if (user) {
      const key =
        (user as any)._id ??
        (typeof user.id === "number" ? String(user.id) : user.id);
      if (key) {
        map[key] = user.name;
      }
    }

    return map;
  }, [organizationUsers, user, t]);

  const handleSendMessage = async (content: string) => {
    if (!selectedGroupId) return;
    await sendMessageMutation.mutateAsync({ groupId: selectedGroupId, content });
  };

  const handleCreateGroupClick = () => {
    setGroupDialogMode("create");
    setGroupToEdit(null);
    setIsGroupDialogOpen(true);
  };

  const handleEditGroupClick = () => {
    if (!selectedGroup) return;
    setGroupDialogMode("edit");
    setGroupToEdit(selectedGroup);
    setIsGroupDialogOpen(true);
  };

  const handleArchiveGroup = () => {
    if (!selectedGroupId) return;
    archiveGroupMutation.mutate(selectedGroupId);
  };

  const handleGroupDialogSubmit = async (payload: {
    name: string;
    memberIds: string[];
  }) => {
    if (groupDialogMode === "create") {
      await createGroupMutation.mutateAsync(payload);
      return;
    }
    if (groupDialogMode === "edit" && groupToEdit) {
      await updateGroupMutation.mutateAsync(payload);
    }
  };

  const formatMemberCount = (count: number) =>
    t("chat:member_count", { count });

  return (
    <div className="flex h-full flex-col gap-4 p-4 lg:p-6">
      <header className="space-y-2">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-foreground">
              {t("chat:title")}
            </h1>
          </div>
          <Badge
            variant={isConnected ? "default" : "secondary"}
            className="h-7 text-xs font-medium"
          >
            {isConnected
              ? t("chat:status_online")
              : t("chat:status_offline")}
          </Badge>
        </div>
      </header>

      <div className="flex min-h-[60vh] flex-1 flex-col overflow-hidden rounded-3xl border border-border bg-background shadow-sm lg:flex-row">
        <div className="flex w-full flex-col border-b border-border bg-background lg:max-w-sm lg:flex-shrink-0 lg:border-b-0 lg:border-r rtl:lg:border-l">
          <ChatGroupList
            groups={groups.filter((group) => !group.isArchived)}
            activeGroupId={selectedGroupId}
            onSelectGroup={setSelectedGroupId}
            onCreateGroupClick={handleCreateGroupClick}
            isLoading={isGroupsLoading}
            emptyLabel={t("chat:empty_groups")}
            title={t("chat:groups_title")}
            createLabel={t("chat:create_group_button")}
            formatMemberCount={formatMemberCount}
          />
        </div>

        <div className="flex min-w-0 flex-1 flex-col">
          {selectedGroup ? (
            <>
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-6 py-4">
                <div>
                  <h2 className="text-lg font-semibold text-foreground">
                    {selectedGroup.name}
                  </h2>
                  <p className="text-sm text-muted-foreground">
                    {t("chat:group_members", {
                      count: selectedGroup.memberIds.length,
                    })}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleEditGroupClick}
                    disabled={isUsersLoading || updateGroupMutation.isPending}
                    className="flex items-center gap-2"
                  >
                    <Settings2 className="h-4 w-4" />
                    {t("chat:edit_group_button")}
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={handleArchiveGroup}
                    disabled={archiveGroupMutation.isPending}
                    className="flex items-center gap-2 text-destructive hover:bg-destructive/10"
                  >
                    {archiveGroupMutation.isPending ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Trash2 className="h-4 w-4" />
                    )}
                    {t("chat:archive_group_button")}
                  </Button>
                </div>
              </div>

              <ChatMessageList
                messages={messages}
                currentUserId={
                  (user as any)?._id ??
                  (typeof user?.id === "number"
                    ? String(user.id)
                    : user?.id)
                }
                memberLookup={memberLookup}
                onLoadMore={() => {
                  if (hasNextPage && !isFetchingNextPage) {
                    void fetchNextPage();
                  }
                }}
                hasMore={Boolean(hasNextPage)}
                isLoadingInitial={isMessagesLoading}
                isLoadingMore={isFetchingNextPage}
                emptyLabel={t("chat:empty_messages")}
                loadMoreLabel={t("chat:load_previous_messages")}
              />

              <ChatComposer
                onSend={handleSendMessage}
                isSending={sendMessageMutation.isPending}
                disabled={!selectedGroupId}
                placeholder={t("chat:composer_placeholder")}
                sendLabel={
                  sendMessageMutation.isPending
                    ? t("chat:sending_label")
                    : t("chat:send_label")
                }
              />
            </>
          ) : (
            <div className="flex flex-1 flex-col items-center justify-center gap-4 px-6 text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-primary">
                <Plus className="h-8 w-8" />
              </div>
              <div className="space-y-2">
                <h2 className="text-xl font-semibold text-foreground">
                  {t("chat:empty_state_title")}
                </h2>
                <p className="mx-auto max-w-md text-sm text-muted-foreground">
                  {t("chat:empty_state_subtitle")}
                </p>
              </div>
              <Button size="sm" onClick={handleCreateGroupClick}>
                {t("chat:create_group_button")}
              </Button>
            </div>
          )}
        </div>
      </div>

      <NewGroupDialog
        open={isGroupDialogOpen}
        onOpenChange={(open) => {
          setIsGroupDialogOpen(open);
          if (!open) {
            setGroupToEdit(null);
          }
        }}
        onSubmit={handleGroupDialogSubmit}
        isSubmitting={
          groupDialogMode === "create"
            ? createGroupMutation.isPending
            : updateGroupMutation.isPending
        }
        membersOptions={memberOptions}
        title={
          groupDialogMode === "create"
            ? t("chat:new_group_title")
            : t("chat:edit_group_title")
        }
        description={t("chat:group_dialog_description")}
        nameLabel={t("chat:group_name_label")}
        namePlaceholder={t("chat:group_name_placeholder")}
        nameErrorMessage={t("chat:group_name_error")}
        membersLabel={t("chat:members_label")}
        membersPlaceholder={t("chat:members_placeholder")}
        cancelLabel={t("common:cancel")}
        submitLabel={
          groupDialogMode === "create"
            ? t("chat:group_dialog_create_button")
            : t("chat:group_dialog_save_button")
        }
        initialName={groupDialogMode === "edit" ? groupToEdit?.name : ""}
        initialMemberIds={groupDialogMode === "edit" ? groupToEdit?.memberIds : []}
      />
    </div>
  );
}
