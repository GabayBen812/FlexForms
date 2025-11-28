import React, { useRef, useEffect, useState, useContext } from "react";
import { TabsContext } from "@/contexts/TabsContext";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { getRouteInfo } from "@/utils/routes/tabUtils";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  DragStartEvent,
  DragEndEvent,
  closestCenter,
} from "@dnd-kit/core";
import {
  SortableContext,
  horizontalListSortingStrategy,
  arrayMove,
} from "@dnd-kit/sortable";
import { SortableTabItem } from "./SortableTabItem";
import { Tab } from "@/contexts/TabsContext";

export function TabBar() {
  const tabsContext = useContext(TabsContext);
  const { t } = useTranslation();
  const navigate = useNavigate();
  const tabsContainerRef = useRef<HTMLDivElement>(null);
  const activeTabRef = useRef<HTMLButtonElement>(null);
  const [activeDraggedTab, setActiveDraggedTab] = useState<Tab | null>(null);
  
  // If context is not available, return null (shouldn't happen but safe guard)
  if (!tabsContext) {
    return null;
  }
  
  const { tabs, activeTabId, switchTab, closeTab, reorderTabs } = tabsContext;

  // Configure drag sensors with activation constraint (small delay to prevent accidental drags)
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // Require 8px of movement before drag starts
      },
    })
  );

  // Scroll active tab into view
  useEffect(() => {
    if (activeTabRef.current && tabsContainerRef.current && !activeDraggedTab) {
      const container = tabsContainerRef.current;
      const tab = activeTabRef.current;
      const containerRect = container.getBoundingClientRect();
      const tabRect = tab.getBoundingClientRect();

      // Check if tab is outside viewport
      if (tabRect.left < containerRect.left) {
        container.scrollTo({
          left: container.scrollLeft + (tabRect.left - containerRect.left) - 10,
          behavior: "smooth",
        });
      } else if (tabRect.right > containerRect.right) {
        container.scrollTo({
          left: container.scrollLeft + (tabRect.right - containerRect.right) + 10,
          behavior: "smooth",
        });
      }
    }
  }, [activeTabId, tabs, activeDraggedTab]);

  const handleTabClick = (tabId: string, path: string, routeKey: string, isActive: boolean) => {
    switchTab(tabId);
    // If clicking on active tab, navigate to base route instead of current path
    if (isActive) {
      navigate(routeKey);
    } else {
      navigate(path);
    }
  };

  const handleCloseTab = (e: React.MouseEvent, tabId: string, routeKey: string) => {
    e.stopPropagation();
    // Prevent closing Home tab
    if (routeKey === "/home") {
      return;
    }
    closeTab(tabId);
    
    // If closing active tab, navigate to the tab that will become active
    if (tabId === activeTabId) {
      const currentIndex = tabs.findIndex(t => t.id === tabId);
      const remainingTabs = tabs.filter(t => t.id !== tabId);
      
      if (remainingTabs.length > 0) {
        // Navigate to the tab that was before this one, or the first one
        const newActiveIndex = Math.max(0, currentIndex - 1);
        const newActiveTab = remainingTabs[newActiveIndex] || remainingTabs[0];
        navigate(newActiveTab.path);
      } else {
        // Should not happen as Home tab cannot be closed
        navigate("/home");
      }
    }
  };

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    const draggedTab = tabs.find(tab => tab.id === active.id);
    if (draggedTab) {
      setActiveDraggedTab(draggedTab);
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveDraggedTab(null);

    if (!over || active.id === over.id) {
      return;
    }

    const oldIndex = tabs.findIndex(tab => tab.id === active.id);
    const newIndex = tabs.findIndex(tab => tab.id === over.id);

    if (oldIndex !== -1 && newIndex !== -1) {
      const newTabs = arrayMove(tabs, oldIndex, newIndex);
      const newTabIds = newTabs.map(tab => tab.id);
      reorderTabs(newTabIds);
    }
  };

  const handleDragCancel = () => {
    setActiveDraggedTab(null);
  };

  if (tabs.length === 0) {
    return null;
  }

  const tabIds = tabs.map(tab => tab.id);

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragCancel={handleDragCancel}
    >
      <div className="flex items-center h-12 border-b bg-muted/30 overflow-hidden">
        <SortableContext items={tabIds} strategy={horizontalListSortingStrategy}>
          <div
            ref={tabsContainerRef}
            className="flex items-center gap-1 overflow-x-auto overflow-y-hidden scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent px-2"
            style={{
              scrollbarWidth: "thin",
              msOverflowStyle: "-ms-autohiding-scrollbar",
            }}
          >
            {tabs.map((tab) => {
              const isActive = tab.id === activeTabId;
              const canClose = tab.routeKey !== "/home";

              return (
                <SortableTabItem
                  key={tab.id}
                  tab={tab}
                  isActive={isActive}
                  canClose={canClose}
                  onTabClick={handleTabClick}
                  onCloseTab={handleCloseTab}
                  activeTabRef={isActive ? activeTabRef : undefined}
                />
              );
            })}
          </div>
        </SortableContext>
      </div>
      
      <DragOverlay dropAnimation={null}>
        {activeDraggedTab ? (
          <div className="group flex items-center gap-3 px-4 py-2.5 h-11 rounded-t-md transition-all duration-200 relative min-w-[160px] max-w-[280px] border-b-2 bg-white border-primary text-primary font-semibold shadow-2xl opacity-95 cursor-grabbing rotate-2 scale-105">
            {(() => {
              const routeInfo = getRouteInfo(activeDraggedTab.routeKey);
              const IconComponent = routeInfo?.icon;
              const isActive = activeDraggedTab.id === activeTabId;
              return (
                <>
                  {IconComponent && typeof IconComponent === 'function' && (
                    <div className="w-5 h-5 shrink-0 flex items-center justify-center">
                      <IconComponent
                        isActive={isActive}
                        className="w-5 h-5"
                      />
                    </div>
                  )}
                  <span className="truncate text-base font-medium">{t(activeDraggedTab.title)}</span>
                </>
              );
            })()}
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}

