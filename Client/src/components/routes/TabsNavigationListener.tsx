import { useEffect, useContext, useRef } from "react";
import { useLocation } from "react-router-dom";
import { TabsContext } from "@/contexts/TabsContext";
import { getTabRouteKey } from "@/utils/routes/tabUtils";

export function TabsNavigationListener() {
  // All hooks must be called before any early returns
  const location = useLocation();
  const tabsContext = useContext(TabsContext);
  const previousPathRef = useRef<string | null>(null);
  const isInitialMountRef = useRef(true);
  
  // Get context values (may be undefined)
  const addTab = tabsContext?.addTab;
  const updateTabPath = tabsContext?.updateTabPath;
  const tabs = tabsContext?.tabs ?? [];
  const activeTabId = tabsContext?.activeTabId ?? null;
  const setActiveTab = tabsContext?.setActiveTab;
  const isInitialized = tabsContext?.isInitialized ?? false;

  useEffect(() => {
    // Early return checks inside the effect (this is allowed)
    if (!tabsContext || !isInitialized || tabs.length === 0 || !addTab || !updateTabPath || !setActiveTab) {
      return;
    }

    const currentPath = location.pathname;
    const previousPath = previousPathRef.current;

    // Skip if path is not a tab route (e.g., login, registration, etc.)
    if (
      currentPath === "/login" ||
      currentPath === "/create-organization" ||
      (currentPath.startsWith("/activity/") && currentPath.includes("/registration")) ||
      currentPath.startsWith("/payment/")
    ) {
      previousPathRef.current = currentPath;
      return;
    }

    // On initial mount, just set the active tab if it exists - don't create new tabs
    if (isInitialMountRef.current) {
      isInitialMountRef.current = false;
      const routeKey = getTabRouteKey(currentPath);
      const existingTab = tabs.find(t => t.routeKey === routeKey);
      
      if (existingTab) {
        // Update path if needed and set as active
        if (existingTab.path !== currentPath) {
          updateTabPath(existingTab.id, currentPath);
        }
        if (activeTabId !== existingTab.id) {
          setActiveTab(existingTab.id);
        }
      }
      // Don't create new tabs on initial load - let user navigate to create them
      previousPathRef.current = currentPath;
      return;
    }

    // Only handle navigation changes (not initial load)
    if (previousPath === currentPath) {
      return;
    }

    // Get the route key for this path
    const routeKey = getTabRouteKey(currentPath);

    // Check if a tab with this routeKey already exists
    const existingTab = tabs.find(t => t.routeKey === routeKey);

    if (existingTab) {
      // Update the existing tab's path if it changed
      if (existingTab.path !== currentPath) {
        updateTabPath(existingTab.id, currentPath);
      }
      // Set it as active
      if (activeTabId !== existingTab.id) {
        setActiveTab(existingTab.id);
      }
    } else {
      // Create a new tab only when user navigates to a new route
      addTab(currentPath);
    }
    
    previousPathRef.current = currentPath;
  }, [location.pathname, addTab, updateTabPath, setActiveTab, tabs, activeTabId, tabsContext, isInitialized]);

  return null;
}

