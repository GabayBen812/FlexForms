import { useCallback, useState } from "react";
import { Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

interface ChatComposerProps {
  onSend: (message: string) => Promise<void> | void;
  isSending?: boolean;
  disabled?: boolean;
  placeholder: string;
  sendLabel: string;
}

export function ChatComposer({
  onSend,
  isSending,
  disabled,
  placeholder,
  sendLabel,
}: ChatComposerProps) {
  const [value, setValue] = useState("");

  const sendMessage = useCallback(async () => {
    const trimmed = value.trim();
    if (!trimmed || disabled || isSending) {
      return;
    }
    await onSend(trimmed);
    setValue("");
  }, [value, onSend, disabled, isSending]);

  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (event.key === "Enter" && !event.shiftKey) {
        event.preventDefault();
        void sendMessage();
      }
    },
    [sendMessage]
  );

  return (
    <div className="border-t border-border bg-background px-4 py-3">
      <div className="mx-auto flex w-full max-w-3xl items-end gap-3">
        <Textarea
          value={value}
          onChange={(event) => setValue(event.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={disabled || isSending}
          rows={1}
          className={cn(
            "flex-1 resize-none rounded-2xl border border-border bg-muted/30 p-3 text-sm shadow-sm transition-colors focus-visible:border-primary focus-visible:ring-0",
            "max-h-40"
          )}
        />
        <Button
          onClick={() => void sendMessage()}
          disabled={disabled || isSending || value.trim().length === 0}
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


