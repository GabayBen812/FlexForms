import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react";
import { useOrganization } from "@/hooks/useOrganization";
import { getTabRouteKey, getRouteInfo, getFullRoutePath } from "@/utils/routes/tabUtils";

export interface Tab {
  id: string;
  routeKey: string; // base route path (e.g., "/courses")
  path: string; // current full path (e.g., "/courses/123/manage")
  title: string; // route title for display
  createdAt: number; // timestamp
}

interface TabsContextType {
  tabs: Tab[];
  activeTabId: string | null;
  isInitialized: boolean;
  addTab: (path: string) => void;
  removeTab: (tabId: string) => void;
  setActiveTab: (tabId: string) => void;
  updateTabPath: (tabId: string, path: string) => void;
  switchTab: (tabId: string) => void;
  closeTab: (tabId: string) => void;
  reorderTabs: (tabIds: string[]) => void;
}

export const TabsContext = createContext<TabsContextType | undefined>(undefined);

const STORAGE_KEY_PREFIX = "flexforms_tabs";

function getStorageKey(organizationId: string | undefined): string {
  if (!organizationId) {
    return `${STORAGE_KEY_PREFIX}_default`;
  }
  return `${STORAGE_KEY_PREFIX}_${organizationId}`;
}

function loadTabsFromStorage(organizationId: string | undefined): Tab[] {
  try {
    const storageKey = getStorageKey(organizationId);
    const stored = localStorage.getItem(storageKey);
    if (stored) {
      const parsed = JSON.parse(stored);
      // Validate that tabs have required fields and remove icon (can't be serialized)
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed
          .filter((tab: any) => 
            tab.id && tab.routeKey && tab.path && tab.title
          )
          .map((tab: any) => {
            // Remove icon property if it exists (components can't be serialized)
            const { icon, ...tabWithoutIcon } = tab;
            return tabWithoutIcon;
          });
      }
    }
  } catch (error) {
    console.error("Error loading tabs from storage:", error);
  }
  return [];
}

function saveTabsToStorage(tabs: Tab[], organizationId: string | undefined): void {
  try {
    const storageKey = getStorageKey(organizationId);
    localStorage.setItem(storageKey, JSON.stringify(tabs));
  } catch (error) {
    console.error("Error saving tabs to storage:", error);
  }
}

function createHomeTab(): Tab {
  const routeInfo = getRouteInfo("home");
  return {
    id: "home-tab",
    routeKey: "/home",
    path: "/home",
    title: routeInfo?.title || "home",
    createdAt: Date.now(),
  };
}

interface TabsProviderProps {
  children: ReactNode;
}

export const TabsProvider: React.FC<TabsProviderProps> = ({ children }) => {
  const { organization } = useOrganization();
  const organizationId = organization?._id;
  
  // Initialize tabs - will be loaded from storage when organization is ready
  const [tabs, setTabs] = useState<Tab[]>([]);
  
  const [activeTabId, setActiveTabId] = useState<string | null>(null);

  const [isInitialized, setIsInitialized] = useState(false);

  // Load tabs from storage when organization is available (only once)
  useEffect(() => {
    if (!organizationId || isInitialized) return;
    
    const loaded = loadTabsFromStorage(organizationId);
    if (loaded.length > 0 && loaded.find(t => t.routeKey === "/home")) {
      // Restore tabs in the exact order they were saved (preserve order from localStorage)
      setTabs(loaded);
      // Restore active tab if it exists
      const lastActive = localStorage.getItem(`${getStorageKey(organizationId)}_active`);
      if (lastActive && loaded.find(t => t.id === lastActive)) {
        setActiveTabId(lastActive);
      } else {
        const homeTab = loaded.find(t => t.routeKey === "/home");
        setActiveTabId(homeTab?.id || loaded[0]?.id || "home-tab");
      }
    } else {
      // First time - ensure home tab exists
      const homeTab = createHomeTab();
      setTabs([homeTab]);
      setActiveTabId("home-tab");
      saveTabsToStorage([homeTab], organizationId);
    }
    
    setIsInitialized(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [organizationId]);

  // Save to storage whenever tabs change (but not on initial load)
  useEffect(() => {
    if (isInitialized && tabs.length > 0 && organizationId) {
      saveTabsToStorage(tabs, organizationId);
    }
  }, [tabs, organizationId, isInitialized]);

  // Save active tab ID
  useEffect(() => {
    if (activeTabId && organizationId) {
      localStorage.setItem(`${getStorageKey(organizationId)}_active`, activeTabId);
    }
  }, [activeTabId, organizationId]);

  const addTab = useCallback((path: string) => {
    const fullPath = getFullRoutePath(path);
    const routeKey = getTabRouteKey(fullPath);
    const routeInfo = getRouteInfo(routeKey);
    
    if (!routeInfo) {
      console.warn(`No route info found for path: ${path}`);
      return;
    }

    setTabs((currentTabs) => {
      // Check if tab with this routeKey already exists
      const existingTab = currentTabs.find(t => t.routeKey === routeKey);
      
      if (existingTab) {
        // Update existing tab's path and set as active
        setActiveTabId(existingTab.id);
        return currentTabs.map(tab => 
          tab.id === existingTab.id 
            ? { ...tab, path: fullPath }
            : tab
        );
      }
      
      // Create new tab
      const newTab: Tab = {
        id: `tab-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        routeKey,
        path: fullPath,
        title: routeInfo.title,
        createdAt: Date.now(),
      };
      
      setActiveTabId(newTab.id);
      return [...currentTabs, newTab];
    });
  }, []);

  const removeTab = useCallback((tabId: string) => {
    setTabs((currentTabs) => {
      const tabToRemove = currentTabs.find(t => t.id === tabId);
      
      // Prevent removing Home tab
      if (tabToRemove?.routeKey === "/home") {
        return currentTabs;
      }
      
      const filtered = currentTabs.filter(t => t.id !== tabId);
      
      // If we removed the active tab, switch to another tab
      if (activeTabId === tabId) {
        if (filtered.length > 0) {
          // Find the tab that was before the removed one, or the first one
          const removedIndex = currentTabs.findIndex(t => t.id === tabId);
          const newActiveIndex = Math.max(0, removedIndex - 1);
          setActiveTabId(filtered[newActiveIndex].id);
        } else {
          // No tabs left, create home tab
          const homeTab = createHomeTab();
          setActiveTabId(homeTab.id);
          return [homeTab];
        }
      }
      
      return filtered;
    });
  }, [activeTabId]);

  const setActiveTab = useCallback((tabId: string) => {
    setActiveTabId(tabId);
  }, []);

  const updateTabPath = useCallback((tabId: string, path: string) => {
    const fullPath = getFullRoutePath(path);
    setTabs((currentTabs) => {
      return currentTabs.map(tab => 
        tab.id === tabId 
          ? { ...tab, path: fullPath }
          : tab
      );
    });
  }, []);

  const switchTab = useCallback((tabId: string) => {
    setActiveTabId(tabId);
  }, []);

  const closeTab = useCallback((tabId: string) => {
    removeTab(tabId);
  }, [removeTab]);

  const reorderTabs = useCallback((tabIds: string[]) => {
    setTabs((currentTabs) => {
      // Create a map for quick lookup
      const tabMap = new Map(currentTabs.map(tab => [tab.id, tab]));
      
      // Reorder tabs according to the new order - preserve exact order
      const reorderedTabs = tabIds
        .map(id => tabMap.get(id))
        .filter((tab): tab is Tab => tab !== undefined);
      
      // This should not happen, but safety check
      const remainingIds = new Set(tabIds);
      const missingTabs = currentTabs.filter(tab => !remainingIds.has(tab.id));
      
      // Return tabs in the exact new order
      // The useEffect will save them to localStorage automatically
      return [...reorderedTabs, ...missingTabs];
    });
  }, []);

  return (
    <TabsContext.Provider
      value={{
        tabs,
        activeTabId,
        isInitialized,
        addTab,
        removeTab,
        setActiveTab,
        updateTabPath,
        switchTab,
        closeTab,
        reorderTabs,
      }}
    >
      {children}
    </TabsContext.Provider>
  );
};

export function useTabs(): TabsContextType {
  const context = useContext(TabsContext);
  if (context === undefined) {
    throw new Error("useTabs must be used within a TabsProvider");
  }
  return context;
}

