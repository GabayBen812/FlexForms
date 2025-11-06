import React, { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { ColumnDef } from "@tanstack/react-table";
import { Search } from "lucide-react";

interface DataTableAdvancedSearchProps {
  showAdvancedSearch: boolean;
  columns: ColumnDef<any>[];
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
        className="flex items-center gap-2 bg-sky-600 hover:bg-sky-700 text-white hover:text-white border-sky-600 hover:border-sky-700 shadow-md hover:shadow-lg transition-all duration-200 font-medium"
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
