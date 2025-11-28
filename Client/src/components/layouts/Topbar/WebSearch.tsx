import { useState, useMemo, useEffect, useCallback } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import Fuse, { FuseResult } from "fuse.js";
import {
  CommandDialog,
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
import { HighlightMatch } from "@/components/ui/highlight-match";
import {
  getRecentRoutes,
  addRecentRoute,
} from "@/utils/commandPaletteStorage";
import { Clock, X } from "lucide-react";
import { useDebounce } from "@/hooks/useDebounce";
import { DialogClose } from "@/components/ui/dialog";

interface RouteItem {
  label: string;
  icon?: React.ComponentType<{ className?: string }>;
  path: string;
  searchText: string; // Combined searchable text
}

interface CommandDialogDemoProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function CommandDialogDemo({ 
  open: controlledOpen, 
  onOpenChange: controlledOnOpenChange 
}: CommandDialogDemoProps = {}) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const [internalOpen, setInternalOpen] = useState(false);
  const [query, setQuery] = useState("");
  const debouncedQuery = useDebounce(query, 150);

  // Use controlled state if provided, otherwise use internal state
  const open = controlledOpen !== undefined ? controlledOpen : internalOpen;
  const setOpen = useCallback((value: boolean | ((prev: boolean) => boolean)) => {
    const newValue = typeof value === "function" ? value(open) : value;
    if (controlledOnOpenChange) {
      controlledOnOpenChange(newValue);
    } else {
      setInternalOpen(newValue);
    }
  }, [open, controlledOnOpenChange]);

  // Get user from auth context
  const { user } = useAuth();
  const organizationId = user?.organizationId;

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

  // Extract all available routes
  const allRoutes = useMemo<RouteItem[]>(() => {
    const mainRoute = router.routes.find((route) => Array.isArray(route.children));
    if (!mainRoute?.children) return [];

    return mainRoute.children
      .filter((route) => {
        if (!route.handle?.showInSidebar) return false;
        
        // Hide admin route from command palette (SECRET PAGE)
        if (route.path === "admin" || route.handle?.adminOnly) return false;
        
        // Dynamic feature flag check
        const featureFlag = route.handle?.featureFlag;
        if (featureFlag && typeof featureFlag === "string") {
          const isEnabled = featureFlagLookup[featureFlag];
          if (!isEnabled) return false;
        }
        
        return true;
      })
      .map((route) => {
        const label = route.handle?.title || "";
        const path = route.path || "";
        const translatedLabel = t(label);
        
        // Create searchable text: label, translated label, path
        const searchText = [
          label.toLowerCase(),
          translatedLabel.toLowerCase(),
          path.toLowerCase(),
          path.replace("/", "").toLowerCase(),
        ].join(" ");

        return {
          label: translatedLabel,
          icon: route.handle?.icon,
          path: path.startsWith("/") ? path : `/${path}`,
          searchText,
        };
      });
  }, [featureFlagLookup, user?.role, t]);

  // Get recent routes
  const recentRoutes = useMemo(() => {
    const recent = getRecentRoutes(organizationId);
    // Map recent route paths to actual route items
    return recent
      .map((recentRoute) => {
        const routeItem = allRoutes.find((r) => r.path === recentRoute.path);
        if (!routeItem) return null;
        return {
          ...routeItem,
          timestamp: recentRoute.timestamp,
        };
      })
      .filter((item): item is RouteItem & { timestamp: number } => item !== null)
      .slice(0, 5);
  }, [allRoutes, organizationId]);

  // Initialize Fuse.js for fuzzy search
  const fuse = useMemo(() => {
    return new Fuse(allRoutes, {
      keys: ["searchText", "label", "path"],
      threshold: 0.3, // 0.0 = exact match, 1.0 = match anything
      includeScore: true,
      minMatchCharLength: 1,
    });
  }, [allRoutes]);

  // Filter and score routes based on query
  const filteredRoutes = useMemo(() => {
    if (!debouncedQuery.trim()) {
      return allRoutes;
    }

    const queryLower = debouncedQuery.toLowerCase().trim();

    // First, try exact matches and prefix matches
    const exactMatches: RouteItem[] = [];
    const prefixMatches: RouteItem[] = [];
    const fuzzyResults: FuseResult<RouteItem>[] = [];

    allRoutes.forEach((route) => {
      const searchLower = route.searchText;
      const labelLower = route.label.toLowerCase();
      const pathLower = route.path.toLowerCase();

      // Exact match in label
      if (labelLower === queryLower || pathLower === queryLower || pathLower === `/${queryLower}`) {
        exactMatches.push(route);
        return;
      }

      // Prefix match (starts with)
      if (
        labelLower.startsWith(queryLower) ||
        pathLower.startsWith(queryLower) ||
        pathLower.startsWith(`/${queryLower}`)
      ) {
        prefixMatches.push(route);
        return;
      }
    });

    // Fuzzy search for remaining matches
    const fuzzySearchResults = fuse.search(debouncedQuery);
    fuzzyResults.push(...fuzzySearchResults);

    // Combine results with priority: exact > prefix > fuzzy
    const seenPaths = new Set<string>();
    const result: RouteItem[] = [];

    [...exactMatches, ...prefixMatches].forEach((route) => {
      if (!seenPaths.has(route.path)) {
        seenPaths.add(route.path);
        result.push(route);
      }
    });

    fuzzyResults.forEach((fuzzyResult) => {
      if (!seenPaths.has(fuzzyResult.item.path)) {
        seenPaths.add(fuzzyResult.item.path);
        result.push(fuzzyResult.item);
      }
    });

    return result;
  }, [allRoutes, debouncedQuery, fuse]);

  // Handle route selection
  const handleSelect = useCallback(
    (path: string, label: string) => {
      const normalizedPath = path.startsWith("/") ? path : `/${path}`;
      addRecentRoute(normalizedPath, label, organizationId);
      navigate(normalizedPath);
      setOpen(false);
      setQuery("");
    },
    [navigate, organizationId]
  );

  // Only handle Escape key here since Topbar handles Cmd/Ctrl+K
  useEffect(() => {
    if (!open) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        setOpen(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, setOpen]);

  // Reset query when dialog closes
  useEffect(() => {
    if (!open) {
      setQuery("");
    }
  }, [open]);

  // Track current route for recent items
  useEffect(() => {
    if (location.pathname && organizationId && open === false) {
      const currentRoute = allRoutes.find((r) => r.path === location.pathname);
      if (currentRoute) {
        addRecentRoute(currentRoute.path, currentRoute.label, organizationId);
      }
    }
  }, [location.pathname, organizationId, allRoutes, open]);

  const hasResults = filteredRoutes.length > 0;
  const hasRecent = recentRoutes.length > 0 && !debouncedQuery.trim();
  const showRecent = hasRecent && open;

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <div className="relative">
        <CommandInput
          placeholder={t("search_in_system") || "Search pages..."}
          value={query}
          onValueChange={setQuery}
        />
        <DialogClose asChild>
          <button
            className="absolute top-4 left-4 p-1.5 rounded-sm text-red-600 hover:text-red-700 transition-colors focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 disabled:pointer-events-none z-10"
            onClick={() => setOpen(false)}
          >
            <X className="h-4 w-4" />
            <span className="sr-only">Close</span>
          </button>
        </DialogClose>
      </div>
      <CommandList className="max-h-[500px]">
        {!hasResults && debouncedQuery.trim() ? (
          <CommandEmpty>
            {t("No results found.") || "No results found."}
          </CommandEmpty>
        ) : (
          <>
            {showRecent && (
              <>
                <CommandGroup heading={t("recent") || "Recent"}>
                  {recentRoutes.map((route) => (
                    <CommandItem
                      key={`recent-${route.path}`}
                      value={`${route.path} ${route.label}`}
                      onSelect={() => handleSelect(route.path, route.label)}
                      className="flex items-center gap-3"
                    >
                      <Clock className="h-4 w-4 opacity-50 shrink-0" />
                      {route.icon && (
                        <route.icon className="h-4 w-4 shrink-0 opacity-70" />
                      )}
                      <span className="flex-1 min-w-0">{route.label}</span>
                    </CommandItem>
                  ))}
                </CommandGroup>
                <CommandSeparator />
              </>
            )}
            <CommandGroup heading={t("pages") || "Pages"}>
              {filteredRoutes.slice(0, 20).map((route) => (
                <CommandItem
                  key={route.path}
                  value={`${route.path} ${route.label}`}
                  onSelect={() => handleSelect(route.path, route.label)}
                  className="flex items-center gap-3"
                >
                  {route.icon && (
                    <route.icon className="h-4 w-4 shrink-0 opacity-70" />
                  )}
                  <div className="flex-1 min-w-0">
                    <HighlightMatch text={route.label} query={debouncedQuery} />
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          </>
        )}
      </CommandList>
    </CommandDialog>
  );
}
