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
import { Ghost, MoreVertical, Pencil, Trash, Copy } from "lucide-react";
import { Button } from "@/components/ui/button";
import DataTableBodyRowExpanded from "./data-table-body-row-expanded";
import { ExpandedContentProps, TableAction } from "@/types/ui/data-table-types";
import { DataTableLoading } from "./data-table-loading";
import { GetDirection } from "@/lib/i18n";
import { useTranslation } from "react-i18next";
import dayjs from "dayjs";

interface BaseData {
  id?: string | number;
}

interface DataTableBodyProps<T extends BaseData> {
  specialRow: "add" | null;
  setSpecialRow: React.Dispatch<React.SetStateAction<"add" | null>>;
  table: Table<T>;
  actions?: TableAction<T>[] | null;
  stickyColumnCount?: number;
  columns: ColumnDef<T>[];
  renderExpandedContent?: (props: ExpandedContentProps<T>) => React.ReactNode;
  handleSave: (newData: Partial<T>) => void;
  handleEdit: (row: Row<T>, data: Partial<T>) => void;
  isLoading: boolean;
  onRowClick?: (row: Row<T>) => void;
  showActionColumn?: boolean;
  showEditButton?: boolean;
  showDeleteButton?: boolean;
  showDuplicateButton?: boolean;
}

interface RowComponentProps<T extends BaseData> {
  row: Row<T>;
  table: Table<T>;
  actions?: TableAction<T>[] | null;
  stickyColumnCount?: number;
  renderExpandedContent?: (props: ExpandedContentProps<T>) => React.ReactNode;
  isExpanded: boolean;
  handleEdit?: (row: Row<T>, data: Partial<T>) => void;
  columns: ColumnDef<T, ColumnDef<T>>[];
  handleSave: (newData: Partial<T>) => void;
  onRowClick?: (row: Row<T>) => void;
  showActionColumn?: boolean;
  showEditButton?: boolean;
  showDeleteButton?: boolean;
  showDuplicateButton?: boolean;
}

const RowComponent = React.memo(function RowComponent<T>({
  row,
  table,
  actions,
  stickyColumnCount,
  renderExpandedContent,
  isExpanded,
  columns,
  handleEdit,
  handleSave,
  onRowClick,
  showActionColumn,
  showEditButton,
  showDeleteButton,
  showDuplicateButton,
}: RowComponentProps<T>) {
  const direction = GetDirection();
  const firstColumnRounding = direction
    ? "rounded-r-lg px-8"
    : "rounded-l-lg px-8";
  const lastColumnRounding = direction ? "rounded-l-lg" : "rounded-r-lg";

  const renderCellContent = (cell: any) => {
    const value = cell.getValue();

    // Check if the column is explicitly marked as a date
    const isDateColumn = cell.column.columnDef?.meta?.isDate;

    // If column is marked as date or value matches date pattern
    if (isDateColumn || isDateString(value)) {
      return formatDateValue(value);
    }

    return flexRender(cell.column.columnDef.cell, cell.getContext());
  };

  const handleActionClick = (e: React.MouseEvent, action: string) => {
    e.stopPropagation();
    switch (action) {
      case "edit":
        row.toggleExpanded();
        break;
      case "delete":
        const meta = table.options.meta as any;
        // @ts-ignore
        if (meta?.handleDelete && row.original.id) {
          // @ts-ignore
          meta.handleDelete(row.original.id || row.original._id);
        }
        break;
      case "duplicate":
        const duplicateMeta = table.options.meta as any;
        if (duplicateMeta?.handleAdd) {
          const duplicateData = { ...row.original };
          // @ts-ignore
          delete duplicateData.id;
          // @ts-ignore
          delete duplicateData._id;
          duplicateMeta.handleAdd(duplicateData);
        }
        break;
    }
  };

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
        {/* First render the selection checkbox if it exists */}
        {row
          .getVisibleCells()
          .filter((cell) => cell.column.id === "select")
          .map((cell, index) => (
            <TableCell
              key={cell.id}
              className={`bg-white text-primary text-base font-normal border-b-4 border-background px-4 transition-colors text-center group-hover:bg-muted ${firstColumnRounding}`}
              style={{ textAlign: "center" }}
            >
              {renderCellContent(cell)}
            </TableCell>
          ))}

        {/* Then render the action buttons */}
        {showActionColumn && (
          <TableCell
            className={`bg-white transition-colors group-hover:bg-muted border-b-4 border-background text-center whitespace-nowrap`}
            style={{ width: "120px", textAlign: "center" }}
          >
            <div className="flex items-center justify-center gap-1">
              {showEditButton && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 w-7 p-0"
                  onClick={(e) => handleActionClick(e, "edit")}
                >
                  <Pencil className="h-3.5 w-3.5" />
                </Button>
              )}
              {showDeleteButton && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 w-7 p-0 hover:text-destructive"
                  onClick={(e) => handleActionClick(e, "delete")}
                >
                  <Trash className="h-3.5 w-3.5" />
                </Button>
              )}
              {showDuplicateButton && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 w-7 p-0"
                  onClick={(e) => handleActionClick(e, "duplicate")}
                >
                  <Copy className="h-3.5 w-3.5" />
                </Button>
              )}
            </div>
          </TableCell>
        )}

        {/* Finally render all other cells except the selection checkbox */}
        {row
          .getVisibleCells()
          .filter((cell) => cell.column.id !== "select")
          .map((cell, index) => {
            const stickyBg = "white";
            const effectiveStickyColumnCount = stickyColumnCount ?? 0;
            const isSticky = index < effectiveStickyColumnCount;

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
                textAlign: "center",
              };
            }

            return (
              <TableCell
                className={`bg-white text-primary text-base font-normal border-b-4 border-background px-4 transition-colors text-center group-hover:bg-muted ${
                  cell.column.id === "clubName"
                    ? "whitespace-normal break-words"
                    : "whitespace-nowrap"
                }`}
                key={cell.id}
                style={{
                  ...stickyStyles,
                  textAlign: "center",
                  ...(cell.column.id === "clubName"
                    ? {
                        minWidth: "160px",
                        maxWidth: "900px",
                        width: "850px",
                        whiteSpace: "normal",
                        wordBreak: "break-word",
                      }
                    : {}),
                }}
              >
                {renderCellContent(cell)}
              </TableCell>
            );
          })}
      </TableRow>

      {renderExpandedContent && (
        <DataTableBodyRowExpanded
          isExpanded={isExpanded}
          row={row}
          actions={actions}
          renderExpandedContent={renderExpandedContent}
          columns={columns}
          handleEdit={(data: Partial<T>) => handleEdit?.(row, data)}
        />
      )}
    </>
  );
}) as <T>(props: RowComponentProps<T>) => React.ReactElement;

function DataTableBody<T extends BaseData>({
  table,
  actions,
  columns,
  stickyColumnCount,
  renderExpandedContent,
  specialRow,
  setSpecialRow,
  handleSave,
  handleEdit,
  isLoading,
  onRowClick,
  showActionColumn,
  showEditButton,
  showDeleteButton,
  showDuplicateButton,
}: DataTableBodyProps<T>) {
  const rows = table.getRowModel().rows;
  const hasData = rows.length > 0;
  const showAddRow = specialRow === "add";

  const renderCellContent = (cell: any) => {
    const value = cell.getValue();

    // Check if the column is explicitly marked as a date
    const isDateColumn = cell.column.columnDef?.meta?.isDate;

    // If column is marked as date or value matches date pattern
    if (isDateColumn || isDateString(value)) {
      return formatDateValue(value);
    }

    return flexRender(cell.column.columnDef.cell, cell.getContext());
  };

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
          // @ts-ignore
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
              stickyColumnCount={stickyColumnCount}
              renderExpandedContent={renderExpandedContent}
              isExpanded={row.getIsExpanded()}
              columns={columns}
              handleSave={handleSave}
              handleEdit={handleEdit}
              onRowClick={onRowClick}
              showActionColumn={showActionColumn}
              showEditButton={showEditButton}
              showDeleteButton={showDeleteButton}
              showDuplicateButton={showDuplicateButton}
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

const isDateString = (value: any): boolean => {
  if (typeof value !== "string" && !(value instanceof Date)) return false;
  const dateStr = value instanceof Date ? value.toISOString() : value;

  // Common date formats to check
  const datePatterns = [
    /^\d{4}-\d{2}-\d{2}/, // YYYY-MM-DD
    /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/, // YYYY-MM-DDThh:mm
    /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/, // YYYY-MM-DDThh:mm:ss
    /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.\d{3}Z/, // ISO date
    /^\d{2}\/\d{2}\/\d{4}/, // DD/MM/YYYY
    /^\d{2}-\d{2}-\d{4}/, // DD-MM-YYYY
  ];

  return datePatterns.some((pattern) => pattern.test(dateStr));
};

const formatDateValue = (value: any): string => {
  if (!value) return "";
  try {
    return dayjs(value).format("DD/MM/YYYY");
  } catch {
    return value;
  }
};

export default DataTableBody;
