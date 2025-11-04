import React, { useState, useRef, useEffect } from "react";
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
import { Input } from "@/components/ui/Input";
import DataTableBodyRowExpanded from "./data-table-body-row-expanded";
import { ExpandedContentProps, TableAction } from "@/types/ui/data-table-types";
import { DataTableLoading } from "./data-table-loading";
import { GetDirection } from "@/lib/i18n";
import { useTranslation } from "react-i18next";
import { formatDateForDisplay, formatDateForEdit, parseDateForSubmit, isDateValue } from "@/lib/dateUtils";
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

interface EditableCellProps<T> {
  cell: any;
  row: Row<T>;
  table: Table<T>;
  onSave: (value: any) => void;
  isEditing: boolean;
  onEdit: () => void;
  onCancel: () => void;
}

function EditableCell<T>({
  cell,
  row,
  table,
  onSave,
  isEditing,
  onEdit,
  onCancel,
}: EditableCellProps<T>) {
  const inputRef = useRef<HTMLInputElement | HTMLSelectElement>(null);
  const [value, setValue] = useState<string>("");
  const { t } = useTranslation();

  const columnDef = cell.column.columnDef;
  const accessorKey = (columnDef as any).accessorKey as string;
  const meta = (columnDef as any).meta || {};
  const fieldType = meta.fieldType;
  const options = meta.options;
  const isDate = meta.isDate || isDateValue(cell.getValue());
  const isDynamic = accessorKey?.startsWith("dynamicFields.");
  
  // Get the current value
  const cellValue = cell.getValue();
  const displayValue = isDate ? formatDateForDisplay(cellValue) : (cellValue ?? "");

  useEffect(() => {
    if (isEditing) {
      // Set initial value when editing starts
      if (isDate && cellValue) {
        setValue(formatDateForEdit(cellValue));
      } else {
        setValue(String(cellValue ?? ""));
      }
      // Focus the input
      setTimeout(() => {
        inputRef.current?.focus();
        if (inputRef.current instanceof HTMLInputElement) {
          inputRef.current.select();
        }
      }, 0);
    }
  }, [isEditing, cellValue, isDate]);

  const handleSave = () => {
    let processedValue: any = value;
    
    // Process date values
    if (isDate && value) {
      processedValue = parseDateForSubmit(value) || value;
    }
    
    // Process dynamic fields - merge with existing dynamicFields
    if (isDynamic) {
      const fieldName = accessorKey.replace("dynamicFields.", "");
      const existingDynamicFields = (row.original as any).dynamicFields || {};
      onSave({ 
        dynamicFields: { 
          ...existingDynamicFields,
          [fieldName]: processedValue 
        } 
      });
    } else {
      onSave({ [accessorKey]: processedValue });
    }
    onCancel();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleSave();
    } else if (e.key === "Escape") {
      e.preventDefault();
      onCancel();
    }
  };

  if (!isEditing) {
    return (
      <div
        onClick={(e) => {
          e.stopPropagation();
          onEdit();
        }}
        className="cursor-pointer hover:bg-gray-100 px-2 py-1 rounded min-h-[1.5rem] transition-colors"
      >
        {displayValue || <span className="text-gray-400 italic">{t("click_to_edit") || "Click to edit"}</span>}
      </div>
    );
  }

  if (fieldType === "SELECT" && options) {
    return (
      <select
        ref={inputRef as React.RefObject<HTMLSelectElement>}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onBlur={handleSave}
        onKeyDown={handleKeyDown}
        className="w-full border border-primary rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-primary text-center"
        onClick={(e) => e.stopPropagation()}
      >
        {options.map((opt: any) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    );
  }

  if (isDate) {
    return (
      <input
        ref={inputRef as React.RefObject<HTMLInputElement>}
        type="text"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onBlur={handleSave}
        onKeyDown={handleKeyDown}
        placeholder="DD/MM/YYYY"
        pattern="\d{2}/\d{2}/\d{4}"
        className="w-full border border-primary rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-primary text-center"
        onClick={(e) => e.stopPropagation()}
      />
    );
  }

  // Determine input type based on field type
  let inputType = "text";
  if (accessorKey === "email" || meta.fieldType === "EMAIL") {
    inputType = "email";
  } else if (accessorKey === "phone" || meta.fieldType === "PHONE") {
    inputType = "tel";
  } else if (meta.fieldType === "NUMBER") {
    inputType = "number";
  }

  return (
    <input
      ref={inputRef as React.RefObject<HTMLInputElement>}
      type={inputType}
      value={value}
      onChange={(e) => setValue(e.target.value)}
      onBlur={handleSave}
      onKeyDown={handleKeyDown}
      className="w-full border border-primary rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-primary text-center"
      onClick={(e) => e.stopPropagation()}
    />
  );
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
  const { t } = useTranslation();
  const [editingCell, setEditingCell] = useState<string | null>(null);
  const firstColumnRounding = direction
    ? "rounded-r-lg px-8"
    : "rounded-l-lg px-8";
  const lastColumnRounding = direction ? "rounded-l-lg" : "rounded-r-lg";

  const renderCellContent = (cell: any) => {
    const value = cell.getValue();
    const columnDef = cell.column.columnDef;
    const accessorKey = (columnDef as any).accessorKey as string;
    const meta = (columnDef as any).meta || {};
    
    // Check if the column is explicitly marked as a date
    const isDateColumn = meta.isDate;

    // Check if this cell should be editable
    // Don't allow editing for selection column, action columns, or hidden columns
    const isEditable = accessorKey && 
      accessorKey !== "select" && 
      accessorKey !== "actions" &&
      !meta.hidden &&
      meta.editable !== false; // Allow explicit editable flag, default to true for regular columns
    
    const cellId = `${row.id}-${accessorKey}`;
    const isEditing = editingCell === cellId;

    // If cell is editable, render EditableCell
    if (isEditable) {
      return (
        <EditableCell
          cell={cell}
          row={row}
          table={table}
          onSave={(data) => {
            if (handleEdit) {
              handleEdit(row, data);
            }
          }}
          isEditing={isEditing}
          onEdit={() => setEditingCell(cellId)}
          onCancel={() => setEditingCell(null)}
        />
      );
    }

    // Otherwise, render normally
    if (isDateColumn || isDateValue(value)) {
      return formatDateForDisplay(value);
    }

    return flexRender(columnDef.cell, cell.getContext());
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
        if (meta?.handleDelete && (row.original.id || row.original._id)) {
          if (window.confirm(t("confirm_delete"))) {
            // @ts-ignore
            meta.handleDelete(row.original.id || row.original._id);
          }
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
        style={{ width: "100%", backgroundColor: "white", height: "auto" }}
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
                    padding: "0.5rem 1rem",
                  }}
                  className={`text-center data-table-row-cell ${roundedClass}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    if (onRowClick) {
                      onRowClick(row);
                    }
                  }}
                >
                  {renderCellContent(cell)}
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
                        className="text-red-500 hover:text-red-600 hover:bg-red-50 transition-colors duration-200"
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
                padding: "0.5rem 1rem",
              }}
              className={`text-center data-table-row-cell ${roundedClass}`}
              onClick={(e) => {
                e.stopPropagation();
                if (onRowClick) {
                  onRowClick(row);
                }
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


export default DataTableBody;
