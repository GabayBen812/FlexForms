import { flexRender, Table } from "@tanstack/react-table";
import { TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ChevronDown, ChevronUp } from "lucide-react";
import { GetDirection } from "@/lib/i18n";
import { TableAction } from "@/types/ui/data-table-types";
import Pagination from "./Pagination";

interface DataTableHeaderProps<T> {
  table: Table<T>;
  actions?: TableAction<T>[] | null;
}

function DataTableHeader<T>({ table, actions }: DataTableHeaderProps<T>) {
  const direction = GetDirection();
  const firstColumnRounding = direction ? "rounded-r-lg" : "rounded-l-lg";
  const lastColumnRounding = direction ? "rounded-l-lg" : "rounded-r-lg";
  return (
    <TableHeader>
      {table.getHeaderGroups().map((headerGroup) => (
        <TableRow key={headerGroup.id} className="border-none h-11">
          {headerGroup.headers.map((header, index) => {
            const isFirst = index === 0;
            return (
              <TableHead
                key={header.id}
                className={`bg-primary-foreground text-white whitespace-nowrap ${
                  isFirst && firstColumnRounding
                }`}
                style={{ width: header.getSize(), backgroundColor: "var(--datatable-header)" }}
              >
                {!header.isPlaceholder && (
                  <div
                    className={`flex items-center gap-1 ${
                      header.column.getCanSort() && "cursor-pointer select-none"
                    } ${isFirst && "px-8"}`}
                    onClick={header.column.getToggleSortingHandler()}
                  >
                    {flexRender(
                      header.column.columnDef.header,
                      header.getContext()
                    )}
                    {header.column.getCanSort() &&
                      (header.column.getIsSorted() === "asc" ? (
                        <ChevronUp className="h-4 w-4" />
                      ) : header.column.getIsSorted() === "desc" ? (
                        <ChevronDown className="h-4 w-4" />
                      ) : null)}
                  </div>
                )}
              </TableHead>
            );
          })}
          {actions && (
            <TableHead
              className={`text-white bg-primary-foreground ${lastColumnRounding}`}
              style={{ backgroundColor: "var(--datatable-header)" }}
            >
              <div className="flex w-full justify-end">
                <Pagination table={table} />
              </div>
            </TableHead>
          )}
        </TableRow>
      ))}
    </TableHeader>
  );
}

export default DataTableHeader;
