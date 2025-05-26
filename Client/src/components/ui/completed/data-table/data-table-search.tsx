// components/data-table/data-table-search.tsx
import React from "react";
import { Input } from "@/components/ui/Input";
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
    <div className="flex items-center">
      <Input
        placeholder={t("search...")}
        value={globalFilter ?? ""}
        onChange={(event) => setGlobalFilter(event.target.value)}
        className="h-8 w-[150px] lg:w-[250px]"
      />
    </div>
  );
}
