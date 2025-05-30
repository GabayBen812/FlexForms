import { flexRender, Table } from "@tanstack/react-table";
import { TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ChevronDown, ChevronUp, ArrowLeft, ArrowRight } from "lucide-react";
import { GetDirection } from "@/lib/i18n";
import { TableAction } from "@/types/ui/data-table-types";
import Pagination from "./Pagination";
import { useTranslation } from "react-i18next";
import React from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { DataTablePaginationControls } from "./data-table-pagination-controls";

interface DataTableHeaderProps<T> {
  table: Table<T>;
  actions?: TableAction<T>[] | null;
  enableColumnReordering?: boolean;
  onColumnOrderChange?: (newOrder: string[]) => void;
  stickyColumnCount?: number;
  selectedRowCount?: number;
  enableRowSelection?: boolean;
  isPagination?: boolean;
}

function DataTableHeader<T>({
  table,
  actions,
  enableColumnReordering,
  stickyColumnCount,
  selectedRowCount,
  enableRowSelection,
  onColumnOrderChange,
  isPagination,
}: DataTableHeaderProps<T>) {
  const direction = GetDirection();
  const firstColumnRounding = direction ? "rounded-r-lg" : "rounded-l-lg";
  const lastColumnRounding = direction ? "rounded-l-lg" : "rounded-r-lg";
  const { t } = useTranslation();

  const moveColumn = (accessorKey: string, direction: "left" | "right") => {
    const currentOrder = table.getState().columnOrder;
    const currentIndex = currentOrder.indexOf(accessorKey);
    if (currentIndex < 3) return;
    const newIndex = direction === "left" ? currentIndex - 1 : currentIndex + 1;

    if (newIndex >= 0 && newIndex < currentOrder.length) {
      const newOrder = [...currentOrder];
      [newOrder[currentIndex], newOrder[newIndex]] = [
        newOrder[newIndex],
        newOrder[currentIndex],
      ];
      table.setColumnOrder(newOrder);
      onColumnOrderChange?.(newOrder);
    }
  };

  return (
    <TableHeader
      style={{
        position: "sticky",
        top: 0,
        zIndex: 30,
        backgroundColor: "var(--datatable-header)",
      }}
    >
      {table.getHeaderGroups().map((headerGroup) => (
        <TableRow key={headerGroup.id}>
          {headerGroup.headers.map((header, index) => {
            const stickyBg = "hsl(224, 29.60%, 27.80%)";
            const effectiveStickyColumnCount = stickyColumnCount ?? 0;
            const isSticky = index < effectiveStickyColumnCount;
            const columnId = header.column.id;
            const currentIndex = table.getState().columnOrder.indexOf(columnId);
            const isFirst = index === 0;
            let stickyStyles: React.CSSProperties = {};

            if (isSticky) {
              const columnsBefore = table
                .getVisibleFlatColumns()
                .slice(0, index);
              const rightOffset = columnsBefore.reduce(
                (sum, col) => sum + (col.getSize?.() ?? 0),
                0
              );

              stickyStyles = {
                position: "sticky",
                right: `${rightOffset}px`,
                zIndex: 25 - index,
                backgroundColor: stickyBg,
              };
            }

            // Special handling for actions column - insert after select column
            if (index === 1 && actions !== null) {
              return (
                <React.Fragment key={header.id}>
                  <TableHead
                    className={`text-white bg-primary-foreground`}
                    style={{
                      backgroundColor: "var(--datatable-header)",
                      width: "120px",
                      textAlign: "center",
                    }}
                  >
                    פעולות
                  </TableHead>
                  <TableHead
                    className={`bg-primary-foreground text-white text-center`}
                    style={{
                      width: header.getSize(),
                      backgroundColor: "var(--datatable-header)",
                      padding: "0.5rem 0.25rem",
                      ...stickyStyles,
                    }}
                  >
                    <div className="flex items-center justify-between group h-full">
                      {enableColumnReordering && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            moveColumn(columnId, "left");
                          }}
                          className="hover:bg-gray-100/20 p-1 rounded opacity-0 group-hover:opacity-100 transition-opacity"
                          disabled={currentIndex === 0}
                        >
                          <ArrowRight className="h-4 w-4" />
                        </button>
                      )}

                      <div
                        className={`flex flex-col justify-center items-center gap-1 ${
                          header.column.getCanSort() &&
                          "cursor-pointer select-none"
                        } whitespace-normal text-balance text-center`}
                        onClick={header.column.getToggleSortingHandler()}
                        style={{
                          width: "100%",
                          padding: "0.5rem 0.25rem",
                          lineHeight: "1.2",
                          maxHeight: "5em",
                        }}
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

                      {enableColumnReordering && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            moveColumn(columnId, "right");
                          }}
                          className="hover:bg-gray-100/20 p-1 rounded opacity-0 group-hover:opacity-100 transition-opacity"
                          disabled={
                            currentIndex ===
                            table.getState().columnOrder.length - 1
                          }
                        >
                          <ArrowLeft className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </TableHead>
                </React.Fragment>
              );
            }

            // Skip rendering actions column since we handle it above
            if (index === 1 && actions !== null) {
              return null;
            }
            const lastIndex = headerGroup.headers.length - 1;
            const isLast = index === lastIndex;
            return (
              <TableHead
                key={header.id}
                className={`bg-primary-foreground text-white text-center ${
                  isFirst && direction
                    ? "rounded-r-lg"
                    : isFirst && !direction
                    ? "rounded-l-lg"
                    : ""
                } ${
                  isLast && direction
                    ? "rounded-l-lg"
                    : isLast && !direction
                    ? "rounded-r-lg"
                    : ""
                }`}
                style={{
                  width: header.getSize(),
                  backgroundColor: "var(--datatable-header)",
                  padding: "0.5rem 0.25rem",
                  textAlign: "center",
                  ...stickyStyles,
                }}
              >
                <div className="flex items-center justify-between group h-full">
                  {enableColumnReordering && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        moveColumn(columnId, "left");
                      }}
                      className="hover:bg-gray-100/20 p-1 rounded opacity-0 group-hover:opacity-100 transition-opacity"
                      disabled={currentIndex === 0}
                    >
                      <ArrowRight className="h-4 w-4" />
                    </button>
                  )}

                  <div
                    className={`flex flex-col justify-center items-center gap-1 ${
                      header.column.getCanSort() && "cursor-pointer select-none"
                    } ${isFirst && "px-8"}
    whitespace-normal text-balance text-center`}
                    onClick={header.column.getToggleSortingHandler()}
                    style={{
                      width: "100%",
                      padding: "0.5rem 0.25rem",
                      lineHeight: "1.2",
                      maxHeight: "5em",
                    }}
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

                    {isFirst && enableRowSelection && (
                      <div className="flex items-center justify-center gap-2 mt-1">
                        <Checkbox
                          checked={table.getIsAllPageRowsSelected()}
                          onCheckedChange={(value) =>
                            table.toggleAllPageRowsSelected(!!value)
                          }
                          className="border-white"
                        />
                        <span className="text-xs text-white">
                          {selectedRowCount} {t("selected")}
                        </span>
                      </div>
                    )}
                  </div>

                  {enableColumnReordering && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        moveColumn(columnId, "right");
                      }}
                      className="hover:bg-gray-100/20 p-1 rounded opacity-0 group-hover:opacity-100 transition-opacity"
                      disabled={
                        currentIndex === table.getState().columnOrder.length - 1
                      }
                    >
                      <ArrowLeft className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </TableHead>
            );
          })}
          {/* Pagination controls in header */}
          {isPagination && (
            <TableHead
              className="bg-primary-foreground text-white text-center"
              style={{
                backgroundColor: "var(--datatable-header)",
                borderTopLeftRadius: direction ? "0.5rem" : undefined,
                borderBottomLeftRadius: direction ? "0.5rem" : undefined,
                borderTopRightRadius: !direction ? "0.5rem" : undefined,
                borderBottomRightRadius: !direction ? "0.5rem" : undefined,
                padding: 0,
                width: "150px",
                maxWidth: "150px",
              }}
              colSpan={2}
            >
              <DataTablePaginationControls
                table={table}
                isPagination={isPagination}
              />
            </TableHead>
          )}
        </TableRow>
      ))}
    </TableHeader>
  );
}

export default DataTableHeader;
