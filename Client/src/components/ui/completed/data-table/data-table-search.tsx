// components/data-table/data-table-search.tsx
import React from "react";
import { Search, X } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Table } from "@tanstack/react-table";
import { cn } from "@/lib/utils";

interface DataTableSearchProps<TData> {
  table: Table<TData>;
  globalFilter: string;
  setGlobalFilter: (value: string) => void;
}

export function DataTableSearch<TData>({
  table,
  globalFilter,
  setGlobalFilter,
}: DataTableSearchProps<TData>) {
  const { t } = useTranslation();
  const hasValue = globalFilter && globalFilter.trim().length > 0;

  return (
    <div className="relative w-[220px] lg:w-[300px]">
      <input
        type="text"
        placeholder={t("search...", "חיפוש")}
        value={globalFilter ?? ""}
        onChange={(event) => setGlobalFilter(event.target.value)}
        className={cn(
          "h-12 w-full rounded-full bg-white border-2 border-border shadow-md",
          "placeholder:text-muted-foreground font-normal",
          "rtl:text-right ltr:text-left",
          "focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary",
          "transition-all duration-200",
          "px-4",
          hasValue ? "ltr:pr-20 rtl:pl-20" : "ltr:pr-12 rtl:pl-12"
        )}
      />
      <div className="absolute inset-y-0 flex items-center gap-2 ltr:right-3 rtl:left-3">
        {hasValue && (
          <button
            type="button"
            onClick={() => setGlobalFilter("")}
            className={cn(
              "flex items-center justify-center w-6 h-6 rounded-full",
              "text-muted-foreground hover:text-foreground",
              "hover:bg-muted transition-all duration-200"
            )}
            aria-label="Clear search"
          >
            <X className="h-4 w-4" />
          </button>
        )}
        <div className="flex items-center justify-center pointer-events-none">
          <Search className="h-4 w-4 text-muted-foreground" />
        </div>
      </div>
    </div>
  );
}
