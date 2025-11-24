// components/data-table/data-table-pagination-controls.tsx
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useTranslation } from "react-i18next";
import { Table } from "@tanstack/react-table";
import Pagination from "./Pagination";

interface DataTablePaginationControlsProps<TData> {
  table: Table<TData>;
  isPagination?: boolean;
  showPageSizeSelector?: boolean;
}

export const DataTablePaginationControls = <TData,>({
  table,
  isPagination,
  showPageSizeSelector = true,
}: DataTablePaginationControlsProps<TData>) => {
  const { t } = useTranslation();

  if (!isPagination) {
    return null;
  }

  return (
    <div className="flex items-center justify-between space-x-2 py-2 bg-primary-foreground rounded-lg text-white">
      <Pagination table={table} />
      {showPageSizeSelector && (
        <div className="flex ltr:flex-row-reverse rtl:flex-row gap-4 px-4 items-center space-x-2">
          <h1 className="text-sm">{t("showing")}</h1>
          <Select
            value={table.getState().pagination.pageSize.toString()}
            onValueChange={(value) => {
              table.setPageSize(Number(value));
            }}
          >
            <SelectTrigger className="h-fit w-fit border-none outline-none focus:ring-transparent">
              <SelectValue placeholder={table.getState().pagination.pageSize} />
            </SelectTrigger>
            <SelectContent>
              {[10, 20, 30, 40, 50].map((pageSize) => (
                <SelectItem key={pageSize} value={pageSize.toString()}>
                  {pageSize}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}
    </div>
  );
};
