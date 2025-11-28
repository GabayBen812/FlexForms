interface RecentRoute {
  path: string;
  label: string;
  timestamp: number;
}

const STORAGE_KEY = "command_palette_recent_routes";
const MAX_RECENT_ROUTES = 8;

/**
 * Get the storage key scoped by organization ID
 */
function getStorageKey(organizationId?: string): string {
  if (!organizationId) {
    return STORAGE_KEY;
  }
  return `${STORAGE_KEY}_${organizationId}`;
}

/**
 * Get recent routes from localStorage
 * Returns empty array if no routes found or on error
 */
export function getRecentRoutes(organizationId?: string): RecentRoute[] {
  if (typeof window === "undefined") {
    return [];
  }

  try {
    const key = getStorageKey(organizationId);
    const stored = localStorage.getItem(key);
    if (!stored) {
      return [];
    }

    const routes: RecentRoute[] = JSON.parse(stored);
    // Validate and filter out invalid entries
    return routes
      .filter(
        (route) =>
          route &&
          typeof route.path === "string" &&
          typeof route.label === "string" &&
          typeof route.timestamp === "number"
      )
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, MAX_RECENT_ROUTES);
  } catch (error) {
    console.error("Error reading recent routes from localStorage:", error);
    return [];
  }
}

/**
 * Add a route to recent routes
 * Removes duplicates and keeps only the most recent MAX_RECENT_ROUTES
 */
export function addRecentRoute(
  path: string,
  label: string,
  organizationId?: string
): void {
  if (typeof window === "undefined" || !path || !label) {
    return;
  }

  try {
    const key = getStorageKey(organizationId);
    const existing = getRecentRoutes(organizationId);

    // Remove any existing entry with the same path
    const filtered = existing.filter((route) => route.path !== path);

    // Add new route at the beginning
    const updated: RecentRoute[] = [
      {
        path,
        label,
        timestamp: Date.now(),
      },
      ...filtered,
    ].slice(0, MAX_RECENT_ROUTES);

    localStorage.setItem(key, JSON.stringify(updated));
  } catch (error) {
    console.error("Error saving recent route to localStorage:", error);
  }
}

/**
 * Clear all recent routes for an organization
 */
export function clearRecentRoutes(organizationId?: string): void {
  if (typeof window === "undefined") {
    return;
  }

  try {
    const key = getStorageKey(organizationId);
    localStorage.removeItem(key);
  } catch (error) {
    console.error("Error clearing recent routes from localStorage:", error);
  }
}

/**
 * Remove a specific route from recent routes
 */
export function removeRecentRoute(
  path: string,
  organizationId?: string
): void {
  if (typeof window === "undefined" || !path) {
    return;
  }

  try {
    const key = getStorageKey(organizationId);
    const existing = getRecentRoutes(organizationId);
    const filtered = existing.filter((route) => route.path !== path);
    localStorage.setItem(key, JSON.stringify(filtered));
  } catch (error) {
    console.error("Error removing recent route from localStorage:", error);
  }
}

