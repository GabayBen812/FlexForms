import { useCallback, useEffect, useMemo, useState } from "react";
import { Send, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandList,
} from "@/components/ui/command";

interface ChatComposerProps {
  onSend: (message: string) => Promise<void> | void;
  isSending?: boolean;
  disabled?: boolean;
  placeholder: string;
  sendLabel: string;
  enableMentions?: boolean;
  mentionUsers?: { id: string; label: string }[];
}

export function ChatComposer({
  onSend,
  isSending,
  disabled,
  placeholder,
  sendLabel,
  enableMentions,
  mentionUsers,
}: ChatComposerProps) {
  const [value, setValue] = useState("");
  const [isMentionOpen, setIsMentionOpen] = useState(false);
  const [mentionQuery, setMentionQuery] = useState("");
  const [highlightedIndex, setHighlightedIndex] = useState(0);
  const [selectedMention, setSelectedMention] = useState<
    { id: string; label: string } | null
  >(null);

  const mentionOptions =
    mentionUsers?.filter((user) => user.label && user.id) ?? [];

  const filteredMentions = useMemo(() => {
    if (!mentionOptions.length) return [];
    if (!mentionQuery) return mentionOptions;

    const query = mentionQuery.toLowerCase();
    return mentionOptions.filter((option) =>
      option.label.toLowerCase().includes(query)
    );
  }, [mentionOptions, mentionQuery]);

  useEffect(() => {
    if (!enableMentions || !mentionOptions.length || selectedMention) {
      setIsMentionOpen(false);
      setMentionQuery("");
      return;
    }

    const trimmed = value;

    if (trimmed.startsWith("@")) {
      const firstToken = trimmed.slice(1).split(/\s/)[0] ?? "";
      setMentionQuery(firstToken);
      setIsMentionOpen(true);
      setHighlightedIndex(0);
      return;
    }

    setIsMentionOpen(false);
    setMentionQuery("");
  }, [value, enableMentions, mentionOptions.length]);

  const insertMention = useCallback(
    (user: { id: string; label: string }) => {
      if (!user) return;
      // For now we support a single mention at the start of the message.
      const remaining = value.slice(mentionQuery.length + 1); // +1 for '@'
      setSelectedMention(user);
      setValue(remaining.trimStart());
      setIsMentionOpen(false);
      setMentionQuery("");
    },
    [mentionQuery.length, value]
  );

  const sendMessage = useCallback(async () => {
    const composed =
      selectedMention && selectedMention.label
        ? `@${selectedMention.label} ${value}`
        : value;
    const trimmed = composed.trim();
    if (!trimmed || disabled || isSending) {
      return;
    }
    await onSend(trimmed);
    setValue("");
    setSelectedMention(null);
  }, [value, selectedMention, onSend, disabled, isSending]);

  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (isMentionOpen && filteredMentions.length > 0) {
        if (event.key === "ArrowDown") {
          event.preventDefault();
          setHighlightedIndex((prev) =>
            prev + 1 < filteredMentions.length ? prev + 1 : 0
          );
          return;
        }

        if (event.key === "ArrowUp") {
          event.preventDefault();
          setHighlightedIndex((prev) =>
            prev - 1 >= 0 ? prev - 1 : filteredMentions.length - 1
          );
          return;
        }

        if (event.key === "Enter" && !event.shiftKey) {
          event.preventDefault();
          const selected = filteredMentions[highlightedIndex];
          if (selected) {
            insertMention(selected);
          }
          return;
        }

        if (event.key === "Escape") {
          event.preventDefault();
          setIsMentionOpen(false);
          return;
        }
      }

      if (event.key === "Enter" && !event.shiftKey) {
        event.preventDefault();
        void sendMessage();
      }
    },
    [sendMessage, isMentionOpen, filteredMentions, highlightedIndex, insertMention]
  );

  return (
    <div className="border-t border-border bg-background px-4 py-3">
      <div className="mx-auto flex w-full max-w-3xl items-end gap-3">
        <div className="relative flex-1">
          <div className="flex min-h-[44px] flex-wrap items-center gap-2 rounded-2xl border border-border bg-muted/30 px-3 py-2 shadow-sm transition-colors focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20">
            {selectedMention && (
              <Badge
                variant="default"
                className="group inline-flex items-center gap-1.5 rounded-full bg-primary/15 px-2.5 py-1 text-xs font-medium text-primary hover:bg-primary/25 transition-colors cursor-pointer"
                onClick={() => {
                  // If user removes the chip, return the mention text back to the input
                  setValue((prev) =>
                    prev ? `@${selectedMention.label} ${prev}` : `@${selectedMention.label} `
                  );
                  setSelectedMention(null);
                }}
              >
                <span className="font-semibold">@{selectedMention.label}</span>
                <X className="h-3 w-3 opacity-70 group-hover:opacity-100 transition-opacity" />
              </Badge>
            )}

            <Textarea
              value={value}
              onChange={(event) => setValue(event.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={placeholder}
              disabled={disabled || isSending}
              rows={1}
              className={cn(
                "flex-1 resize-none border-0 bg-transparent p-0 text-sm shadow-none focus-visible:ring-0",
                "max-h-40"
              )}
            />
          </div>

          {enableMentions && isMentionOpen && filteredMentions.length > 0 && (
            <div className="absolute bottom-full left-0 mb-2 w-full rounded-xl border border-border bg-popover text-popover-foreground shadow-lg z-50">
              <Command>
                <CommandList className="max-h-[200px]">
                  <CommandEmpty />
                  <CommandGroup>
                    {filteredMentions.map((user, index) => (
                      <CommandItem
                        key={user.id}
                        value={user.label}
                        onMouseDown={(event) => {
                          event.preventDefault();
                          insertMention(user);
                        }}
                        className={cn(
                          "cursor-pointer text-sm py-2.5 px-3 rounded-lg transition-colors",
                          index === highlightedIndex && "bg-primary/10 text-primary"
                        )}
                      >
                        <span className="font-medium">@{user.label}</span>
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </CommandList>
              </Command>
            </div>
          )}
        </div>
        <Button
          onClick={() => void sendMessage()}
          disabled={
            disabled ||
            isSending ||
            (selectedMention
              ? `@${selectedMention.label} ${value}`.trim().length === 0
              : value.trim().length === 0)
          }
          className="rounded-full px-4"
        >
          {isSending ? (
            <span className="text-sm font-medium">{sendLabel}</span>
          ) : (
            <div className="flex items-center gap-2 text-sm font-medium">
              <Send className="h-4 w-4 rtl:rotate-180" />
              {sendLabel}
            </div>
          )}
        </Button>
      </div>
    </div>
  );
}


