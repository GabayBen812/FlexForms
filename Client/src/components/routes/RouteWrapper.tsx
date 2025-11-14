import { ReactNode } from "react";
import { NavigationLoader } from "./NavigationLoader";

interface RouteWrapperProps {
  children: ReactNode;
}

/**
 * Wrapper component for routes outside Layout that need navigation loading state
 */
export function RouteWrapper({ children }: RouteWrapperProps) {
  return (
    <>
      {children}
      <NavigationLoader />
    </>
  );
}

