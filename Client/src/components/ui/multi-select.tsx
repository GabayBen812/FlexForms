import * as React from "react";
import { Check, ChevronDown, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
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

  const handleSelect = (value: string) => {
    const newSelected = selected.includes(value)
      ? selected.filter((item) => item !== value)
      : [...selected, value];
    onSelect(newSelected);
  };

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
            "w-full justify-between min-h-10 h-auto py-2 border-border bg-background text-foreground shadow-sm transition-all hover:bg-primary/5 hover:text-foreground focus-visible:ring-primary/30",
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
      <PopoverContent className="w-full p-0" align="start">
        <Command>
          <CommandInput placeholder="חפש..." />
          <CommandList>
            <CommandEmpty>לא נמצאו תוצאות.</CommandEmpty>
            <CommandGroup>
              {options.map((option) => {
                const isSelected = selected.includes(option.value);
                return (
                  <CommandItem
                    key={option.value}
                    onSelect={() => handleSelect(option.value)}
                    className="cursor-pointer rounded-md text-foreground transition-colors data-[highlighted=true]:bg-primary/10 data-[highlighted=true]:text-primary data-[selected=true]:bg-primary/10 data-[selected=true]:text-primary"
                  >
                    <Check
                      className={cn(
                        "ml-2 h-4 w-4",
                        isSelected ? "opacity-100" : "opacity-0"
                      )}
                    />
                    {option.label}
                  </CommandItem>
                );
              })}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

