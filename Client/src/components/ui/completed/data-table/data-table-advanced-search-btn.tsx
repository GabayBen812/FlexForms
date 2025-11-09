import React, { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Search } from "lucide-react";

interface DataTableAdvancedSearchProps {
  showAdvancedSearch: boolean;
  onAdvancedSearchChange?: (filters: Record<string, any>) => void;
  initialAdvancedFilters?: Record<string, any>;
  onOpenChange?: (open: boolean) => void;
}

export function DataTableAdvancedSearchBtn({
  showAdvancedSearch,
  onOpenChange,
  initialAdvancedFilters = {},
}: DataTableAdvancedSearchProps) {
  const { t } = useTranslation();

  // Count active filters (non-empty, non-null, non-undefined)
  const activeFilterCount = useMemo(() => {
    if (!initialAdvancedFilters || Object.keys(initialAdvancedFilters).length === 0) {
      return 0;
    }
    return Object.keys(initialAdvancedFilters).filter(key => {
      const value = initialAdvancedFilters[key];
      return value !== undefined && 
             value !== null && 
             value !== '' && 
             !(Array.isArray(value) && value.length === 0);
    }).length;
  }, [initialAdvancedFilters]);

  if (!showAdvancedSearch) return null;

  return (
    <div className="relative inline-block">
      <Button
        variant="outline"
        onClick={() => onOpenChange?.(true)}
        className="flex items-center gap-2 rounded-full border-transparent bg-gradient-to-r from-sky-500 via-blue-500 to-indigo-500 px-5 py-2 text-sm font-semibold text-white shadow-lg shadow-sky-200/40 transition-transform duration-200 ease-out hover:-translate-y-0.5 hover:from-sky-500 hover:via-blue-500 hover:to-indigo-400 hover:text-white hover:shadow-xl hover:shadow-sky-200/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-200 focus-visible:ring-offset-2"
      >
        <Search className="h-4 w-4" />
        {t("advanced_search", "חיפוש מתקדם")}
      </Button>
      {activeFilterCount > 0 && (
        <span className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center rounded-full bg-blue-500 text-white text-xs font-semibold z-10">
          {activeFilterCount}
        </span>
      )}
    </div>
  );
}
