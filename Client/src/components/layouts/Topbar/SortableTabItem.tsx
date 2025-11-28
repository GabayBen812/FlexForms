import React from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Tab } from "@/contexts/TabsContext";
import { cn } from "@/lib/utils";
import { getRouteInfo } from "@/utils/routes/tabUtils";
import { useTranslation } from "react-i18next";
import { X } from "lucide-react";

interface SortableTabItemProps {
  tab: Tab;
  isActive: boolean;
  canClose: boolean;
  onTabClick: (tabId: string, path: string, routeKey: string, isActive: boolean) => void;
  onCloseTab: (e: React.MouseEvent, tabId: string, routeKey: string) => void;
  activeTabRef?: React.RefObject<HTMLButtonElement>;
}

export function SortableTabItem({
  tab,
  isActive,
  canClose,
  onTabClick,
  onCloseTab,
  activeTabRef,
}: SortableTabItemProps) {
  const { t } = useTranslation();
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ 
    id: tab.id,
    disabled: false,
  });

  const routeInfo = getRouteInfo(tab.routeKey);
  const IconComponent = routeInfo?.icon;

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  // Track if we're currently dragging to prevent click events
  const [hasStartedDrag, setHasStartedDrag] = React.useState(false);
  
  React.useEffect(() => {
    if (isDragging) {
      setHasStartedDrag(true);
    } else {
      // Reset after a small delay to allow click events after drag ends
      const timer = setTimeout(() => setHasStartedDrag(false), 100);
      return () => clearTimeout(timer);
    }
  }, [isDragging]);

  return (
    <button
      ref={(node) => {
        setNodeRef(node);
        if (isActive && activeTabRef) {
          (activeTabRef as React.MutableRefObject<HTMLButtonElement | null>).current = node;
        }
      }}
      onClick={(e) => {
        if (!hasStartedDrag) {
          onTabClick(tab.id, tab.path, tab.routeKey, isActive);
        }
      }}
      className={cn(
        "group flex items-center gap-3 px-4 py-2.5 h-11 rounded-t-md transition-all duration-200 relative",
        "min-w-[160px] max-w-[280px]",
        "border-b-2",
        isActive
          ? "bg-white border-primary text-primary font-semibold shadow-sm"
          : "bg-transparent border-transparent text-muted-foreground hover:bg-muted/50 hover:text-foreground",
        "hover:border-muted-foreground/30",
        isDragging ? "z-50 cursor-grabbing" : "cursor-grab",
        !isDragging && "cursor-pointer"
      )}
      style={style}
      title={t(tab.title)}
      {...attributes}
      {...listeners}
    >
      {IconComponent && typeof IconComponent === 'function' && (
        <div className="w-5 h-5 shrink-0 flex items-center justify-center relative z-10 pointer-events-none">
          <IconComponent
            isActive={isActive}
            className={cn(
              "w-5 h-5",
              !isActive && "text-muted-foreground group-hover:text-foreground"
            )}
          />
        </div>
      )}
      <span className="truncate text-base font-medium relative z-10 pointer-events-none">{t(tab.title)}</span>
      {canClose && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onCloseTab(e, tab.id, tab.routeKey);
          }}
          className={cn(
            "absolute top-1/2 -translate-y-1/2 rtl:left-2 ltr:right-2 shrink-0 w-5 h-5 rounded-full hover:bg-red-100 hover:text-red-600 transition-colors z-20 cursor-pointer",
            "flex items-center justify-center opacity-0 group-hover:opacity-100",
            isActive && "opacity-100"
          )}
          title={t("close_tab") || "Close tab"}
          onPointerDown={(e) => e.stopPropagation()}
        >
          <X className="w-4 h-4" />
        </button>
      )}
    </button>
  );
}

