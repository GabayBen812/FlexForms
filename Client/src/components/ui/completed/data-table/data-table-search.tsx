// components/data-table/data-table-search.tsx
import React from "react";
import { Input } from "@/components/ui/Input";
import { Search } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Table } from "@tanstack/react-table";

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

  return (
    <Input
      placeholder={t("search...", "חיפוש")}
      value={globalFilter ?? ""}
      onChange={(event) => setGlobalFilter(event.target.value)}
      iconEnd={<Search className="h-4 w-4 text-muted-foreground" />}
      className="w-[180px] lg:w-[260px] h-10 border border-border rounded-full bg-white shadow-sm focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all duration-200"
    />
  );
}
