import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import { useTranslation } from "react-i18next";
import { router } from "@/utils/routes/router";

export function CommandDialogDemo() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [isFocused, setIsFocused] = useState(false);
  const [query, setQuery] = useState("");

  // Extract commands from router
  const commandData = [
    {
      heading: "pages",
      items:
        router.routes
          .find((route) => route.path === "/")
          ?.children?.filter((route) => route.handle?.showInSidebar)
          .map((route) => ({
            label: route.handle.title,
            icon: route.handle.icon,
            path: route.path,
          })) || [],
    },
  ];

  const filteredCommands = commandData.map((group) => ({
    ...group,
    items: group.items.filter(
      (item) => t(item.label).toLowerCase().includes(query.toLowerCase()) // Search using the translated label
    ),
  }));

  const handleSelect = (path: string) => {
    navigate(path);
    setIsFocused(false);
    //@ts-ignore
    document.activeElement?.blur();
  };

  return (
    <Command className="rounded-lg border shadow-sm md:min-w-[450px]">
      <CommandInput
        className="shadow-none"
        placeholder={t("search")}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setTimeout(() => setIsFocused(false), 200)}
        onValueChange={setQuery}
      />
      {isFocused && (
        <CommandList>
          {filteredCommands.every((group) => group.items.length === 0) ? (
            <CommandEmpty>{t("No results found.")}</CommandEmpty>
          ) : (
            filteredCommands.map((group, index) => (
              <div key={group.heading}>
                <CommandGroup heading={t(group.heading)}>
                  {group.items.map((item) => (
                    <CommandItem
                      key={item.path}
                      onSelect={() => handleSelect(item.path || "")}
                    >
                      {item.icon && <item.icon />}
                      <span>{t(item.label)}</span>{" "}
                      {/* Render translated label */}
                    </CommandItem>
                  ))}
                </CommandGroup>
                {index < filteredCommands.length - 1 && <CommandSeparator />}
              </div>
            ))
          )}
        </CommandList>
      )}
    </Command>
  );
}
