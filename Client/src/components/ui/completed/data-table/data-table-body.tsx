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
import { Ghost, MoreVertical, Pencil, Trash, Copy, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/Input";
import { Checkbox } from "@/components/ui/checkbox";
import DataTableBodyRowExpanded from "./data-table-body-row-expanded";
import { ExpandedContentProps, TableAction } from "@/types/ui/data-table-types";
import { DataTableLoading } from "./data-table-loading";
import { GetDirection } from "@/lib/i18n";
import { useTranslation } from "react-i18next";
import { formatDateForDisplay, formatDateForEdit, parseDateForSubmit, isDateValue } from "@/lib/dateUtils";
import { MultiSelect } from "@/components/ui/multi-select";
import { AddressInput } from "@/components/ui/address-input";
import { cn } from "@/lib/utils";
import { isValidIsraeliID } from "@/lib/israeliIdValidator";
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

// Colors for chips display
const chipColors = [
  "bg-pink-100 text-pink-800 border-pink-200",
  "bg-blue-100 text-blue-800 border-blue-200",
  "bg-green-100 text-green-800 border-green-200",
  "bg-orange-100 text-orange-800 border-orange-200",
  "bg-red-100 text-red-800 border-red-200",
  "bg-purple-100 text-purple-800 border-purple-200",
  "bg-yellow-100 text-yellow-800 border-yellow-200",
  "bg-indigo-100 text-indigo-800 border-indigo-200",
];

// Component to display relationship chips
function RelationshipChipsDisplay({ 
  values, 
  options, 
  onClick 
}: { 
  values: string[]; 
  options: { value: string; label: string }[];
  onClick?: (e?: React.MouseEvent) => void;
}) {
  const labels = values
    .map((value) => options.find((opt) => opt.value === value)?.label)
    .filter(Boolean);

  if (labels.length === 0) {
    return (
      <div
        onClick={onClick}
        className="cursor-pointer px-2 py-1 rounded min-h-[1.5rem]"
      />
    );
  }

  return (
    <div
      onClick={onClick}
      className="cursor-pointer hover:bg-gray-100 px-2 py-1 rounded min-h-[1.5rem] transition-colors flex flex-wrap gap-1 justify-center items-center"
    >
      {labels.map((label, index) => (
        <div
          key={values[index]}
          className={cn(
            "flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium border",
            chipColors[index % chipColors.length]
          )}
        >
          <span>{label}</span>
        </div>
      ))}
    </div>
  );
}

// Relationship Editable Cell Component
function RelationshipEditableCell<T>({
  cell,
  row,
  onSave,
  isEditing,
  onEdit,
  onCancel,
}: EditableCellProps<T>) {
  const columnDef = cell.column.columnDef;
  const accessorKey = (columnDef as any).accessorKey as string;
  const meta = (columnDef as any).meta || {};
  const relationshipOptions = meta.relationshipOptions || [];
  
  const cellValue = cell.getValue();
  const currentValues = Array.isArray(cellValue) 
    ? cellValue.map((v: any) => typeof v === 'string' ? v : (v?._id || v?.toString() || v))
    : [];
  const [selectedValues, setSelectedValues] = useState<string[]>(currentValues);

  useEffect(() => {
    if (isEditing) {
      setSelectedValues(currentValues);
    }
  }, [isEditing, cellValue]);

  const handleSave = () => {
    onSave({ [accessorKey]: selectedValues });
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
        className={cn(
          "cursor-pointer group relative px-2 py-1 rounded min-h-[1.5rem] transition-all duration-200",
          "hover:bg-blue-50 hover:border hover:border-blue-200 hover:shadow-sm"
        )}
        onClick={(e) => {
          e.stopPropagation();
          onEdit();
        }}
      >
        <RelationshipChipsDisplay
          values={currentValues}
          options={relationshipOptions}
        />
        <Pencil className="w-3.5 h-3.5 text-blue-400 opacity-0 group-hover:opacity-100 transition-opacity duration-200 absolute top-1 right-1" />
      </div>
    );
  }

  return (
    <div
      className="w-full"
      onKeyDown={handleKeyDown}
      onClick={(e) => e.stopPropagation()}
    >
      <MultiSelect
        options={relationshipOptions}
        selected={selectedValues}
        onSelect={setSelectedValues}
        placeholder="בחר אפשרויות..."
        className="w-full"
      />
      <div className="flex gap-2 mt-2 justify-end">
        <Button
          size="sm"
          variant="outline"
          onClick={(e) => {
            e.stopPropagation();
            onCancel();
          }}
          className="h-6 text-xs"
        >
          ביטול
        </Button>
        <Button
          size="sm"
          onClick={(e) => {
            e.stopPropagation();
            handleSave();
          }}
          className="h-6 text-xs"
        >
          שמור
        </Button>
      </div>
    </div>
  );
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
  const [optimisticCheckboxValue, setOptimisticCheckboxValue] = useState<boolean | null>(null);
  const { t } = useTranslation();

  const columnDef = cell.column.columnDef;
  const accessorKey = (columnDef as any).accessorKey as string;
  const meta = (columnDef as any).meta || {};
  const fieldType = meta.fieldType;
  const options = meta.options;
  const isDate = meta.isDate || isDateValue(cell.getValue());
  const isTime = meta.isTime;
  const isMoney = meta.isMoney;
  const isDynamic = accessorKey?.startsWith("dynamicFields.");
  
  // Get the current value
  const cellValue = cell.getValue();
  const displayValue = isDate ? formatDateForDisplay(cellValue) : 
                      isTime ? (cellValue || "") :
                      isMoney ? (cellValue ? `₪${parseFloat(cellValue).toLocaleString('he-IL', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}` : "") :
                      fieldType === "CHECKBOX" ? (cellValue === true || cellValue === "true" || cellValue === "1" ? "✓" : "") :
                      fieldType === "MULTI_SELECT" && Array.isArray(cellValue) ? cellValue.join(", ") :
                      (cellValue ?? "");

  useEffect(() => {
    if (isEditing) {
      // Set initial value when editing starts
      if (isDate && cellValue) {
        setValue(formatDateForEdit(cellValue));
      } else if (fieldType === "MULTI_SELECT" && Array.isArray(cellValue)) {
        setValue(cellValue.join(","));
      } else if (fieldType === "CHECKBOX") {
        setValue(cellValue === true || cellValue === "true" || cellValue === "1" ? "true" : "false");
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
  }, [isEditing, cellValue, isDate, fieldType]);

  // Sync optimistic checkbox value with server value when it updates
  useEffect(() => {
    if (fieldType === "CHECKBOX" && optimisticCheckboxValue !== null) {
      const serverValue = cellValue === true || cellValue === "true" || cellValue === "1";
      // If server value matches our optimistic value, clear optimistic (server confirmed)
      if (serverValue === optimisticCheckboxValue) {
        setOptimisticCheckboxValue(null);
      }
    }
  }, [cellValue, fieldType, optimisticCheckboxValue]);

  const handleSave = () => {
    let processedValue: any = value;
    
    // Validate Israeli ID if editing idNumber field
    if (accessorKey === "idNumber" && processedValue && processedValue.trim() !== "") {
      if (!isValidIsraeliID(processedValue)) {
        alert(t("invalid_israeli_id") || "תעודת זהות לא תקינה. אנא בדוק את המספר שהוזן.");
        // Clear the invalid value and cancel editing
        setValue("");
        onCancel();
        return;
      }
    }
    
    // Process date values
    if (isDate && value) {
      processedValue = parseDateForSubmit(value) || value;
    }
    
    // Process time values - ensure HH:MM format
    if (isTime && value) {
      // Validate and format time as HH:MM
      const timeRegex = /^([0-1][0-9]|2[0-3]):([0-5][0-9])$/;
      if (!timeRegex.test(value)) {
        alert(t("invalid_time_format") || "פורמט זמן לא תקין. אנא השתמש בפורמט HH:MM");
        return;
      }
      processedValue = value;
    }
    
    // Process money values - remove currency symbols and format
    if (isMoney && value) {
      // Remove any non-digit characters except decimal point
      const numericValue = value.toString().replace(/[^\d.]/g, '');
      processedValue = numericValue;
    }
    
    // Process checkbox values - convert to boolean
    if (fieldType === "CHECKBOX") {
      processedValue = value === "true" || value === "1" || String(value) === "true";
    }
    
    // Process multi-select values - ensure array format
    if (fieldType === "MULTI_SELECT") {
      if (Array.isArray(value)) {
        processedValue = value;
      } else if (typeof value === "string") {
        // Try to parse as JSON array, otherwise treat as comma-separated
        try {
          processedValue = JSON.parse(value);
        } catch {
          processedValue = value.split(',').map(v => v.trim()).filter(Boolean);
        }
      } else {
        processedValue = [];
      }
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
    // For checkbox fields, show an actual checkbox component and allow direct editing
    if (fieldType === "CHECKBOX") {
      // Use optimistic value if set, otherwise use cellValue
      const checked = optimisticCheckboxValue !== null 
        ? optimisticCheckboxValue 
        : (cellValue === true || cellValue === "true" || cellValue === "1");
      
      return (
        <div
          className={cn(
            "cursor-pointer group relative px-2 py-1 rounded min-h-[1.5rem] transition-all duration-200",
            "hover:bg-blue-50 hover:border hover:border-blue-200 hover:shadow-sm",
            "flex items-center justify-center"
          )}
        >
          <Checkbox
            checked={checked}
            onCheckedChange={(newChecked) => {
              const newValue = Boolean(newChecked);
              
              // Immediately update optimistic state (instant UI feedback)
              setOptimisticCheckboxValue(newValue);
              
              // Save to server in background
              if (isDynamic) {
                const fieldName = accessorKey.replace("dynamicFields.", "");
                const existingDynamicFields = (row.original as any).dynamicFields || {};
                onSave({ 
                  dynamicFields: { 
                    ...existingDynamicFields,
                    [fieldName]: newValue 
                  } 
                });
              } else {
                onSave({ [accessorKey]: newValue });
              }
            }}
            onClick={(e) => {
              e.stopPropagation();
            }}
            className="cursor-pointer"
          />
        </div>
      );
    }
    
    return (
      <div
        onClick={(e) => {
          e.stopPropagation();
          onEdit();
        }}
        className={cn(
          "cursor-pointer group relative px-2 py-1 rounded min-h-[1.5rem] transition-all duration-200",
          "hover:bg-blue-50 hover:border hover:border-blue-200 hover:shadow-sm",
          "hover:font-medium",
          isMoney ? "font-semibold text-lg text-orange-700" : ""
        )}
      >
        <div className="flex items-center justify-center gap-1.5">
          <span className="group-hover:text-blue-700 transition-colors">
            {displayValue}
          </span>
          <Pencil className="w-3.5 h-3.5 text-blue-400 opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
        </div>
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

  if (fieldType === "MULTI_SELECT" && options) {
    const selectedValues = Array.isArray(value) ? value : (typeof value === "string" && value ? value.split(',').map(v => v.trim()) : []);
    return (
      <div onClick={(e) => e.stopPropagation()} className="w-full">
        <MultiSelect
          options={options}
          selected={selectedValues}
          onSelect={(values) => {
            setValue(values.join(","));
          }}
          placeholder={t("select_options") || "בחר אפשרויות..."}
          className="w-full"
        />
        <button
          onClick={handleSave}
          className="mt-2 text-xs text-primary hover:underline"
        >
          {t("save") || "שמור"}
        </button>
      </div>
    );
  }

  if (fieldType === "CHECKBOX") {
    const checked = value === "true" || value === "1" || String(value) === "true";
    return (
      <div onClick={(e) => e.stopPropagation()} className="flex items-center justify-center">
        <Checkbox
          checked={checked}
          onCheckedChange={(newChecked) => {
            setValue(newChecked ? "true" : "false");
            setTimeout(handleSave, 100); // Auto-save after change
          }}
          className="cursor-pointer"
        />
      </div>
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

  if (isTime) {
    return (
      <input
        ref={inputRef as React.RefObject<HTMLInputElement>}
        type="time"
        value={value || ""}
        onChange={(e) => setValue(e.target.value)}
        onBlur={handleSave}
        onKeyDown={handleKeyDown}
        className="w-full border border-primary rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-primary text-center"
        onClick={(e) => e.stopPropagation()}
      />
    );
  }

  if (isMoney) {
    const numericValue = typeof value === "number" ? value : (value ? parseFloat(value.toString().replace(/[^\d.]/g, '')) || 0 : 0);
    return (
      <div className="flex items-center gap-1 w-full" onClick={(e) => e.stopPropagation()}>
        <input
          ref={inputRef as React.RefObject<HTMLInputElement>}
          type="number"
          step="0.01"
          value={numericValue}
          onChange={(e) => setValue(e.target.value)}
          onBlur={handleSave}
          onKeyDown={handleKeyDown}
          className="flex-1 border border-primary rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-primary text-center"
          onClick={(e) => e.stopPropagation()}
        />
        <span className="text-sm font-medium">₪</span>
      </div>
    );
  }

  if (meta.fieldType === "ADDRESS") {
    return (
      <div onClick={(e) => e.stopPropagation()} className="w-full">
        <AddressInput
          value={value}
          onChange={(address) => setValue(address)}
          onBlur={handleSave}
          onKeyDown={handleKeyDown}
          placeholder={t("enter_address", "הכנס כתובת")}
          className="w-full"
        />
      </div>
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

    // Check if this is a relationship field
    const isRelationshipField = meta.relationshipOptions && Array.isArray(meta.relationshipOptions);

    // Check if this cell should be editable
    // Don't allow editing for selection column, action columns, or hidden columns
    const isEditable = accessorKey && 
      accessorKey !== "select" && 
      accessorKey !== "actions" &&
      !meta.hidden &&
      meta.editable !== false; // Allow explicit editable flag, default to true for regular columns
    
    const cellId = `${row.id}-${accessorKey}`;
    const isEditing = editingCell === cellId;

    // If it's a relationship field, use RelationshipEditableCell
    if (isRelationshipField && isEditable) {
      return (
        <RelationshipEditableCell
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

    // If it's a relationship field but not editable, just display chips
    if (isRelationshipField) {
      const currentValues = Array.isArray(value) 
        ? value.map((v: any) => typeof v === 'string' ? v : (v?._id || v?.toString() || v))
        : [];
      return (
        <RelationshipChipsDisplay
          values={currentValues}
          options={meta.relationshipOptions}
        />
      );
    }

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

    // Check if this is a money field
    const isMoney = meta.isMoney;
    
    if (isMoney && value) {
      const formattedValue = `₪${parseFloat(value).toLocaleString('he-IL', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
      return (
        <span className="font-semibold text-lg text-orange-700">
          {formattedValue}
        </span>
      );
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
