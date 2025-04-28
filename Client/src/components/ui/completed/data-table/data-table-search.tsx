// components/data-table/data-table-search.tsx
import React from "react";
import { Input } from "@/components/ui/Input";
import { useTranslation } from "react-i18next";
import { Search } from "lucide-react";

interface DataTableSearchProps {
  globalFilter: string;
  setGlobalFilter: React.Dispatch<React.SetStateAction<string>>;
}

export const DataTableSearch = ({
  globalFilter,
  setGlobalFilter,
}: DataTableSearchProps) => {
  const { t } = useTranslation();
  return (
    <Input
      placeholder={t("search") + "..."}
      value={globalFilter ?? ""}
      icon={<Search className="text-secondary" />}
      onChange={(e) => setGlobalFilter(e.target.value)}
      className="max-w-sm min-w-64"
    />
  );
};
