import { RouteObject } from "react-router-dom";

export const isRouteActive = (
  Route: RouteObject,
  currentPath: string,
  strict?: boolean
) => {
  if (strict) return Route.path === currentPath;
  return currentPath.startsWith(Route.path || "");
};
