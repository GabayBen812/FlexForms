import { RouteObject } from "react-router-dom";
import { router } from "./router";

export interface RouteInfo {
  title: string;
  icon?: React.ComponentType<{ isActive?: boolean; className?: string }>;
  path: string;
  routeKey: string;
}

/**
 * Normalizes a path by removing leading/trailing slashes
 */
function normalizePath(path: string): string {
  return path.replace(/^\/+|\/+$/g, '');
}

/**
 * Converts a route path pattern to a regex pattern
 * Example: "courses/:courseId/manage" -> "courses/[^/]+/manage"
 */
function pathPatternToRegex(pattern: string): RegExp {
  const normalized = normalizePath(pattern);
  const regexPattern = normalized
    .replace(/:[^/]+/g, '[^/]+')
    .replace(/\//g, '\\/');
  return new RegExp(`^${regexPattern}$`);
}

/**
 * Checks if a path matches a route pattern
 */
function matchesRoutePattern(path: string, routePattern: string): boolean {
  const normalizedPath = normalizePath(path);
  const regex = pathPatternToRegex(routePattern);
  return regex.test(normalizedPath);
}

/**
 * Finds the parent route for a given path that should be shown in tabs
 * Returns the route key (base path) that should be used for the tab
 */
export function getTabRouteKey(path: string): string {
  // Normalize the input path
  const normalizedPath = normalizePath(path);
  
  // Get the main layout route (the one with Layout component)
  const mainRoute = router.routes.find(
    (route) => route.handle?.showInSidebar === true && Array.isArray(route.children)
  );
  
  if (!mainRoute?.children) {
    // Fallback to home if no routes found
    return "/home";
  }

  // Find all routes that should be shown in sidebar (these are tab candidates)
  const tabRoutes = mainRoute.children.filter(
    (route) => route.handle?.showInSidebar === true && route.path
  );

  // First, check for exact matches with tab routes
  for (const route of tabRoutes) {
    if (!route.path) continue;
    const routePath = normalizePath(route.path);
    
    if (normalizedPath === routePath) {
      return `/${routePath}`;
    }
  }

  // Check if path starts with any tab route path (for nested routes)
  // Sort by length (longest first) to match most specific routes first
  const sortedTabRoutes = [...tabRoutes].sort((a, b) => {
    const aPath = normalizePath(a.path || "");
    const bPath = normalizePath(b.path || "");
    return bPath.length - aPath.length;
  });

  for (const route of sortedTabRoutes) {
    if (!route.path) continue;
    const routePath = normalizePath(route.path);
    
    // Check if the normalized path starts with this route path
    // e.g., "courses/123/manage" starts with "courses"
    if (normalizedPath.startsWith(routePath + "/") || normalizedPath === routePath) {
      return `/${routePath}`;
    }
  }

  // Check for routes with parameters (e.g., courses/:courseId/manage)
  // These should map to their parent route
  for (const route of mainRoute.children) {
    if (!route.path) continue;
    
    const routePath = route.path;
    
    // Skip routes that are already tab routes
    if (route.handle?.showInSidebar) continue;
    
    // Check pattern match for routes with params
    if (routePath.includes(':') && matchesRoutePattern(normalizedPath, routePath)) {
      // Find the parent route
      return findParentTabRoute(routePath, tabRoutes);
    }
  }
  
  // Check for activity/:code routes - these should map to forms
  if (normalizedPath.startsWith("activity/")) {
    // Map to forms tab
    const formsRoute = tabRoutes.find(r => r.path === "forms");
    if (formsRoute) {
      return "/forms";
    }
  }
  
  // Default fallback to home
  return "/home";
}

/**
 * Finds the parent tab route for a child route
 * For example, "courses/:courseId/manage" should map to "courses"
 */
function findParentTabRoute(routePath: string, tabRoutes: RouteObject[]): string {
  const normalizedRoutePath = normalizePath(routePath);
  const segments = normalizedRoutePath.split('/');
  
  // Try to find a parent route by checking route prefixes
  for (let i = segments.length - 1; i > 0; i--) {
    const parentPath = segments.slice(0, i).join('/');
    const parentRoute = tabRoutes.find(r => {
      if (!r.path) return false;
      return normalizePath(r.path) === parentPath;
    });
    
    if (parentRoute) {
      return `/${parentPath}`;
    }
  }
  
  // Check if first segment matches any tab route
  const firstSegment = segments[0];
  const firstSegmentRoute = tabRoutes.find(r => {
    if (!r.path) return false;
    return normalizePath(r.path) === firstSegment;
  });
  
  if (firstSegmentRoute) {
    return `/${firstSegment}`;
  }
  
  // Default to home
  return "/home";
}

/**
 * Gets route information (title, icon, path) for a given route key
 */
export function getRouteInfo(routeKey: string): RouteInfo | null {
  const mainRoute = router.routes.find(
    (route) => route.handle?.showInSidebar === true && Array.isArray(route.children)
  );
  
  if (!mainRoute?.children) {
    return null;
  }

  // Remove leading slash for comparison
  const normalizedKey = normalizePath(routeKey);
  
  // Find the route
  const route = mainRoute.children.find(r => {
    if (!r.path) return false;
    return normalizePath(r.path) === normalizedKey;
  });
  
  if (!route || !route.handle?.title) {
    return null;
  }
  
  return {
    title: route.handle.title,
    icon: route.handle.icon,
    path: route.path || routeKey,
    routeKey: `/${normalizedKey}`,
  };
}

/**
 * Determines if a route should create/manage tabs
 */
export function isTabRoute(route: RouteObject): boolean {
  // Routes with showInSidebar should create tabs
  return route.handle?.showInSidebar === true;
}

/**
 * Gets the full route path with base path
 */
export function getFullRoutePath(routePath: string): string {
  if (routePath.startsWith('/')) {
    return routePath;
  }
  return `/${routePath}`;
}

