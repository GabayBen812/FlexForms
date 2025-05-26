import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { AdvancedSearchModal } from "./AdvancedSearchModal";
import { ColumnDef } from "@tanstack/react-table";
import { Search } from "lucide-react";

interface DataTableAdvancedSearchProps {
  showAdvancedSearch: boolean;
  columns: ColumnDef<any>[];
  onAdvancedSearchChange?: (filters: Record<string, any>) => void;
  initialAdvancedFilters?: Record<string, any>;
}

export function DataTableAdvancedSearchBtn({
  showAdvancedSearch,
  columns,
  onAdvancedSearchChange,
  initialAdvancedFilters = {},
}: DataTableAdvancedSearchProps) {
  const { t } = useTranslation();
  const [isAdvancedOpen, setIsAdvancedOpen] = useState(false);

  if (!showAdvancedSearch) return null;

  return (
    <>
      <Button
        variant="outline"
        onClick={() => setIsAdvancedOpen(true)}
        className="flex items-center gap-2"
      >
        <Search className="h-4 w-4" />
        {t("advanced_search", "חיפוש מתקדם")}
      </Button>

      <AdvancedSearchModal
        open={isAdvancedOpen}
        onClose={() => setIsAdvancedOpen(false)}
        columns={columns}
        onApply={(filters) => {
          onAdvancedSearchChange?.(filters);
          setIsAdvancedOpen(false);
        }}
        initialFilters={initialAdvancedFilters}
      />
    </>
  );
}
