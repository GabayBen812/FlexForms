import { flexRender, Table } from "@tanstack/react-table";
import { TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ChevronDown, ChevronUp, ArrowLeft, ArrowRight } from "lucide-react";
import { GetDirection } from "@/lib/i18n";
import { TableAction } from "@/types/ui/data-table-types";
import Pagination from "./Pagination";

interface DataTableHeaderProps<T> {
  table: Table<T>;
  actions?: TableAction<T>[] | null;
  enableColumnReordering?: boolean;
  onColumnOrderChange?: (newOrder: string[]) => void;
  stickyColumnCount?: number;
}

function DataTableHeader<T>({ 
  table,
  actions,
  enableColumnReordering,
  stickyColumnCount,
  onColumnOrderChange  
}: DataTableHeaderProps<T>) {
  const direction = GetDirection();
  const firstColumnRounding = direction ? "rounded-r-lg" : "rounded-l-lg";
  const lastColumnRounding = direction ? "rounded-l-lg" : "rounded-r-lg";

  const moveColumn = (accessorKey: string, direction: 'left' | 'right') => {
    const currentOrder = table.getState().columnOrder;
    const currentIndex = currentOrder.indexOf(accessorKey);
    if (currentIndex < 3) return;
    const newIndex = direction === 'left' ? currentIndex - 1 : currentIndex + 1;

    if (newIndex >= 0 && newIndex < currentOrder.length) {
      const newOrder = [...currentOrder];
      [newOrder[currentIndex], newOrder[newIndex]] = [newOrder[newIndex], newOrder[currentIndex]];
      table.setColumnOrder(newOrder);
      onColumnOrderChange?.(newOrder);
    }
  };

  return (
  <TableHeader
    style={{
      position: 'sticky',
      top: 0,
      zIndex: 30,
      backgroundColor: "var(--datatable-header)",
    }}>

    {table.getHeaderGroups().map((headerGroup) => (
    <TableRow key={headerGroup.id}>
      {headerGroup.headers.map((header, index) => {
        const stickyBg = "hsl(224, 29.60%, 27.80%)";
        console.log("stickyColumnCount1212", stickyColumnCount);
          const effectiveStickyColumnCount = stickyColumnCount ?? 0;
          const isSticky = index < effectiveStickyColumnCount;
          const columnId = header.column.id;
          const currentIndex = table.getState().columnOrder.indexOf(columnId);
          const isFirst = index === 0;
          let stickyStyles: React.CSSProperties = {};
        
          if (isSticky) {
            const columnsBefore = table.getVisibleFlatColumns().slice(0, index);
            const rightOffset = columnsBefore.reduce(
              (sum, col) => sum + (col.getSize?.() ?? 0) + (25-((index+1)*2)),
              0
            );
        
            stickyStyles = {
              position: "sticky",
              right: `${rightOffset}px`,
              zIndex: 25 + index,  
              backgroundColor: stickyBg,
            };
          }

         return (
            <TableHead
              className={`bg-primary-foreground text-white ${
                isFirst && firstColumnRounding
              }`}
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
                      moveColumn(columnId, 'left');
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
                    width: '100%',
                    padding: '0.5rem 0.25rem',
                    lineHeight: '1.2',
                    maxHeight: '5em', 
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
                      moveColumn(columnId, 'right');
                    }}
                    className="hover:bg-gray-100/20 p-1 rounded opacity-0 group-hover:opacity-100 transition-opacity"
                    disabled={currentIndex === table.getState().columnOrder.length - 1}
                  >
                    <ArrowLeft className="h-4 w-4" />
                  </button>
                )}
              </div>
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