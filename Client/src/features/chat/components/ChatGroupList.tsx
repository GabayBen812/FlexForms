import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { formatDateTimeForDisplay } from "@/lib/dateUtils";
import { ChatGroup } from "@/api/chat";

interface ChatGroupListProps {
  groups: ChatGroup[];
  activeGroupId?: string | null;
  onSelectGroup: (groupId: string) => void;
  onCreateGroupClick: () => void;
  isLoading?: boolean;
  emptyLabel: string;
  title: string;
  createLabel: string;
  formatMemberCount: (count: number) => string;
}

export function ChatGroupList({
  groups,
  activeGroupId,
  onSelectGroup,
  onCreateGroupClick,
  isLoading,
  emptyLabel,
  title,
  createLabel,
  formatMemberCount,
}: ChatGroupListProps) {
  return (
    <div className="flex h-full flex-col border-r border-border bg-muted/20">
      <div className="flex items-center justify-between border-b border-border px-4 py-3">
        <h2 className="text-base font-semibold text-foreground">{title}</h2>
        <Button size="sm" onClick={onCreateGroupClick} className="font-medium">
          {createLabel}
        </Button>
      </div>

      <div className="flex-1 overflow-y-auto">
        {isLoading ? (
          <div className="space-y-2 p-4">
            {Array.from({ length: 5 }).map((_, index) => (
              <div
                key={`group-skeleton-${index}`}
                className="h-14 animate-pulse rounded-md bg-muted"
              />
            ))}
          </div>
        ) : groups.length === 0 ? (
          <div className="flex h-full items-center justify-center px-4 text-center text-sm text-muted-foreground">
            {emptyLabel}
          </div>
        ) : (
          <ul className="space-y-1 p-2">
            {groups.map((group) => {
              const isActive = group.id === activeGroupId;
              const formattedDate = formatDateTimeForDisplay(group.updatedAt);
              return (
                <li key={group.id}>
                  <button
                    type="button"
                    onClick={() => onSelectGroup(group.id)}
                    className={cn(
                      "w-full rounded-lg border border-transparent px-3 py-2 text-right transition-colors",
                      "hover:border-primary/30 hover:bg-primary/5 focus:outline-none focus-visible:border-primary focus-visible:bg-primary/10",
                      isActive && "border-primary/40 bg-primary/10 text-primary"
                    )}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-medium line-clamp-1">
                        {group.name}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {formattedDate}
                      </span>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {formatMemberCount(group.memberIds.length)}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}


