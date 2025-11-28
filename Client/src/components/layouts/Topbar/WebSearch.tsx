import { useState, useMemo } from "react";
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
import { useFeatureFlags } from "@/hooks/useFeatureFlag";
import { useAuth } from "@/hooks/useAuth";

export function CommandDialogDemo() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [isFocused, setIsFocused] = useState(false);
  const [query, setQuery] = useState("");

  // Get user from auth context
  const { user } = useAuth();

  // Extract all unique feature flags from router routes
  const uniqueFeatureFlags = useMemo(() => {
    const flags = new Set<string>();
    const mainRoute = router.routes.find((route) => Array.isArray(route.children));
    mainRoute?.children?.forEach((route) => {
      if (route.handle?.featureFlag && typeof route.handle.featureFlag === "string") {
        flags.add(route.handle.featureFlag);
      }
    });
    return Array.from(flags);
  }, []);

  // Check all unique feature flags at once
  const { flags: featureFlagLookup } = useFeatureFlags(uniqueFeatureFlags);

  // Extract commands from router
  const commandData = useMemo(() => [
    {
      heading: "pages",
      items:
        router.routes
          .find((route) => Array.isArray(route.children))
          ?.children?.filter((route) => {
            if (!route.handle?.showInSidebar) return false;
            
            // Dynamic feature flag check
            const featureFlag = route.handle?.featureFlag;
            if (featureFlag && typeof featureFlag === "string") {
              // Check if this specific feature flag is enabled
              const isEnabled = featureFlagLookup[featureFlag];
              if (!isEnabled) return false;
            }
            
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
  ], [featureFlagLookup, user?.role]);

  const filteredCommands = commandData.map((group) => ({
    ...group,
    items: group.items.filter(
      (item) => t(item.label).toLowerCase().includes(query.toLowerCase()) // Search using the translated label
    ),
  }));

  const handleSelect = (path: string) => {
    // Ensure path starts with / for proper navigation
    const normalizedPath = path.startsWith('/') ? path : `/${path}`;
    navigate(normalizedPath);
    setIsFocused(false);
    //@ts-ignore
    document.activeElement?.blur();
  };

  return (
    <Command className="rounded-lg border shadow-sm md:min-w-[350px] max-w-[500px]">
      <CommandInput
        className="shadow-none"
        placeholder={t("search_in_system")}
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
