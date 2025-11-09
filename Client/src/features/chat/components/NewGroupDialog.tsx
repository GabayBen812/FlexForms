import { useEffect, useState } from "react";
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { MultiSelect } from "@/components/ui/multi-select";

interface MemberOption {
  value: string;
  label: string;
}

interface NewGroupDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (payload: { name: string; memberIds: string[] }) => Promise<void> | void;
  isSubmitting?: boolean;
  membersOptions: MemberOption[];
  title: string;
  description: string;
  nameLabel: string;
  namePlaceholder: string;
  nameErrorMessage: string;
  membersLabel: string;
  membersPlaceholder: string;
  cancelLabel: string;
  submitLabel: string;
  initialName?: string;
  initialMemberIds?: string[];
}

export function NewGroupDialog({
  open,
  onOpenChange,
  onSubmit,
  isSubmitting,
  membersOptions,
  title,
  description,
  nameLabel,
  namePlaceholder,
  membersLabel,
  membersPlaceholder,
  cancelLabel,
  submitLabel,
  nameErrorMessage,
  initialName,
  initialMemberIds,
}: NewGroupDialogProps) {
  const [name, setName] = useState("");
  const [memberIds, setMemberIds] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setName(initialName ?? "");
      setMemberIds(initialMemberIds ?? []);
      setError(null);
    } else {
      setName("");
      setMemberIds([]);
      setError(null);
    }
  }, [open, initialName, initialMemberIds]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmedName = name.trim();
    if (!trimmedName) {
      setError(nameErrorMessage);
      return;
    }
    setError(null);
    await onSubmit({ name: trimmedName, memberIds });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold">
              {title}
            </DialogTitle>
            <p className="text-sm text-muted-foreground">{description}</p>
          </DialogHeader>
          <DialogBody className="space-y-4 pt-4">
            <div className="space-y-2 text-right">
              <Label htmlFor="chat-group-name">{nameLabel}</Label>
              <Input
                id="chat-group-name"
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder={namePlaceholder}
                autoFocus
              />
              {error && (
                <p className="text-sm text-destructive">{error}</p>
              )}
            </div>
            <div className="space-y-2 text-right">
              <Label>{membersLabel}</Label>
              <MultiSelect
                options={membersOptions}
                selected={memberIds}
                onSelect={setMemberIds}
                placeholder={membersPlaceholder}
                className="justify-start"
              />
            </div>
          </DialogBody>
          <DialogFooter className="flex flex-row-reverse gap-2">
            <Button type="submit" disabled={isSubmitting}>
              {submitLabel}
            </Button>
            <Button
              type="button"
              variant="ghost"
              onClick={() => onOpenChange(false)}
            >
              {cancelLabel}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}


