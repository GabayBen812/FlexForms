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
import { Ghost, MoreVertical, Pencil, Copy, X, Download, Mail, Phone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { TableEditButton } from "./TableEditButton";
import { Input } from "@/components/ui/Input";
import { Checkbox } from "@/components/ui/checkbox";
import DataTableBodyRowExpanded from "./data-table-body-row-expanded";
import { ExpandedContentProps, TableAction } from "@/types/ui/data-table-types";
import { DataTableLoading } from "./data-table-loading";
import { GetDirection } from "@/lib/i18n";
import { useTranslation } from "react-i18next";
import { formatDateForDisplay, formatDateForEdit, parseDateForSubmit, isDateValue } from "@/lib/dateUtils";
import { formatPhoneNumber, unformatPhoneNumber } from "@/lib/phoneUtils";
import { MultiSelect } from "@/components/ui/multi-select";
import { AddressInput } from "@/components/ui/address-input";
import { cn } from "@/lib/utils";
import { isValidIsraeliID } from "@/lib/israeliIdValidator";
import { showError, showConfirm } from "@/utils/swal";
import { handleImageUpload, uploadFile } from "@/lib/imageUtils";
import { ImagePreviewModal } from "./ImagePreviewModal";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import "./data-table-row.css";
import { getBadgeColors } from "@/lib/colorUtils";
import { normalizeDynamicFieldChoices } from "@/utils/tableFieldUtils";

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

const relationshipChipClass =
  "bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800";

const multiSelectChipClass =
  "bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-200 dark:border-emerald-800";

type RelationshipOption = {
  value: string;
  label: string;
  color?: string;
  [key: string]: unknown;
};

type RelationshipChipRendererArgs = {
  value: string;
  label: string;
  option?: RelationshipOption;
  DefaultChip: (props?: React.HTMLAttributes<HTMLDivElement>) => React.ReactNode;
};

type RelationshipChipRenderer = (args: RelationshipChipRendererArgs) => React.ReactNode;

// Component to display relationship chips
function RelationshipChipsDisplay({
  values,
  options,
  onClick,
  renderChip,
}: {
  values: string[];
  options: RelationshipOption[];
  onClick?: (e?: React.MouseEvent) => void;
  renderChip?: RelationshipChipRenderer;
}) {
  const resolvedValues = values
    .map((value) => {
      const option = options.find((opt) => opt.value === value);
      if (!option) {
        return null;
      }
      return {
        value,
        option,
        label: option.label,
      };
    })
    .filter((item): item is { value: string; option: RelationshipOption; label: string } => !!item?.label);

  if (!resolvedValues.length) {
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
      {resolvedValues.map(({ value, option, label }) => {
        const DefaultChip = ({
          className,
          ...chipProps
        }: React.HTMLAttributes<HTMLDivElement> = {}) => (
        <div
          className={cn(
            "flex items-center gap-1 px-2 py-0.5 rounded-full text-sm font-medium border",
            relationshipChipClass,
            className,
          )}
          {...chipProps}
        >
          <span>{label}</span>
        </div>
        );

        const chipNode = renderChip
          ? renderChip({
              value,
              label,
              option,
              DefaultChip,
            })
          : DefaultChip();

        return <React.Fragment key={value}>{chipNode}</React.Fragment>;
      })}
    </div>
  );
}

function MultiSelectChipsDisplay({
  values,
  options,
}: {
  values: unknown[];
  options?: { value: string; label: string; color?: string }[];
}) {
  const normalizedValues = Array.isArray(values) ? values : [];

  const chips = normalizedValues
    .map((value) => {
      if (typeof value === "object" && value !== null) {
        const objectValue = value as Record<string, unknown>;
        const candidate =
          (typeof objectValue.label === "string" && objectValue.label) ||
          (typeof objectValue.name === "string" && objectValue.name) ||
          (typeof objectValue.value === "string" && objectValue.value) ||
          (typeof objectValue._id === "string" && objectValue._id);

        if (candidate) {
          const matchedOption = options?.find((opt) => opt.value === candidate);
          return {
            label: matchedOption?.label ?? candidate,
            value: candidate,
            color: matchedOption?.color,
          };
        }
      }

      if (value == null) {
        return null;
      }

      const stringValue = String(value);
      const matchedOption = options?.find((opt) => opt.value === stringValue);
      return {
        label: matchedOption?.label ?? stringValue,
        value: stringValue,
        color: matchedOption?.color,
      };
    })
    .filter((chip) => Boolean(chip && chip.label && chip.label.trim().length > 0)) as Array<{ label: string; value: string; color?: string }>;

  if (!chips.length) {
    return <div className="px-2 py-1 rounded min-h-[1.5rem]" />;
  }

  return (
    <div className="px-2 py-1 rounded min-h-[1.5rem] flex flex-wrap gap-1 justify-center items-center">
      {chips.map((chip, index) => {
        const { background, text } = getBadgeColors(chip.color);
        return (
          <div
            key={`${chip.value}-${index}`}
            className="flex items-center gap-1 px-2 py-1 rounded-full text-base font-medium border"
            style={{
              backgroundColor: background,
              color: text,
              borderColor: background,
            }}
          >
            <span>{chip.label}</span>
          </div>
        );
      })}
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
  const relationshipOptions: RelationshipOption[] = meta.relationshipOptions || [];
  const relationshipChipRenderer = meta.relationshipChipRenderer as
    | RelationshipChipRenderer
    | undefined;
  
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
          renderChip={relationshipChipRenderer}
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

// Single Relationship Chips Display Component
function SingleRelationshipChipsDisplay({
  value,
  options,
  onClick,
}: {
  value: string | null | undefined;
  options: RelationshipOption[];
  onClick?: (e?: React.MouseEvent) => void;
}) {
  const label = value
    ? options.find((opt) => opt.value === value)?.label
    : null;

  if (!label) {
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
      <div
        className={cn(
          "flex items-center gap-1 px-2 py-1 rounded-full text-base font-medium border",
          relationshipChipClass
        )}
      >
        <span>{label}</span>
      </div>
    </div>
  );
}

// Single Relationship Editable Cell Component
function SingleRelationshipEditableCell<T>({
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
  const currentValue =
    cellValue != null
      ? typeof cellValue === "string"
        ? cellValue
        : (cellValue as any)?._id || String(cellValue)
      : null;
  // Use a special value for "none" instead of empty string
  const NONE_VALUE = "__NONE__";
  const [selectedValue, setSelectedValue] = useState<string>(currentValue || NONE_VALUE);

  useEffect(() => {
    if (isEditing) {
      setSelectedValue(currentValue || NONE_VALUE);
    }
  }, [isEditing, cellValue, currentValue]);

  const handleSave = () => {
    // Convert the special "none" value to null
    const valueToSave = selectedValue === NONE_VALUE ? null : (selectedValue && selectedValue.trim() !== "" ? selectedValue : null);
    onSave({ [accessorKey]: valueToSave });
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
        <SingleRelationshipChipsDisplay
          value={currentValue}
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
      <Select value={selectedValue} onValueChange={setSelectedValue}>
        <SelectTrigger className="w-full">
          <SelectValue placeholder="בחר אפשרות..." />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={NONE_VALUE}>-- אין --</SelectItem>
          {relationshipOptions.map((option: { value: string; label: string }) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
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
  const isImage = meta.isImage;
  const isFile = meta.isFile;
  const isDynamic = accessorKey?.startsWith("dynamicFields.");
  const fieldDefinition = meta.fieldDefinition;
  const fallbackFieldOptions = fieldDefinition?.choices
    ? normalizeDynamicFieldChoices(fieldDefinition.choices)
    : undefined;
  const resolvedOptions =
    Array.isArray(options) && options.length > 0 ? options : fallbackFieldOptions;
  
  // Detect email/phone fields (both static and dynamic)
  const isEmailField = accessorKey === "email" || fieldType === "EMAIL" || (isDynamic && fieldDefinition?.type === "EMAIL");
  const isPhoneField = accessorKey === "phone" || fieldType === "PHONE" || (isDynamic && fieldDefinition?.type === "PHONE");
  const isLinkField = fieldType === "LINK" || (isDynamic && fieldDefinition?.type === "LINK");

  const [isImageModalOpen, setIsImageModalOpen] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const fileInputRefForFile = useRef<HTMLInputElement>(null);
  
  // Get the current value
  const cellValue = cell.getValue();
  
  // Helper function to safely convert object to string
  const safeStringify = (val: any): string => {
    if (val == null) return "";
    if (typeof val === "string") return val;
    if (typeof val === "number" || typeof val === "boolean") return String(val);
    if (Array.isArray(val)) return val.join(", ");
    if (typeof val === "object") {
      // Try common object properties first
      if (val.name) return String(val.name);
      if (val.email) return String(val.email);
      if (val._id) return String(val._id);
      // Fallback to JSON stringification
      try {
        return JSON.stringify(val);
      } catch {
        return String(val);
      }
    }
    return String(val);
  };
  
  // Pre-calculate display label for select fields
  const selectDisplayOption =
    fieldType === "SELECT" && Array.isArray(resolvedOptions)
      ? resolvedOptions.find((opt: any) => opt.value === cellValue)
      : undefined;
  const selectDisplayValue = selectDisplayOption?.label;

  // For IMAGE type, we'll handle it separately in the render
  const displayValue = selectDisplayValue ??
    (isDate
      ? formatDateForDisplay(cellValue)
      : isTime
      ? cellValue || ""
      : isMoney
      ? cellValue
        ? `₪${parseFloat(cellValue).toLocaleString("he-IL", {
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
          })}`
        : ""
      : fieldType === "CHECKBOX"
      ? cellValue === true || cellValue === "true" || cellValue === "1"
        ? "✓"
        : ""
      : fieldType === "MULTI_SELECT" && Array.isArray(cellValue)
      ? cellValue.join(", ")
      : isPhoneField && cellValue
      ? formatPhoneNumber(cellValue)
      : isLinkField && cellValue
      ? String(cellValue)
      : safeStringify(cellValue));

  useEffect(() => {
    if (isEditing) {
      // Set initial value when editing starts
      if (isDate && cellValue) {
        setValue(formatDateForEdit(cellValue));
      } else if (fieldType === "MULTI_SELECT" && Array.isArray(cellValue)) {
        setValue(cellValue.join(","));
      } else if (fieldType === "CHECKBOX") {
        setValue(cellValue === true || cellValue === "true" || cellValue === "1" ? "true" : "false");
      } else if (isPhoneField && cellValue) {
        // For phone fields, show formatted value when editing
        setValue(formatPhoneNumber(cellValue));
      } else if (isMoney && cellValue !== undefined && cellValue !== null) {
        // For money fields, extract numeric value and convert to string for input
        const numericValue = typeof cellValue === "number" 
          ? cellValue 
          : parseFloat(String(cellValue).replace(/[^\d.]/g, '')) || 0;
        setValue(String(numericValue));
      } else if (isLinkField && cellValue) {
        setValue(String(cellValue));
      } else {
        // Safely convert cellValue to string, handling objects
        const stringValue = typeof cellValue === "object" && cellValue !== null && !Array.isArray(cellValue)
          ? (cellValue.name || cellValue.email || cellValue._id || JSON.stringify(cellValue))
          : String(cellValue ?? "");
        setValue(stringValue);
      }

      if (
        fieldType === "SELECT" &&
        (!cellValue || String(cellValue).trim() === "") &&
        Array.isArray(resolvedOptions) &&
        resolvedOptions.length > 0
      ) {
        const defaultOptionValue = resolvedOptions[0]?.value;
        if (defaultOptionValue !== undefined && defaultOptionValue !== null) {
          setValue(String(defaultOptionValue));
        }
      }

      // Focus the input
      setTimeout(() => {
        inputRef.current?.focus();
        if (inputRef.current instanceof HTMLInputElement) {
          inputRef.current.select();
        }
      }, 0);
    }
  }, [isEditing, cellValue, isDate, fieldType, isPhoneField, isMoney, isLinkField, resolvedOptions]);

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
        showError(t("invalid_israeli_id") || "תעודת זהות לא תקינה. אנא בדוק את המספר שהוזן.");
        // Clear the invalid value and cancel editing
        setValue("");
        onCancel();
        return;
      }
    }
    
    // Process date values
    if (isDate) {
      if (!value || (typeof value === 'string' && value.trim() === '')) {
        // If date field is empty, set to null instead of empty string
        processedValue = null;
      } else {
        processedValue = parseDateForSubmit(value) || value;
      }
    }
    
    // Process time values - ensure HH:MM format
    if (isTime && value) {
      // Validate and format time as HH:MM
      const timeRegex = /^([0-1][0-9]|2[0-3]):([0-5][0-9])$/;
      if (!timeRegex.test(value)) {
        showError(t("invalid_time_format") || "פורמט זמן לא תקין. אנא השתמש בפורמט HH:MM");
        return;
      }
      processedValue = value;
    }
    
    // Process money values - remove currency symbols and convert to number
    if (isMoney) {
      if (value !== undefined && value !== null && value !== "") {
        // Remove any non-digit characters except decimal point
        const cleanedValue = value.toString().replace(/[^\d.]/g, '');
        // Convert to number
        const numericValue = parseFloat(cleanedValue);
        // Only save if it's a valid number
        if (!isNaN(numericValue)) {
          processedValue = numericValue;
        } else {
          // If invalid, set to 0
          processedValue = 0;
        }
      } else {
        // Handle empty money values - set to 0
        processedValue = 0;
      }
    }
    
    // Process phone values - unformat phone numbers (remove formatting, store as digits)
    if (isPhoneField && value) {
      processedValue = unformatPhoneNumber(value);
    }
    
    // Process link values - ensure proper URL format
    if (isLinkField) {
      const trimmedValue = value?.toString().trim() ?? "";
      if (!trimmedValue) {
        processedValue = "";
      } else {
        const hasProtocol = /^https?:\/\//i.test(trimmedValue);
        const normalizedValue = hasProtocol ? trimmedValue : `https://${trimmedValue}`;
        try {
          const url = new URL(normalizedValue);
          processedValue = url.toString();
        } catch {
          showError(t("invalid_url", "כתובת URL לא תקינה"));
          return;
        }
      }
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

  const handleDragOver = (e: React.DragEvent) => {
    const isImageField = (isDynamic && fieldDefinition?.type === "IMAGE") || (!isDynamic && (isImage || fieldType === "IMAGE"));
    const isFileField = (isDynamic && fieldDefinition?.type === "FILE") || (!isDynamic && (isFile || fieldType === "FILE"));
    if (isImageField || isFileField) {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(true);
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const file = e.dataTransfer.files[0];
    if (!file) return;

    const isImageField = (isDynamic && fieldDefinition?.type === "IMAGE") || (!isDynamic && (isImage || fieldType === "IMAGE"));
    if (isImageField && !file.type.startsWith("image/")) {
      showError(t("invalid_file_type", "סוג קובץ לא תקין. אנא העלה תמונה."));
      return;
    }

    setIsUploading(true);
    try {
      const timestamp = Date.now();
      const uuid = crypto.randomUUID();
      let path: string;
      
      if (isDynamic) {
        const fieldName = accessorKey.replace("dynamicFields.", "");
        path = `uploads/dynamic-fields/${fieldName}/${timestamp}_${uuid}`;
      } else {
        path = `uploads/${accessorKey}/${timestamp}_${uuid}`;
      }
      
      const fileUrl = await uploadFile(file, path);
      
      if (isDynamic) {
        const fieldName = accessorKey.replace("dynamicFields.", "");
        const existingDynamicFields = (row.original as any).dynamicFields || {};
        onSave({
          dynamicFields: {
            ...existingDynamicFields,
            [fieldName]: fileUrl,
          },
        });
      } else {
        onSave({ [accessorKey]: fileUrl });
      }
    } catch (error) {
      console.error("Error uploading file:", error);
      showError(t("error_uploading_file", "שגיאה בהעלאת הקובץ") || "Error uploading file");
    } finally {
      setIsUploading(false);
    }
  };

  if (!isEditing) {
    // Handle image fields (both dynamic and non-dynamic)
    if ((isDynamic && fieldDefinition?.type === "IMAGE") || (!isDynamic && (isImage || fieldType === "IMAGE"))) {
      return (
        <>
          <input
            type="file"
            accept="image/*"
            ref={fileInputRef}
            onChange={async (e) => {
              const file = e.target.files?.[0];
              if (file) {
                if (!file.type.startsWith("image/")) {
                  showError(t("invalid_file_type", "סוג קובץ לא תקין. אנא העלה תמונה."));
                  return;
                }

                setIsUploading(true);
                try {
                  const fieldName = accessorKey.replace("dynamicFields.", "");
                  const timestamp = Date.now();
                  const uuid = crypto.randomUUID();
                  const path = `uploads/dynamic-fields/${fieldName}/${timestamp}_${uuid}`;
                  
                  const fileUrl = await uploadFile(file, path);
                  
                  if (isDynamic) {
                    const existingDynamicFields = (row.original as any).dynamicFields || {};
                    onSave({
                      dynamicFields: {
                        ...existingDynamicFields,
                        [fieldName]: fileUrl,
                      },
                    });
                  } else {
                    onSave({ [accessorKey]: fileUrl });
                  }
                } catch (error) {
                  console.error("Error uploading image:", error);
                  showError(t("error_uploading_image", "שגיאה בהעלאת תמונה") || "Error uploading image");
                } finally {
                  setIsUploading(false);
                  if (fileInputRef.current) {
                    fileInputRef.current.value = "";
                  }
                }
              }
            }}
            className="hidden"
          />
          <div
            className={cn(
              "cursor-pointer group relative px-1 py-1 rounded min-h-[1.5rem] transition-all duration-200",
              "hover:bg-blue-50 hover:border hover:border-blue-200 hover:shadow-sm",
              "flex items-center justify-center",
              isDragging && "bg-blue-100 border-2 border-blue-400 border-dashed",
              isUploading && "opacity-50"
            )}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={(e) => {
              e.stopPropagation();
              if (!cellValue) {
                // If no image, open file picker
                fileInputRef.current?.click();
              } else {
                // If image exists, open modal
                setIsImageModalOpen(true);
              }
            }}
          >
            {isUploading ? (
              <span className="text-muted-foreground text-sm">{t("uploading", "מעלה...")}</span>
            ) : cellValue ? (
              <img
                src={String(cellValue)}
                alt="Preview"
                className="w-10 h-10 object-cover rounded-md cursor-pointer hover:opacity-80"
              />
            ) : (
              <Avatar className="w-10 h-10">
                <AvatarFallback className="bg-gray-300" />
              </Avatar>
            )}
          </div>
          {cellValue && (
            <ImagePreviewModal
              open={isImageModalOpen}
              onOpenChange={setIsImageModalOpen}
              imageUrl={String(cellValue)}
            />
          )}
        </>
      );
    }

    if (isDynamic && fieldDefinition?.type === "FILE") {
      const handleFileDownload = async (e: React.MouseEvent) => {
        e.stopPropagation();
        if (!cellValue) return;
        
        try {
          const response = await fetch(String(cellValue));
          const blob = await response.blob();
          const url = window.URL.createObjectURL(blob);
          const link = document.createElement("a");
          link.href = url;
          
          const urlPath = String(cellValue).split('/').pop() || 'file';
          const fileName = urlPath.split('?')[0];
          link.download = fileName;
          
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          window.URL.revokeObjectURL(url);
        } catch (error) {
          console.error("Error downloading file:", error);
          window.open(String(cellValue), "_blank", "noopener,noreferrer");
        }
      };

      return (
        <>
          <input
            type="file"
            accept="*/*"
            ref={fileInputRefForFile}
            onChange={async (e) => {
              const file = e.target.files?.[0];
              if (file) {
                setIsUploading(true);
                try {
                  const fieldName = accessorKey.replace("dynamicFields.", "");
                  const timestamp = Date.now();
                  const uuid = crypto.randomUUID();
                  const path = `uploads/dynamic-fields/${fieldName}/${timestamp}_${uuid}`;
                  
                  const fileUrl = await uploadFile(file, path);
                  
                  if (isDynamic) {
                    const existingDynamicFields = (row.original as any).dynamicFields || {};
                    onSave({
                      dynamicFields: {
                        ...existingDynamicFields,
                        [fieldName]: fileUrl,
                      },
                    });
                  } else {
                    onSave({ [accessorKey]: fileUrl });
                  }
                } catch (error) {
                  console.error("Error uploading file:", error);
                  showError(t("error_uploading_file", "שגיאה בהעלאת הקובץ") || "Error uploading file");
                } finally {
                  setIsUploading(false);
                  if (fileInputRefForFile.current) {
                    fileInputRefForFile.current.value = "";
                  }
                }
              }
            }}
            className="hidden"
          />
          <div
            className={cn(
              "cursor-pointer group relative px-2 py-1 rounded min-h-[1.5rem] transition-all duration-200",
              "hover:bg-blue-50 hover:border hover:border-blue-200 hover:shadow-sm",
              "flex items-center justify-center",
              isDragging && "bg-blue-100 border-2 border-blue-400 border-dashed",
              isUploading && "opacity-50"
            )}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={(e) => {
              e.stopPropagation();
              if (!cellValue) {
                fileInputRefForFile.current?.click();
              } else {
                handleFileDownload(e);
              }
            }}
          >
            {isUploading ? (
              <span className="text-muted-foreground text-sm">{t("uploading", "מעלה...")}</span>
            ) : cellValue ? (
              <Download className="w-5 h-5 text-blue-600 cursor-pointer hover:text-blue-800" />
            ) : (
              <span className="text-muted-foreground text-sm">{t("no_file", "אין קובץ")}</span>
            )}
          </div>
        </>
      );
    }
    
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
            className="cursor-pointer w-6 h-6 [&_svg]:w-5 [&_svg]:h-5"
          />
        </div>
      );
    }

    if (fieldType === "MULTI_SELECT") {
      const rawValues = Array.isArray(cellValue)
        ? cellValue
        : typeof cellValue === "string" && cellValue !== ""
          ? cellValue.split(",").map((value) => value.trim()).filter(Boolean)
          : [];

      const multiSelectOptions = Array.isArray(resolvedOptions) ? resolvedOptions : undefined;

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
          <MultiSelectChipsDisplay values={rawValues} options={multiSelectOptions} />
          <Pencil className="w-3.5 h-3.5 text-blue-400 opacity-0 group-hover:opacity-100 transition-opacity duration-200 absolute top-1 right-1" />
        </div>
      );
    }
    
    if (fieldType === "SELECT" && selectDisplayOption) {
      const { background, text } = getBadgeColors(selectDisplayOption.color);
      return (
        <div
          onClick={(e) => {
            e.stopPropagation();
            onEdit();
          }}
          className={cn(
            "cursor-pointer group relative px-2 py-1 rounded min-h-[1.5rem] transition-all duration-200",
            "hover:bg-blue-50 hover:border hover:border-blue-200 hover:shadow-sm"
          )}
        >
          <div className="flex items-center justify-center gap-2">
            <span
              className="inline-flex items-center rounded-full border px-3 py-1 text-base font-semibold shadow-sm"
              style={{
                backgroundColor: background,
                color: text,
                borderColor: background,
              }}
            >
              {selectDisplayOption.label}
            </span>
            <Pencil className="w-3.5 h-3.5 text-blue-400 opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
          </div>
        </div>
      );
    }
    
    // Email field display with icon and background color
    if (isEmailField) {
      const hasValue = cellValue && String(cellValue).trim() !== "";
      return (
        <div
          onClick={(e) => {
            e.stopPropagation();
            onEdit();
          }}
          className={cn(
            "cursor-pointer group relative px-2 py-1 rounded min-h-[1.5rem] transition-all duration-200",
            "hover:bg-blue-100 hover:border hover:border-blue-300 hover:shadow-sm",
            hasValue ? "bg-blue-50" : ""
          )}
        >
          <div className="flex items-center justify-center gap-2">
            <Mail className={cn(
              "w-4 h-4 transition-colors",
              hasValue ? "text-blue-600" : "text-gray-400"
            )} />
            <span className={cn(
              "group-hover:text-blue-700 transition-colors text-base",
              hasValue ? "" : "text-gray-400"
            )}>
              {hasValue ? displayValue : ""}
            </span>
            <Pencil className="w-3.5 h-3.5 text-blue-400 opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
          </div>
        </div>
      );
    }
    
    // Phone field display with icon and background color
    if (isPhoneField) {
      const hasValue = cellValue && String(cellValue).trim() !== "";
      return (
        <div
          onClick={(e) => {
            e.stopPropagation();
            onEdit();
          }}
          className={cn(
            "cursor-pointer group relative px-2 py-1 rounded min-h-[1.5rem] transition-all duration-200",
            "hover:bg-green-100 hover:border hover:border-green-300 hover:shadow-sm",
            hasValue ? "bg-green-50" : ""
          )}
        >
          <div className="flex items-center justify-center gap-2">
            <Phone className={cn(
              "w-4 h-4 transition-colors",
              hasValue ? "text-green-600" : "text-gray-400"
            )} />
            <span className={cn(
              "group-hover:text-green-700 transition-colors text-base",
              hasValue ? "" : "text-gray-400"
            )}>
              {hasValue ? displayValue : ""}
            </span>
            <Pencil className="w-3.5 h-3.5 text-green-400 opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
          </div>
        </div>
      );
    }
    
    // Link field display with clickable anchor
    if (isLinkField) {
      const hasValue = cellValue && String(cellValue).trim() !== "";
      const linkValue = hasValue ? String(cellValue) : "";
      return (
        <div
          onClick={(e) => {
            e.stopPropagation();
            onEdit();
          }}
          className={cn(
            "cursor-pointer group relative px-2 py-1 rounded min-h-[1.5rem] transition-all duration-200",
            "hover:bg-indigo-100 hover:border hover:border-indigo-300 hover:shadow-sm",
            hasValue ? "bg-indigo-50" : ""
          )}
        >
          <div className="flex items-center justify-center gap-2">
            {hasValue ? (
              <a
                href={linkValue}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="text-indigo-600 underline decoration-dotted underline-offset-4 hover:text-indigo-800"
              >
                {linkValue}
              </a>
            ) : (
              <span className="text-gray-400">{t("no_link", "אין קישור")}</span>
            )}
            <Pencil className="w-3.5 h-3.5 text-indigo-400 opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
          </div>
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
          isMoney ? "font-semibold text-xl text-orange-700" : ""
        )}
      >
        <div className="flex items-center justify-center gap-1.5">
          <span className="group-hover:text-blue-700 transition-colors text-base">
            {displayValue}
          </span>
          <Pencil className="w-3.5 h-3.5 text-blue-400 opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
        </div>
      </div>
    );
  }

  if (fieldType === "SELECT" && resolvedOptions) {
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
        {resolvedOptions.map((opt: any) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    );
  }

  if (fieldType === "MULTI_SELECT" && resolvedOptions) {
    const selectedValues = Array.isArray(value) ? value : (typeof value === "string" && value ? value.split(',').map(v => v.trim()) : []);
    return (
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full flex flex-col gap-2 items-stretch"
      >
        <MultiSelect
          options={resolvedOptions}
          selected={selectedValues}
          onSelect={(values) => {
            setValue(values.join(","));
          }}
          placeholder={t("select_options") || "בחר אפשרויות..."}
          className="w-full hover:bg-accent/40 hover:text-accent-foreground"
        />
        <Button
          type="button"
          size="sm"
          variant="info"
          onClick={(e) => {
            e.stopPropagation();
            handleSave();
          }}
          className="self-end h-auto px-3 py-1 text-xs rounded-full shadow-sm"
        >
          {t("save") || "שמור"}
        </Button>
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
          className="cursor-pointer w-6 h-6 [&>svg]:w-5 [&>svg]:h-5"
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

  if (isDynamic && fieldDefinition?.type === "IMAGE") {
    return (
      <div onClick={(e) => e.stopPropagation()} className="w-full">
        <div className="space-y-2">
          <input
            type="file"
            accept="image/*"
            onChange={async (e) => {
              const file = e.target.files?.[0];
              if (file) {
                try {
                  setIsUploading(true);
                  const fieldName = accessorKey.replace("dynamicFields.", "");
                  const timestamp = Date.now();
                  const uuid = crypto.randomUUID();
                  const path = `uploads/dynamic-fields/${fieldName}/${timestamp}_${uuid}`;
                  const imageUrl = await uploadFile(file, path);
                  setValue(imageUrl);
                } catch (error) {
                  console.error("Error uploading image:", error);
                  showError(t("error_uploading_image", "שגיאה בהעלאת תמונה") || "Error uploading image");
                } finally {
                  setIsUploading(false);
                }
              }
            }}
            className="w-full text-sm"
            disabled={isUploading}
          />
          {isUploading && (
            <span className="text-muted-foreground text-sm">{t("uploading", "מעלה...")}</span>
          )}
          {value && !isUploading && (
            <img src={value} alt="Preview" className="max-w-32 max-h-32 object-contain rounded border" />
          )}
        </div>
      </div>
    );
  }

  if (isDynamic && fieldDefinition?.type === "FILE") {
    const handleFileDownloadInEdit = async () => {
      if (!value) return;
      
      try {
        // Fetch the file and download it
        const response = await fetch(String(value));
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        
        // Try to extract filename from URL or use a default
        const urlPath = String(value).split('/').pop() || 'file';
        const fileName = urlPath.split('?')[0]; // Remove query params
        link.download = fileName;
        
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
      } catch (error) {
        console.error("Error downloading file:", error);
        // Fallback: open in new tab
        window.open(String(value), "_blank", "noopener,noreferrer");
      }
    };

    return (
      <div onClick={(e) => e.stopPropagation()} className="w-full">
        <div className="space-y-2">
          <input
            type="file"
            accept="*/*"
            onChange={async (e) => {
              const file = e.target.files?.[0];
              if (file) {
                try {
                  setIsUploading(true);
                  const fieldName = accessorKey.replace("dynamicFields.", "");
                  const timestamp = Date.now();
                  const uuid = crypto.randomUUID();
                  const path = `uploads/dynamic-fields/${fieldName}/${timestamp}_${uuid}`;
                  const fileUrl = await uploadFile(file, path);
                  setValue(fileUrl);
                } catch (error) {
                  console.error("Error uploading file:", error);
                  showError(t("error_uploading_file", "שגיאה בהעלאת הקובץ") || "Error uploading file");
                } finally {
                  setIsUploading(false);
                }
              }
            }}
            className="w-full text-sm"
            disabled={isUploading}
          />
          {isUploading && (
            <span className="text-muted-foreground text-sm">{t("uploading", "מעלה...")}</span>
          )}
          {value && !isUploading && (
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleFileDownloadInEdit}
                className="flex items-center gap-2"
              >
                <Download className="w-4 h-4" />
                {t("download_file", "הורד קובץ")}
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setValue("")}
                className="flex items-center gap-2"
              >
                <X className="w-4 h-4" />
                {t("remove", "הסר")}
              </Button>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Determine input type based on field type
  let inputType = "text";
  if (isEmailField) {
    inputType = "email";
  } else if (isPhoneField) {
    inputType = "tel";
  } else if (isLinkField) {
    inputType = "url";
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
    const isSingleSelect = meta.singleSelect === true;

    // Check if this cell should be editable
    // Don't allow editing for selection column, action columns, or hidden columns
    const isEditable = accessorKey && 
      accessorKey !== "select" && 
      accessorKey !== "actions" &&
      !meta.hidden &&
      meta.editable !== false; // Allow explicit editable flag, default to true for regular columns
    
    const cellId = `${row.id}-${accessorKey}`;
    const isEditing = editingCell === cellId;

    // If it's a single-select relationship field, use SingleRelationshipEditableCell
    if (isRelationshipField && isSingleSelect && isEditable) {
      return (
        <SingleRelationshipEditableCell
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

    // If it's a multi-select relationship field, use RelationshipEditableCell
    if (isRelationshipField && !isSingleSelect && isEditable) {
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

    // If it's a single-select relationship field but not editable, just display chip
    if (isRelationshipField && isSingleSelect) {
      const currentValue = value != null
        ? typeof value === "string"
          ? value
          : (value as any)?._id || String(value)
        : null;
      return (
        <SingleRelationshipChipsDisplay
          value={currentValue}
          options={meta.relationshipOptions}
        />
      );
    }

    // If it's a multi-select relationship field but not editable, just display chips
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
    // Check if there's a custom cell renderer first - if so, use it instead of automatic date formatting
    if (columnDef.cell) {
      return flexRender(columnDef.cell, cell.getContext());
    }
    
    if (isDateColumn || isDateValue(value)) {
      return <span className="text-lg">{formatDateForDisplay(value)}</span>;
    }

    // Check if this is a money field
    const isMoney = meta.isMoney;
    
    if (isMoney && value) {
      const formattedValue = `₪${parseFloat(value).toLocaleString('he-IL', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
      return (
        <span className="font-semibold text-xl text-orange-700">
          {formattedValue}
        </span>
      );
    }

    // Check if value is an object that shouldn't be rendered directly
    if (typeof value === "object" && value !== null && !Array.isArray(value)) {
      // Try to get a string representation
      const objValue = value as any;
      const stringValue = objValue.name || objValue.email || objValue._id || JSON.stringify(value);
      return <span className="text-lg">{String(stringValue)}</span>;
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
          showConfirm(t("confirm_delete") || t("common:confirm_delete") || "Are you sure?").then((confirmed) => {
            if (confirmed) {
              // @ts-ignore
              meta.handleDelete(row.original.id || row.original._id);
            }
          });
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
          // @ts-ignore
          delete duplicateData.code; // Remove code so backend generates a new one
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
        className="cursor-pointer data-table-row"
        style={{ width: "100%", height: "auto" }}
        onClick={(e) => {
          // Don't trigger row click if clicking on action buttons, checkboxes, or other interactive elements
          const target = e.target as HTMLElement;
          const isActionButton = target.closest('button') || target.closest('[role="button"]');
          const isCheckbox = target.closest('input[type="checkbox"]') || target.closest('[role="checkbox"]');
          const isClickable = target.closest('a') || target.closest('[onclick]');
          
          if (!isActionButton && !isCheckbox && !isClickable && onRowClick) {
            onRowClick(row);
          }
        }}
      >
        {row.getVisibleCells().map((cell, cellIndex) => {
          const isFirst = cellIndex === 0;
          const isLast = cellIndex === row.getVisibleCells().length - 1;
          const effectiveStickyColumnCount = stickyColumnCount ?? 0;
          const isSticky = cellIndex < effectiveStickyColumnCount;

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
            };
          }

          // Border radius handled by CSS - cells inherit from row
          const roundedClass = "";

          // Render the first cell
          if (cellIndex === 0) {
            return (
              <React.Fragment key={cell.id}>
                <TableCell
                  style={{
                    ...stickyStyles,
                    width: cell.column.getSize(),
                    minWidth: cell.column.getSize(),
                  }}
                  className={`text-center data-table-row-cell ${roundedClass} ${isSticky ? "sticky-column" : ""}`}
                >
                  {renderCellContent(cell)}
                </TableCell>
                {showActionColumn && (
                  <TableCell className="text-center data-table-row-cell">
                    {showEditButton && (
                      <TableEditButton
                        onClick={(e) => handleActionClick(e, "edit")}
                      />
                    )}
                    {showDeleteButton && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => handleActionClick(e, "delete")}
                        className="text-red-500 hover:text-red-600 hover:bg-red-50 transition-colors duration-200"
                      >
                        {t("delete", "מחק")}
                      </Button>
                    )}
                    {showDuplicateButton && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => handleActionClick(e, "duplicate")}
                        className="gap-2"
                      >
                        <Copy className="w-4 h-4" />
                        {t("duplicate_form", "שכפל טופס")}
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
                minWidth: cell.column.getSize(),
              }}
              className={`text-center data-table-row-cell ${roundedClass} ${isSticky ? "sticky-column" : ""}`}
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
