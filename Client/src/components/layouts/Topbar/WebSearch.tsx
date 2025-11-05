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
import { useFeatureFlag } from "@/hooks/useFeatureFlag";
import { useAuth } from "@/hooks/useAuth";

export function CommandDialogDemo() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [isFocused, setIsFocused] = useState(false);
  const [query, setQuery] = useState("");

  // Get user from auth context
  const { user } = useAuth();

  // Get all feature flags
  const { isEnabled: roomsFF } = useFeatureFlag("ff_is_show_rooms");
  const { isEnabled: paymentsFF } = useFeatureFlag("is_show_payments");
  const { isEnabled: clubsFF } = useFeatureFlag("is_show_clubs");
  const { isEnabled: requestsFF } = useFeatureFlag("is_show_requests");
  const { isEnabled: messagesFF } = useFeatureFlag("is_show_messages");
  const { isEnabled: maccabiFF } = useFeatureFlag("is_maccabi");

  // Extract commands from router
  const commandData = [
    {
      heading: "pages",
      items:
        router.routes
          .find((route) => Array.isArray(route.children))
          ?.children?.filter((route) => {
            if (!route.handle?.showInSidebar) return false;
            // Feature flag checks
            if (route.handle.featureFlag === "ff_is_show_rooms" && !roomsFF) return false;
            if (route.handle.featureFlag === "is_show_payments" && !paymentsFF) return false;
            if (route.handle.featureFlag === "is_show_clubs" && !clubsFF) return false;
            if (route.handle.featureFlag === "is_show_requests" && !requestsFF) return false;
            if (route.handle.featureFlag === "is_show_messages" && !messagesFF) return false;
            if (route.handle.featureFlag === "is_maccabi" && !maccabiFF) return false;
            // Admin only check
            if (route.handle?.adminOnly && user?.role !== 'system_admin') return false;
            return true;
          })
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
    <Command className="rounded-lg border shadow-sm md:min-w-[300px] max-w-[400px]">
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
