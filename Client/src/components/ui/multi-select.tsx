import * as React from "react";
import { Check, ChevronDown, X, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/Input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

interface MultiSelectProps {
  options: { value: string; label: string }[];
  selected: string[];
  onSelect: (values: string[]) => void;
  placeholder?: string;
  className?: string;
}

const chipClassName =
  "bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800";

export function MultiSelect({
  options,
  selected,
  onSelect,
  placeholder = "בחר אפשרויות...",
  className,
}: MultiSelectProps) {
  const [open, setOpen] = React.useState(false);
  const [search, setSearch] = React.useState("");

  const handleSelect = React.useCallback((value: string) => {
    const newSelected = selected.includes(value)
      ? selected.filter((item) => item !== value)
      : [...selected, value];
    onSelect(newSelected);
    // Don't close the popover - keep it open for multi-select
  }, [selected, onSelect]);

  const handleRemove = (value: string, e: React.MouseEvent) => {
    e.stopPropagation();
    onSelect(selected.filter((item) => item !== value));
  };

  const getSelectedLabels = () => {
    return selected
      .map((value) => options.find((opt) => opt.value === value)?.label)
      .filter(Boolean);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn(
            "w-full justify-between min-h-10 h-auto py-2 border-border bg-background text-foreground shadow-sm transition-all hover:bg-primary/10 hover:text-foreground focus-visible:ring-primary/30",
            className
          )}
        >
          <div className="flex flex-wrap gap-1 flex-1 justify-start">
            {selected.length === 0 ? (
              <span className="text-muted-foreground">{placeholder}</span>
            ) : (
              getSelectedLabels().map((label, index) => (
                <div
                  key={selected[index]}
                  className={cn(
                    "flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium border",
                    chipClassName
                  )}
                >
                  <span>{label}</span>
                  <button
                    type="button"
                    onClick={(e) => handleRemove(selected[index], e)}
                    className="ml-1 hover:opacity-80 rounded-full hover:bg-white/20 p-0.5"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))
            )}
          </div>
          <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent 
        className="w-full p-0" 
        align="start"
        onInteractOutside={(e) => {
          // Prevent closing when clicking inside dialog (but allow clicks inside popover)
          // This allows multi-select to work properly inside a dialog
          const target = e.target as HTMLElement;
          // Only prevent if clicking on dialog content, not on popover itself
          const dialogElement = target.closest('[role="dialog"]');
          const popoverElement = target.closest('[data-radix-popover-content]');
          // If click is inside dialog but not inside popover, prevent closing
          if (dialogElement && !popoverElement) {
            e.preventDefault();
          }
        }}
      >
        <div className="p-2 border-b">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="חפש..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 pr-3"
            />
          </div>
        </div>
        <div className="max-h-[300px] overflow-y-auto p-1">
          {options.filter((option) =>
            option.label.toLowerCase().includes(search.toLowerCase()) ||
            option.value.toLowerCase().includes(search.toLowerCase())
          ).length === 0 ? (
            <div className="p-4 text-center text-sm text-muted-foreground">
              לא נמצאו תוצאות.
            </div>
          ) : (
            options
              .filter((option) =>
                option.label.toLowerCase().includes(search.toLowerCase()) ||
                option.value.toLowerCase().includes(search.toLowerCase())
              )
              .map((option) => {
                const isSelected = selected.includes(option.value);
                return (
                  <button
                    key={option.value}
                    type="button"
                    role="option"
                    aria-selected={isSelected}
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      handleSelect(option.value);
                    }}
                    onPointerDown={(e) => {
                      // Also handle pointer events for better compatibility
                      e.stopPropagation();
                    }}
                    className={cn(
                      "w-full flex items-center gap-2 px-2 py-1.5 rounded-md cursor-pointer transition-colors hover:bg-primary/15 active:bg-primary/25 text-left select-none",
                      isSelected && "bg-primary/10"
                    )}
                  >
                    <Check
                      className={cn(
                        "h-4 w-4 shrink-0",
                        isSelected ? "opacity-100" : "opacity-0"
                      )}
                    />
                    <span className="flex-1">{option.label}</span>
                  </button>
                );
              })
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}

