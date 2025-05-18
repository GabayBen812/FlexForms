import React from "react";
import {
  ColumnDef,
  flexRender,
  Row,
  CellContext,
  Table,
} from "@tanstack/react-table";
import { TableBody, TableCell, TableRow } from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Ghost, MoreVertical } from "lucide-react";
import { Button } from "@/components/ui/button";
import DataTableBodyRowExpanded from "./data-table-body-row-expanded";
import { ExpandedContentProps, TableAction } from "@/types/ui/data-table-types";
import { DataTableLoading } from "./data-table-loading";
import { GetDirection } from "@/lib/i18n";
import { useTranslation } from "react-i18next";

interface DataTableBodyProps<T> {
  specialRow: "add" | null;
  setSpecialRow: React.Dispatch<React.SetStateAction<"add" | null>>;
  table: Table<T>;
  actions?: TableAction<T>[] | null;
  columns: ColumnDef<T>[];
  renderExpandedContent?: (props: ExpandedContentProps<T>) => React.ReactNode;
  handleSave: (newData: Partial<T>) => void;
  handleEdit: (row: Partial<T>) => void;
  isLoading: boolean;
  onRowClick?: (row: Row<T>) => void;
}

interface RowComponentProps<T> {
  row: Row<T>;
  table: Table<T>;
  actions?: TableAction<T>[] | null;
  renderExpandedContent?: (props: ExpandedContentProps<T>) => React.ReactNode;
  isExpanded: boolean;
  handleEdit?: (row: Partial<T>) => void;
  columns: ColumnDef<T, ColumnDef<T>>[];
  handleSave: (newData: Partial<T>) => void;
  onRowClick?: (row: Row<T>) => void;
}

const RowComponent = React.memo(function RowComponent<T>({
  row,
  table,
  actions,
  renderExpandedContent,
  isExpanded,
  columns,
  handleEdit,
  handleSave,
  onRowClick,
}: RowComponentProps<T>) {
  const direction = GetDirection();
  const firstColumnRounding = direction
    ? "rounded-r-lg px-8"
    : "rounded-l-lg px-8";
  const lastColumnRounding = direction ? "rounded-l-lg" : "rounded-r-lg";

  return (
    <>
      <TableRow
        key={row.id}
        id={row.id}
        className={`${
          isExpanded ? "relative z-[51] pointer-events-none" : ""
        } border-b-4 border-background group cursor-pointer transition-colors h-[3.75rem]`}
        onClick={() => (onRowClick ? onRowClick(row) : row.toggleExpanded())}
      >
        {row.getVisibleCells().map((cell, index) => {
          const accessorKey = cell.column.columnDef.accessorKey as string;
          const isName = accessorKey === "clubName";
          const isNumber = accessorKey === "clubNumber";
          const stickyBg = "hsl(0, 0.00%, 100.00%)";
          // חישוב רוחב name במידה וזה מספר
         let rightOffset = 0;
          if (isNumber) {
            const nameCol = table.getVisibleFlatColumns().find(
              (col) => col.columnDef.accessorKey === "clubName"
            );
            rightOffset = (nameCol?.getSize?.() ?? 0) + 26;
          }

          const stickyStyles =
            isName || isNumber
              ? {
                  position: "sticky",
                  right: isName ? 0 : rightOffset,
                  zIndex: isNumber ? 24 : 23,
                  backgroundColor: stickyBg,
                  
                }
              : {};

          return (
            <TableCell
              className={`bg-white text-primary text-base font-normal border-b-4 border-background w-auto whitespace-nowrap transition-colors ${
                index === 0 ? firstColumnRounding : "rounded-b-[1px]"
              }`}
              key={cell.id}
              style={stickyStyles}
            >
              {flexRender(
                cell.column.columnDef.cell,
                cell.getContext() as CellContext<T, unknown>
              )}
            </TableCell>
          );
        })}
        {actions && (
          <TableCell
            className={`bg-white transition-colors group-hover:bg-muted ${lastColumnRounding} border-b-4 border-background text-left whitespace-nowrap rtl:text-left ltr:text-right`}
          >
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  className="h-8 w-8 p-0"
                  aria-label="Open menu"
                >
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {actions.map((action, index) => (
                  <DropdownMenuItem
                    key={index}
                    onClick={(e: React.MouseEvent) => {
                      e.stopPropagation();
                      if (action.onClick) action.onClick(row);
                    }}
                  >
                    {action.label}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </TableCell>
        )}
      </TableRow>

      {renderExpandedContent && (
        <DataTableBodyRowExpanded
          isExpanded={isExpanded}
          row={row}
          actions={actions}
          renderExpandedContent={renderExpandedContent}
          columns={columns}
          handleEdit={handleEdit}
        />
      )}
    </>
  );
}) as <T>(props: RowComponentProps<T>) => React.ReactElement;

function DataTableBody<T>({
  table,
  actions,
  columns,
  renderExpandedContent,
  specialRow,
  setSpecialRow,
  handleSave,
  handleEdit,
  isLoading,
  onRowClick,
}: DataTableBodyProps<T>) {
  const rows = table.getRowModel().rows;
  const hasData = rows.length > 0;
  const showAddRow = specialRow === "add";
  return (
    <TableBody className="before:content-['@'] before:block before:h-[10px] before:invisible">
      {showAddRow && (
        <DataTableBodyRowExpanded
          isExpanded={true}
          actions={null}
          columns={table.getVisibleFlatColumns()}
          renderExpandedContent={renderExpandedContent}
          onBackdropClick={() => setSpecialRow(null)}
          handleSave={handleSave}
          handleEdit={handleEdit}
        />
      )}
      {isLoading ? (
        <DataTableLoading colSpan={columns.length + (actions ? 1 : 0)} />
      ) : hasData ? (
        table
          .getRowModel()
          .rows.map((row) => (
            <RowComponent<T>
              key={row.id}
              row={row}
              table={table}
              actions={actions}
              renderExpandedContent={renderExpandedContent}
              isExpanded={row.getIsExpanded()}
              columns={columns}
              handleSave={handleSave}
              handleEdit={handleEdit}
              onRowClick={onRowClick}
            />
          ))
      ) : (
        <NoResultsRow colSpan={columns.length + (actions ? 1 : 0)} />
      )}
    </TableBody>
  );
}

function NoResultsRow({ colSpan }: { colSpan: number }) {
  const { t } = useTranslation();
  return (
    <TableRow>
      <TableCell colSpan={colSpan} className="h-[clamp(12rem,22vh,18rem)]">
        <div className="w-full flex flex-col justify-end items-center h-full gap-4">
          <Ghost size={64} className="text-secondary" />
          <div className="text-center max-w-64">
            <p className="font-medium">{t("no_results_title")}</p>
            <p className="text-secondary">{t("no_results_description")} </p>
          </div>
        </div>
      </TableCell>
    </TableRow>
  );
}
export default DataTableBody;
