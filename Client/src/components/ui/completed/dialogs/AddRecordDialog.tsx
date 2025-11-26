import { useState, useEffect, ChangeEvent, FormEvent, useMemo, useRef } from "react";
import { useTranslation } from "react-i18next";
import { ColumnDef } from "@tanstack/react-table";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogBody } from "@/components/ui/dialog";
import { Input } from "@/components/ui/Input";
import { formatDateForEdit, parseDateForSubmit, isDateValue } from "@/lib/dateUtils";
import { MultiSelect } from "@/components/ui/multi-select";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { AddressInput } from "@/components/ui/address-input";
import { DateInput } from "@/components/ui/date-input";
import { isValidIsraeliID } from "@/lib/israeliIdValidator";
import { toast } from "@/hooks/use-toast";
import { showError } from "@/utils/swal";
import { Save, X, Upload, Image as ImageIcon, XCircle, Download, File } from "lucide-react";
import { handleImageUpload, uploadFile } from "@/lib/imageUtils";
import { cn } from "@/lib/utils";

interface AddRecordDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  columns: ColumnDef<any>[];
  onAdd: (data: any) => Promise<void>;
  excludeFields?: string[];
  defaultValues?: Record<string, any>;
  editMode?: boolean;
  editData?: Record<string, any>;
  onEdit?: (data: any) => Promise<void>;
  relationshipFields?: {
    [key: string]: {
      options: { value: string; label: string }[];
    };
  };
}

// Custom File Upload Component
interface FileUploadProps {
  value?: string;
  onChange: (file: File | null) => Promise<void>;
  accept?: string;
  required?: boolean;
  label?: string;
}

function FileUpload({ value, onChange, accept = "image/*", required, label }: FileUploadProps) {
  const { t } = useTranslation();
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const file = e.dataTransfer.files[0];
    if (file) {

      if (accept === "image/*" && !file.type.startsWith("image/")) {
        return;
      }
      setIsUploading(true);
      try {
        await onChange(file);
      } finally {
        setIsUploading(false);
      }
    }
  };

  const handleFileSelect = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setIsUploading(true);
      try {
        await onChange(file);
      } finally {
        setIsUploading(false);
      }
    }
  };

  const handleRemove = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
    // Clear the value by calling onChange with null
    await onChange(null);
  };

  return (
    <div className="w-full">
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => !value && fileInputRef.current?.click()}
        className={cn(
          "relative border-2 border-dashed rounded-lg transition-all duration-200",
          "hover:border-primary/50 hover:bg-accent/50",
          isDragging && "border-primary bg-primary/5",
          value && "border-primary/30",
          isUploading && "opacity-50 pointer-events-none",
          !value && "cursor-pointer"
        )}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept={accept}
          onChange={handleFileSelect}
          className="hidden"
          required={required}
        />
        
        {value ? (
          <div className="relative p-4">
            {accept === "image/*" ? (
              <div className="relative w-full aspect-video rounded-md overflow-hidden bg-muted">
                <img
                  src={value}
                  alt={label || t("image")}
                  className="w-full h-full object-contain"
                />
                <button
                  type="button"
                  onClick={handleRemove}
                  className="absolute top-2 right-2 p-1.5 rounded-full bg-background/80 backdrop-blur-sm border border-border shadow-sm hover:bg-destructive hover:text-destructive-foreground transition-colors"
                >
                  <XCircle className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="relative w-full rounded-md overflow-hidden bg-muted p-4 flex items-center justify-center">
                <div className="flex flex-col items-center gap-2">
                  <File className="w-12 h-12 text-primary" />
                  <p className="text-sm font-medium text-foreground">
                    {t("file_uploaded", "קובץ הועלה")}
                  </p>
                  <a
                    href={value}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-sm text-primary hover:underline"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <Download className="w-4 h-4" />
                    {t("download_file", "הורד קובץ")}
                  </a>
                </div>
                <button
                  type="button"
                  onClick={handleRemove}
                  className="absolute top-2 right-2 p-1.5 rounded-full bg-background/80 backdrop-blur-sm border border-border shadow-sm hover:bg-destructive hover:text-destructive-foreground transition-colors"
                >
                  <XCircle className="w-4 h-4" />
                </button>
              </div>
            )}
            <p className="mt-2 text-sm text-center text-muted-foreground">
              {accept === "image/*" 
                ? t("image_uploaded_successfully", "תמונה הועלתה בהצלחה")
                : t("file_uploaded_successfully", "קובץ הועלה בהצלחה")}
            </p>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center p-8 text-center">
            <div className="p-3 rounded-full bg-primary/10 mb-3 group-hover:bg-primary/20 transition-colors">
              {isUploading ? (
                <Upload className="w-6 h-6 text-primary animate-pulse" />
              ) : accept === "image/*" ? (
                <ImageIcon className="w-6 h-6 text-primary" />
              ) : (
                <File className="w-6 h-6 text-primary" />
              )}
            </div>
            <p className="text-sm font-medium text-foreground mb-1">
              {isUploading 
                ? t("uploading", "מעלה...") 
                : accept === "image/*" 
                  ? t("click_to_upload", "לחץ להעלאת תמונה")
                  : t("click_to_upload_file", "לחץ להעלאת קובץ")}
            </p>
            <p className="text-xs text-muted-foreground">
              {accept === "image/*"
                ? t("drag_and_drop_or_click", "גרור ושחרר תמונה או לחץ לבחירה")
                : t("drag_and_drop_or_click_file", "גרור ושחרר קובץ או לחץ לבחירה")}
            </p>
            {accept === "image/*" && (
              <p className="text-xs text-muted-foreground mt-1">
                {t("supported_formats", "PNG, JPG, GIF עד 10MB")}
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export function AddRecordDialog({
  open,
  onOpenChange,
  columns,
  onAdd,
  excludeFields = [],
  defaultValues = {},
  editMode = false,
  editData,
  onEdit,
  relationshipFields,
}: AddRecordDialogProps) {
  const { t } = useTranslation();
  const [form, setForm] = useState<Record<string, any>>({});
  const [saving, setSaving] = useState(false);
  const initializedRef = useRef(false);

  // Memoize dataColumns to prevent unnecessary re-renders
  const dataColumns = useMemo(() => {
    return columns.filter(
      (col) => {
        const accessorKey = (col as any).accessorKey;
        return (
          accessorKey &&
          typeof accessorKey === "string" &&
          !["select", "duplicate", "actions"].includes(accessorKey) &&
          !excludeFields.includes(accessorKey) &&
          !(col.meta as any)?.hidden
        );
      }
    );
  }, [columns, excludeFields]);

  // Helper function to check if a field is a date field
  const isDateField = (accessorKey: string): boolean => {
    // Check if column is marked as date
    const column = dataColumns.find((col) => (col as any).accessorKey === accessorKey);
    if (column && (column.meta as any)?.isDate) {
      return true;
    }
    // Check common date field names (excluding birthdate which is removed)
    if (accessorKey.toLowerCase().includes("date")) {
      return true;
    }
    return false;
  };

  // Helper to check if a field is dynamic
  const isDynamicField = (accessorKey: string): boolean => {
    return accessorKey.startsWith("dynamicFields.");
  };

  // Get dynamic field name from accessorKey
  const getDynamicFieldName = (accessorKey: string): string => {
    return accessorKey.replace("dynamicFields.", "");
  };

  // Initialize form with edit data when dialog opens in edit mode
  useEffect(() => {
    // Reset initialization flag when dialog closes
    if (!open) {
      initializedRef.current = false;
      return;
    }

    if (open && editMode && editData) {
      // Convert dates to DD/MM/YYYY format for editing
      const formattedData: Record<string, any> = {};
      
      // Handle regular fields
      Object.keys(editData).forEach((key) => {
        if (key !== "dynamicFields") {
          const value = editData[key];
          if (isDateField(key) && value) {
            // If value is already in DD/MM/YYYY format, use it as-is
            // Otherwise, format it from ISO or other formats
            if (typeof value === "string" && value.includes("/") && value.match(/^\d{2}\/\d{2}\/\d{4}$/)) {
              formattedData[key] = value;
            } else {
              formattedData[key] = formatDateForEdit(value);
            }
          } else {
            formattedData[key] = value;
          }
        }
      });
      
      // Handle relationship fields - check if single-select or multi-select
      if (relationshipFields) {
        Object.keys(relationshipFields).forEach((key) => {
          const column = dataColumns.find((col) => (col as any).accessorKey === key);
          const isSingleSelect = column && (column.meta as any)?.singleSelect === true;
          
          if (editData[key] !== undefined) {
            if (isSingleSelect) {
              // Single-select: use the value directly (or null if empty)
              formattedData[key] = editData[key] && editData[key].toString().trim() !== "" ? editData[key] : null;
            } else {
              // Multi-select: ensure it's an array
              formattedData[key] = Array.isArray(editData[key]) ? editData[key] : [];
            }
          } else if (defaultValues[key] !== undefined) {
            if (isSingleSelect) {
              formattedData[key] = defaultValues[key] && defaultValues[key].toString().trim() !== "" ? defaultValues[key] : null;
            } else {
              formattedData[key] = Array.isArray(defaultValues[key]) ? defaultValues[key] : [];
            }
          } else {
            formattedData[key] = isSingleSelect ? null : [];
          }
        });
      }
      
      // Handle dynamic fields
      if (editData.dynamicFields) {
        Object.keys(editData.dynamicFields).forEach((key) => {
          const value = editData.dynamicFields[key];
          const dynamicAccessorKey = `dynamicFields.${key}`;
          const column = dataColumns.find((col) => (col as any).accessorKey === dynamicAccessorKey);
          
          if (column && (column.meta as any)?.isDate && value) {
            formattedData[dynamicAccessorKey] = formatDateForEdit(value);
          } else {
            formattedData[dynamicAccessorKey] = value;
          }
        });
      }
      
      setForm(formattedData);
    } else if (open && !editMode && !initializedRef.current) {
      // Initialize with defaultValues for all fields (only once when dialog opens)
      const initialForm: Record<string, any> = {};
      if (defaultValues) {
        Object.keys(defaultValues).forEach((key) => {
          if (relationshipFields?.[key]) {
            const column = dataColumns.find((col) => (col as any).accessorKey === key);
            const isSingleSelect = column && (column.meta as any)?.singleSelect === true;
            
            if (isSingleSelect) {
              initialForm[key] = defaultValues[key] && defaultValues[key].toString().trim() !== "" ? defaultValues[key] : null;
            } else if (Array.isArray(defaultValues[key])) {
              initialForm[key] = defaultValues[key];
            }
          } else {
            // Include non-relationship default values
            initialForm[key] = defaultValues[key];
          }
        });
      }
      setForm(initialForm);
      initializedRef.current = true;
    }
  }, [open, editMode, editData, dataColumns, defaultValues, relationshipFields]);

  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleDynamicFieldChange = (fieldName: string, value: any) => {
    setForm({ ...form, [`dynamicFields.${fieldName}`]: value });
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      // Validate Israeli ID if present
      if (form.idNumber && form.idNumber.trim() !== "") {
        if (!isValidIsraeliID(form.idNumber)) {
          await showError(t("invalid_israeli_id") || "תעודת זהות לא תקינה. אנא בדוק את המספר שהוזן.");
          // Clear the invalid ID number
          setForm({ ...form, idNumber: "" });
          setSaving(false);
          return;
        }
      }

      // Separate regular fields and dynamic fields
      const processedData: Record<string, any> = {};
      const dynamicFields: Record<string, any> = {};
      
      console.log("Form data before processing:", form);
      
      Object.keys(form).forEach((key) => {
        const value = form[key];
        
        if (isDynamicField(key)) {
          const fieldName = getDynamicFieldName(key);
          const column = dataColumns.find((col) => (col as any).accessorKey === key);
          const isDate = column && (column.meta as any)?.isDate;
          
          if (value !== null && value !== undefined) {
            if (isDate && value && typeof value === "string" && value !== "") {
              const isoDate = parseDateForSubmit(value);
              dynamicFields[fieldName] = isoDate || value;
            } else {
              dynamicFields[fieldName] = value;
            }
          }
        } else {
          // Skip empty values for regular fields (but include arrays even if empty)
          if (Array.isArray(value)) {
            processedData[key] = value;
          } else if (value === "" || value === null || value === undefined) {
            return;
          } else if (isDateField(key) && value && typeof value === "string") {
            // Convert DD/MM/YYYY or YYYY-MM-DD to YYYY-MM-DD for API
            let isoDate: string;
            if (value.includes("-") && value.match(/^\d{4}-\d{2}-\d{2}$/)) {
              // Already in YYYY-MM-DD format from date input
              isoDate = value;
            } else {
              // Convert from DD/MM/YYYY
              isoDate = parseDateForSubmit(value);
            }
            processedData[key] = isoDate || value;
          } else {
            processedData[key] = value;
          }
        }
      });
      
      // Add dynamicFields object if there are any dynamic fields
      if (Object.keys(dynamicFields).length > 0) {
        processedData.dynamicFields = dynamicFields;
      }
      
      console.log("Processed data:", processedData);
      console.log("Dynamic fields:", dynamicFields);
      
      // Include relationship fields from form - handle single-select vs multi-select
      if (relationshipFields) {
        Object.keys(relationshipFields).forEach((key) => {
          const column = dataColumns.find((col) => (col as any).accessorKey === key);
          const isSingleSelect = column && (column.meta as any)?.singleSelect === true;
          
          if (form[key] !== undefined) {
            if (isSingleSelect) {
              // Single-select: use the value directly (or null if empty)
              processedData[key] = form[key] && form[key].toString().trim() !== "" ? form[key] : null;
            } else {
              // Multi-select: ensure it's an array
              processedData[key] = Array.isArray(form[key]) ? form[key] : [];
            }
          } else if (defaultValues[key] !== undefined) {
            if (isSingleSelect) {
              processedData[key] = defaultValues[key] && defaultValues[key].toString().trim() !== "" ? defaultValues[key] : null;
            } else {
              processedData[key] = Array.isArray(defaultValues[key]) ? defaultValues[key] : [];
            }
          } else {
            processedData[key] = isSingleSelect ? null : [];
          }
        });
      }
      
      // Merge with defaultValues, but preserve dynamicFields and relationship fields
      const finalData = {
        ...defaultValues,
        ...processedData,
        // Ensure dynamicFields is preserved even if defaultValues has it
        ...(processedData.dynamicFields && { dynamicFields: processedData.dynamicFields }),
      };
      
      console.log("Final data to send:", finalData);
      
      // Validate that we have at least some data
      if (Object.keys(processedData).length === 0 && Object.keys(dynamicFields).length === 0) {
        toast.error(t("error") || "Please fill in at least one field");
        setSaving(false);
        return;
      }
      
      try {
        if (editMode && onEdit) {
          await onEdit(finalData);
        } else {
          await onAdd(finalData);
        }
        // Only close dialog if no error was thrown
        onOpenChange(false);
        setForm({});
      } catch (error) {
        // Error was thrown by onAdd/onEdit - re-throw to outer catch
        throw error;
      }
    } catch (error) {
      console.error(editMode ? "Error editing record:" : "Error adding record:", error);
      // Show error to user - don't close dialog
      const errorMessage = error instanceof Error 
        ? error.message 
        : (error as any)?.response?.data?.message 
        || (error as any)?.error 
        || t("error") || "An error occurred";
      toast.error(errorMessage);
      // Don't re-throw - we've handled it, just keep dialog open
    } finally {
      setSaving(false);
    }
  };

  const handleClose = () => {
    setForm({});
    onOpenChange(false);
  };

  const handleImageFieldChange = async (accessorKey: string, file: File | null) => {
    // Handle file removal
    if (!file) {
      setForm({ ...form, [accessorKey]: "" });
      return;
    }

    try {
      const column = dataColumns.find((col) => (col as any).accessorKey === accessorKey);
      const uploadPathMeta = column ? (column.meta as any)?.uploadPath : undefined;
      const timestamp = Date.now();
      const uuid = crypto.randomUUID();
      let basePath: string;

      if (uploadPathMeta) {
        basePath = uploadPathMeta;
      } else if (isDynamicField(accessorKey)) {
        const fieldName = getDynamicFieldName(accessorKey);
        basePath = `uploads/dynamic-fields/${fieldName}`;
      } else {
        basePath = `uploads/static-fields/${accessorKey}`;
      }

      const path = `${basePath}/${timestamp}_${uuid}`;
      const imageUrl = await uploadFile(file, path);
      setForm({ ...form, [accessorKey]: imageUrl });
      toast.success(t("image_uploaded_successfully", "תמונה הועלתה בהצלחה") || "Image uploaded successfully");
    } catch (error) {
      console.error("Error uploading image:", error);
      toast.error(t("error_uploading_image", "שגיאה בהעלאת תמונה") || "Error uploading image");
    }
  };

  const handleFileFieldChange = async (accessorKey: string, file: File | null) => {

    if (!file) {
      setForm({ ...form, [accessorKey]: "" });
      return;
    }

    try {
      const fieldName = getDynamicFieldName(accessorKey);
      const timestamp = Date.now();
      const uuid = crypto.randomUUID();
      const path = `uploads/dynamic-fields/${fieldName}/${timestamp}_${uuid}`;
      const fileUrl = await uploadFile(file, path);
      setForm({ ...form, [accessorKey]: fileUrl });
      toast.success(t("file_uploaded_successfully", "קובץ הועלה בהצלחה") || "File uploaded successfully");
    } catch (error) {
      console.error("Error uploading file:", error);
      toast.error(t("error_uploading_file", "שגיאה בהעלאת הקובץ") || "Error uploading file");
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl w-full max-h-[90vh]">
        <DialogHeader className="pb-4 border-b">
          <DialogTitle className="text-xl font-semibold text-foreground">
            {editMode ? t("edit") : t("add")}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0">
          <DialogBody className="space-y-6 py-6 overflow-y-auto">
            {dataColumns.map((col) => {
            const accessorKey = (col as any).accessorKey as string;
            const header = typeof col.header === "string" ? col.header : col.header?.toString() || accessorKey;
            const fieldType = (col.meta as any)?.fieldType;
            const options = (col.meta as any)?.options;
            const isDynamic = (col.meta as any)?.isDynamic || isDynamicField(accessorKey);
            const fieldDefinition = (col.meta as any)?.fieldDefinition;
            
            // Determine if field is required - check for required fields like firstname, lastname, password
            const isRequiredField = !isDynamic && (accessorKey === "firstname" || accessorKey === "lastname" || accessorKey === "password");
            
            // Get field value - handle dynamic fields differently
            const fieldValue = form[accessorKey] !== undefined ? form[accessorKey] : (defaultValues[accessorKey] || "");
            const dynamicFieldName = isDynamic ? getDynamicFieldName(accessorKey) : null;
            const isRelationshipField = relationshipFields?.[accessorKey];
            const relationshipOptions = isRelationshipField?.options || [];
            const columnForRelationship = dataColumns.find((col) => (col as any).accessorKey === accessorKey);
            const isSingleSelectRelationship = isRelationshipField && columnForRelationship && (columnForRelationship.meta as any)?.singleSelect === true;

            return (
              <div key={accessorKey} className="space-y-2">
                <label className="block text-sm font-medium text-foreground">
                  {header}
                  {((isDynamic && fieldDefinition?.required) || isRequiredField) && (
                    <span className="text-destructive mr-1">*</span>
                  )}
                </label>
                {isRelationshipField && isSingleSelectRelationship ? (
                  <Select
                    value={fieldValue && fieldValue.toString().trim() !== "" ? fieldValue.toString() : undefined}
                    onValueChange={(value) => {
                      setForm({ ...form, [accessorKey]: value && value.trim() !== "" ? value : null });
                    }}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder={t("select_option") || "בחר אפשרות..."} />
                    </SelectTrigger>
                    <SelectContent>
                      {relationshipOptions
                        .filter((option: { value: string; label: string }) => option.value !== "")
                        .map((option: { value: string; label: string }) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                ) : isRelationshipField ? (
                  <MultiSelect
                    options={relationshipOptions}
                    selected={Array.isArray(fieldValue) ? fieldValue : fieldValue ? [fieldValue] : []}
                    onSelect={(values) => {
                      setForm({ ...form, [accessorKey]: values });
                    }}
                    placeholder={t("select_options") || "בחר אפשרויות..."}
                  />
                ) : fieldType === "SELECT" && options ? (
                  <select
                    name={accessorKey}
                    value={fieldValue}
                    onChange={handleChange}
                    className="w-full h-10 px-3 py-2 text-sm border border-input rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 transition-colors"
                    required={isRequiredField || fieldDefinition?.required}
                  >
                    <option value="">{t("select_option")}</option>
                    {options.map((opt: any) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                ) : fieldType === "MULTI_SELECT" && options ? (
                  <MultiSelect
                    options={options}
                    selected={Array.isArray(fieldValue) ? fieldValue : fieldValue ? [fieldValue] : []}
                    onSelect={(values) => {
                      setForm({ ...form, [accessorKey]: values });
                    }}
                    placeholder={t("select_options") || "בחר אפשרויות..."}
                  />
                ) : fieldType === "PASSWORD" ? (
                  <Input
                    type="password"
                    name={accessorKey}
                    value={fieldValue}
                    onChange={handleChange}
                    className="w-full"
                    required={isRequiredField || fieldDefinition?.required}
                    autoComplete="new-password"
                  />
                ) : (isDynamic && fieldDefinition?.type === "CHECKBOX") ? (
                  <label className="flex items-center gap-2 cursor-pointer group">
                    <input
                      type="checkbox"
                      name={accessorKey}
                      checked={fieldValue === true || fieldValue === "true" || fieldValue === "1"}
                      onChange={(e) => {
                        setForm({ ...form, [accessorKey]: e.target.checked });
                      }}
                      className="w-4 h-4 rounded border-input text-primary focus:ring-2 focus:ring-ring focus:ring-offset-2 cursor-pointer"
                      required={isRequiredField || fieldDefinition?.required}
                    />
                    <span className="text-sm text-foreground">{t("yes_no", "כן / לא")}</span>
                  </label>
                ) : (isDateField(accessorKey) || (isDynamic && fieldDefinition?.type === "DATE")) ? (
                  <DateInput
                    name={accessorKey}
                    value={fieldValue || ""}
                    onChange={(value) => {
                      // DateInput returns ISO format (YYYY-MM-DD)
                      setForm({ ...form, [accessorKey]: value });
                    }}
                    required={isRequiredField || fieldDefinition?.required}
                    className="w-full"
                  />
                ) : (accessorKey === "email" || (isDynamic && fieldDefinition?.type === "EMAIL")) ? (
                  <Input
                    type="email"
                    name={accessorKey}
                    value={fieldValue}
                    onChange={handleChange}
                    className="w-full"
                    required={isRequiredField || fieldDefinition?.required}
                  />
                ) : (accessorKey === "phone" || (isDynamic && fieldDefinition?.type === "PHONE")) ? (
                  <Input
                    type="tel"
                    name={accessorKey}
                    value={fieldValue}
                    onChange={handleChange}
                    className="w-full"
                    required={isRequiredField || fieldDefinition?.required}
                  />
                ) : (isDynamic && fieldDefinition?.type === "TIME") ? (
                  <input
                    type="time"
                    name={accessorKey}
                    value={fieldValue}
                    onChange={handleChange}
                    className="w-full border border-border rounded-md placeholder:text-muted-foreground font-normal rtl:text-right ltr:text-left focus:outline-border outline-none px-3 py-2"
                    required={isRequiredField || fieldDefinition?.required}
                  />
                ) : (isDynamic && fieldDefinition?.type === "ADDRESS") ? (
                  <AddressInput
                    value={fieldValue || ""}
                    onChange={(address) => {
                      setForm({ ...form, [accessorKey]: address });
                    }}
                    placeholder={t("enter_address", "הכנס כתובת")}
                    className="w-full"
                    required={isRequiredField || fieldDefinition?.required}
                    name={accessorKey}
                  />
                ) : ((isDynamic && fieldDefinition?.type === "MONEY") || (col.meta as any)?.isMoney || (col.meta as any)?.fieldType === "MONEY") ? (
                  <div className="flex items-center gap-2">
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      name={accessorKey}
                      value={fieldValue}
                      onChange={handleChange}
                      className="w-full"
                      required={isRequiredField || fieldDefinition?.required}
                    />
                    <span className="text-sm font-medium whitespace-nowrap text-muted-foreground">₪</span>
                  </div>
                ) : (isDynamic && fieldDefinition?.type === "NUMBER") ? (
                  <Input
                    type="number"
                    name={accessorKey}
                    value={fieldValue}
                    onChange={handleChange}
                    className="w-full"
                    required={isRequiredField || fieldDefinition?.required}
                  />
                ) : ((isDynamic && fieldDefinition?.type === "IMAGE") || (col.meta as any)?.isImage || (col.meta as any)?.fieldType === "IMAGE") ? (
                  <FileUpload
                    value={fieldValue}
                    onChange={(file) => handleImageFieldChange(accessorKey, file)}
                    accept="image/*"
                    required={isRequiredField || fieldDefinition?.required}
                    label={header}
                  />
                ) : (isDynamic && fieldDefinition?.type === "FILE") ? (
                  <FileUpload
                    value={fieldValue}
                    onChange={(file) => handleFileFieldChange(accessorKey, file)}
                    accept="*/*"
                    required={isRequiredField || fieldDefinition?.required}
                    label={header}
                  />
                ) : (
                  <Input
                    type="text"
                    name={accessorKey}
                    value={fieldValue}
                    onChange={handleChange}
                    className="w-full"
                    required={isRequiredField || fieldDefinition?.required}
                  />
                )}
              </div>
            );
          })}
          </DialogBody>
          <DialogFooter className="pt-4 border-t gap-3">
            <Button 
              type="button" 
              variant="outline" 
              onClick={handleClose} 
              disabled={saving} 
              className="min-w-[100px] bg-red-500 hover:bg-red-600 text-white border-red-500 hover:border-red-600 shadow-md hover:shadow-lg transition-all duration-200 font-medium"
            >
              <X className="w-4 h-4 ml-2" />
              {t("cancel")}
            </Button>
            <Button 
              type="submit" 
              disabled={saving} 
              className="min-w-[100px]"
            >
              <Save className="w-4 h-4 ml-2" />
              {saving ? t("saving", "שומר...") : t("save")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

