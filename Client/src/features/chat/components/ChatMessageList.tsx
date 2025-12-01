import { useEffect, useRef, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { formatDateTimeForDisplay } from "@/lib/dateUtils";
import { ChatMessage } from "@/api/chat";

interface ChatMessageListProps {
  messages: ChatMessage[];
  currentUserId?: string;
  memberLookup: Record<string, string>;
  onLoadMore: () => void;
  hasMore: boolean;
  isLoadingInitial?: boolean;
  isLoadingMore?: boolean;
  emptyLabel: string;
  loadMoreLabel: string;
}

// Parse message content and extract mentions (format: @Name)
function parseMessageContent(content: string): Array<{ type: "mention" | "text"; value: string }> {
  const parts: Array<{ type: "mention" | "text"; value: string }> = [];
  // Match @ followed by word characters (letters, numbers, underscores, Hebrew chars)
  // Stop at whitespace or end of string
  const mentionRegex = /@([\w\u0590-\u05FF]+)/g;
  let lastIndex = 0;
  let match;

  while ((match = mentionRegex.exec(content)) !== null) {
    // Add text before mention
    if (match.index > lastIndex) {
      const textBefore = content.slice(lastIndex, match.index);
      if (textBefore) {
        parts.push({
          type: "text",
          value: textBefore,
        });
      }
    }
    // Add mention
    parts.push({
      type: "mention",
      value: match[1], // The name without @
    });
    lastIndex = mentionRegex.lastIndex;
  }

  // Add remaining text
  if (lastIndex < content.length) {
    const remainingText = content.slice(lastIndex);
    if (remainingText) {
      parts.push({
        type: "text",
        value: remainingText,
      });
    }
  }

  // If no mentions found, return the whole content as text
  if (parts.length === 0) {
    parts.push({ type: "text", value: content });
  }

  return parts;
}

export function ChatMessageList({
  messages,
  currentUserId,
  memberLookup,
  onLoadMore,
  hasMore,
  isLoadingInitial,
  isLoadingMore,
  emptyLabel,
  loadMoreLabel,
}: ChatMessageListProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const scrollAnchorRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const anchor = scrollAnchorRef.current;
    if (anchor) {
      anchor.scrollIntoView({ behavior: "smooth", block: "end" });
    }
  }, [messages.length]);

  return (
    <div
      ref={containerRef}
      className="flex-1 overflow-y-auto bg-background px-4 py-6"
    >
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-4">
        {hasMore && (
          <div className="flex justify-center">
            <Button
              variant="ghost"
              size="sm"
              onClick={onLoadMore}
              disabled={isLoadingMore}
            >
              {isLoadingMore ? `${loadMoreLabel}...` : loadMoreLabel}
            </Button>
          </div>
        )}

        {isLoadingInitial ? (
          <div className="space-y-3">
            {Array.from({ length: 6 }).map((_, index) => (
              <div
                key={`message-skeleton-${index}`}
                className={cn(
                  "h-16 w-full max-w-[65%] animate-pulse rounded-2xl bg-muted",
                  index % 2 === 0 ? "self-start" : "self-end"
                )}
              />
            ))}
          </div>
        ) : messages.length === 0 ? (
          <div className="mt-16 text-center text-sm text-muted-foreground">
            {emptyLabel}
          </div>
        ) : (
          messages.map((message) => {
            const isOwn = currentUserId === message.senderId;
            const senderName =
              memberLookup[message.senderId] ?? memberLookup["__unknown"];

            return (
              <div
                key={message.id}
                className={cn(
                  "flex w-full flex-col gap-2",
                  isOwn ? "items-end" : "items-start"
                )}
              >
                <div
                  className={cn(
                    "max-w-[75%] rounded-2xl px-4 py-3 shadow-sm transition-colors",
                    isOwn
                      ? "rounded-br-md bg-primary/10 border border-primary/30 text-primary"
                      : "rounded-bl-md bg-muted border border-border text-foreground"
                  )}
                >
                  <div className="mb-1 text-xs font-medium opacity-80">
                    {senderName}
                  </div>
                  <div className="text-base leading-relaxed text-foreground">
                    <div className="flex flex-wrap items-center gap-1.5">
                      {parseMessageContent(message.content).map((part, idx) => {
                        if (part.type === "mention") {
                          return (
                            <Badge
                              key={idx}
                              variant="default"
                              className="inline-flex items-center rounded-full bg-primary/15 px-2.5 py-0.5 text-xs font-semibold text-primary border-0 hover:bg-primary/20 transition-colors"
                            >
                              @{part.value}
                            </Badge>
                          );
                        }
                        // Split text by newlines to preserve line breaks
                        const lines = part.value.split("\n");
                        return (
                          <span key={idx} className="whitespace-pre-wrap break-words">
                            {lines.map((line, lineIdx) => (
                              <span key={lineIdx}>
                                {line}
                                {lineIdx < lines.length - 1 && <br />}
                              </span>
                            ))}
                          </span>
                        );
                      })}
                    </div>
                  </div>
                  <div className="mt-2 text-right text-[11px] text-foreground/70">
                    {formatDateTimeForDisplay(message.createdAt)}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
      <div ref={scrollAnchorRef} />
    </div>
  );
}


