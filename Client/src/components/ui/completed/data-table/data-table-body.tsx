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
import "./data-table-row.css";

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
        data-state={row.getIsSelected() && "selected"}
        className="transition-colors cursor-pointer data-table-row"
        style={{ width: "100%", backgroundColor: "white" }}
      >
        {row.getVisibleCells().map((cell, cellIndex) => {
          const isFirst = cellIndex === 0;
          const isLast = cellIndex === row.getVisibleCells().length - 1;
          const effectiveStickyColumnCount = stickyColumnCount ?? 0;
          const isSticky = cellIndex < effectiveStickyColumnCount;
          const stickyBg = "white";

          let stickyStyles: React.CSSProperties = {};
          if (isSticky) {
            const columnsBefore = row
              .getVisibleCells()
              .slice(0, cellIndex)
              .map((cell) => cell.column);
            const rightOffset = columnsBefore.reduce(
              (sum, col) => sum + (col.getSize?.() ?? 0),
              0
            );

            stickyStyles = {
              position: "sticky",
              right: `${rightOffset}px`,
              zIndex: 20 - cellIndex,
              backgroundColor: stickyBg,
            };
          }

          // Border radius: rightmost for RTL, leftmost for LTR
          const roundedClass = direction
            ? isFirst
              ? "rounded-r-lg"
              : ""
            : isLast
            ? "rounded-l-lg"
            : "";

          // Render the first cell
          if (cellIndex === 0) {
            return (
              <React.Fragment key={cell.id}>
                <TableCell
                  style={{
                    ...stickyStyles,
                    width: cell.column.getSize(),
                    maxWidth: cell.column.getSize(),
                    padding: "1rem 1.5rem",
                  }}
                  className={`text-center data-table-row-cell ${roundedClass}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    if (onRowClick) {
                      onRowClick(row);
                    }
                  }}
                >
                  {flexRender(cell.column.columnDef.cell, cell.getContext())}
                </TableCell>
                {showActionColumn && (
                  <TableCell className="text-center data-table-row-cell">
                    {showEditButton && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={(e) => handleActionClick(e, "edit")}
                      >
                        <Pencil className="w-4 h-4" />
                      </Button>
                    )}
                    {showDeleteButton && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={(e) => handleActionClick(e, "delete")}
                      >
                        <Trash className="w-4 h-4" />
                      </Button>
                    )}
                    {showDuplicateButton && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={(e) => handleActionClick(e, "duplicate")}
                      >
                        <Copy className="w-4 h-4" />
                      </Button>
                    )}
                  </TableCell>
                )}
              </React.Fragment>
            );
          }
          // Skip rendering the second cell if showActionColumn is true (to keep columns aligned)
          if (showActionColumn && cellIndex === 1) return null;
          // Render the rest of the cells
          return (
            <TableCell
              key={cell.id}
              style={{
                ...stickyStyles,
                width: cell.column.getSize(),
                maxWidth: cell.column.getSize(),
                padding: "1rem 1.5rem",
              }}
              className={`text-center data-table-row-cell ${roundedClass}`}
              onClick={(e) => {
                e.stopPropagation();
                if (onRowClick) {
                  onRowClick(row);
                }
              }}
            >
              {flexRender(cell.column.columnDef.cell, cell.getContext())}
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
  const { t } = useTranslation();

  const rows = table.getRowModel().rows;
  const hasData = rows.length > 0;
  const showAddRow = specialRow === "add";

  return (
    <TableBody>
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
        table.getRowModel().rows.map((row) => (
          <React.Fragment key={row.id}>
            <RowComponent
              row={row}
              table={table}
              actions={actions}
              stickyColumnCount={stickyColumnCount}
              renderExpandedContent={renderExpandedContent}
              isExpanded={row.getIsExpanded()}
              columns={columns}
              handleEdit={handleEdit}
              handleSave={handleSave}
              onRowClick={onRowClick}
              showActionColumn={showActionColumn}
              showEditButton={showEditButton}
              showDeleteButton={showDeleteButton}
              showDuplicateButton={showDuplicateButton}
            />
            {row.getIsExpanded() && renderExpandedContent && (
              <DataTableBodyRowExpanded
                // @ts-ignore
                row={row}
                colSpan={columns.length + (showActionColumn ? 1 : 0)}
                renderExpandedContent={renderExpandedContent}
                // @ts-ignore
                handleEdit={handleEdit}
              />
            )}
          </React.Fragment>
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
