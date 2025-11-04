import { useState, useEffect, ChangeEvent, FormEvent, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { ColumnDef } from "@tanstack/react-table";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogBody } from "@/components/ui/dialog";
import { Input } from "@/components/ui/Input";
import { formatDateForEdit, parseDateForSubmit, isDateValue } from "@/lib/dateUtils";

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
}: AddRecordDialogProps) {
  const { t } = useTranslation();
  const [form, setForm] = useState<Record<string, any>>({});
  const [saving, setSaving] = useState(false);

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
    // Check common date field names
    if (accessorKey === "birthdate" || accessorKey.toLowerCase().includes("date")) {
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
    if (open && editMode && editData) {
      // Convert dates to DD/MM/YYYY format for editing
      const formattedData: Record<string, any> = {};
      
      // Handle regular fields
      Object.keys(editData).forEach((key) => {
        if (key !== "dynamicFields") {
          const value = editData[key];
          if (isDateField(key) && value) {
            formattedData[key] = formatDateForEdit(value);
          } else {
            formattedData[key] = value;
          }
        }
      });
      
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
    } else if (open && !editMode) {
      setForm({});
    }
  }, [open, editMode, editData, dataColumns]);

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
      // Separate regular fields and dynamic fields
      const processedData: Record<string, any> = {};
      const dynamicFields: Record<string, any> = {};
      
      console.log("Form data before processing:", form);
      
      Object.keys(form).forEach((key) => {
        const value = form[key];
        
        if (isDynamicField(key)) {
          // Always include dynamic fields, even if empty
          const fieldName = getDynamicFieldName(key);
          const column = dataColumns.find((col) => (col as any).accessorKey === key);
          const isDate = column && (column.meta as any)?.isDate;
          
          if (isDate && value && typeof value === "string" && value !== "") {
            const isoDate = parseDateForSubmit(value);
            dynamicFields[fieldName] = isoDate || value;
          } else if (value !== "" && value !== null && value !== undefined) {
            dynamicFields[fieldName] = value;
          }
        } else {
          // Skip empty values for regular fields
          if (value === "" || value === null || value === undefined) {
            return;
          }
          
          if (isDateField(key) && value && typeof value === "string") {
            // Convert DD/MM/YYYY to YYYY-MM-DD for API
            const isoDate = parseDateForSubmit(value);
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
      
      // Merge with defaultValues, but preserve dynamicFields
      const finalData = {
        ...processedData,
        ...defaultValues,
        // Ensure dynamicFields is preserved even if defaultValues has it
        ...(processedData.dynamicFields && { dynamicFields: processedData.dynamicFields }),
      };
      
      console.log("Final data to send:", finalData);
      
      if (editMode && onEdit) {
        await onEdit(finalData);
      } else {
        await onAdd(finalData);
      }
      onOpenChange(false);
      setForm({});
    } catch (error) {
      console.error(editMode ? "Error editing record:" : "Error adding record:", error);
    } finally {
      setSaving(false);
    }
  };

  const handleClose = () => {
    setForm({});
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-lg w-full">
        <DialogHeader>
          <DialogTitle>{editMode ? t("edit") : t("add")}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0">
          <DialogBody className="space-y-4">
            {dataColumns.map((col) => {
            const accessorKey = (col as any).accessorKey as string;
            const header = typeof col.header === "string" ? col.header : col.header?.toString() || accessorKey;
            const fieldType = (col.meta as any)?.fieldType;
            const options = (col.meta as any)?.options;
            const isDynamic = (col.meta as any)?.isDynamic || isDynamicField(accessorKey);
            const fieldDefinition = (col.meta as any)?.fieldDefinition;
            
            // Get field value - handle dynamic fields differently
            const fieldValue = form[accessorKey] || "";
            const dynamicFieldName = isDynamic ? getDynamicFieldName(accessorKey) : null;

            return (
              <div key={accessorKey}>
                <label className="block mb-1 font-medium">
                  {header}
                  {isDynamic && fieldDefinition?.required && <span className="text-red-500 ml-1">*</span>}
                </label>
                {fieldType === "SELECT" && options ? (
                  <select
                    name={accessorKey}
                    value={fieldValue}
                    onChange={handleChange}
                    className="w-full border rounded px-2 py-1"
                    required={fieldDefinition?.required}
                  >
                    <option value="">{t("select_option")}</option>
                    {options.map((opt: any) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                ) : (isDateField(accessorKey) || (isDynamic && fieldDefinition?.type === "DATE")) ? (
                  <input
                    type="text"
                    name={accessorKey}
                    value={fieldValue}
                    onChange={handleChange}
                    placeholder="DD/MM/YYYY"
                    pattern="\d{2}/\d{2}/\d{4}"
                    title="Please enter date in DD/MM/YYYY format"
                    className="w-full border border-border rounded-md placeholder:text-muted-foreground font-normal rtl:text-right ltr:text-left focus:outline-border outline-none px-3 py-2"
                    required={fieldDefinition?.required}
                  />
                ) : (accessorKey === "email" || (isDynamic && fieldDefinition?.type === "EMAIL")) ? (
                  <Input
                    type="email"
                    name={accessorKey}
                    value={fieldValue}
                    onChange={handleChange}
                    className="w-full"
                    required={fieldDefinition?.required}
                  />
                ) : (accessorKey === "phone" || (isDynamic && fieldDefinition?.type === "PHONE")) ? (
                  <Input
                    type="tel"
                    name={accessorKey}
                    value={fieldValue}
                    onChange={handleChange}
                    className="w-full"
                    required={fieldDefinition?.required}
                  />
                ) : (isDynamic && fieldDefinition?.type === "NUMBER") ? (
                  <Input
                    type="number"
                    name={accessorKey}
                    value={fieldValue}
                    onChange={handleChange}
                    className="w-full"
                    required={fieldDefinition?.required}
                  />
                ) : (
                  <Input
                    type="text"
                    name={accessorKey}
                    value={fieldValue}
                    onChange={handleChange}
                    className="w-full"
                    required={fieldDefinition?.required}
                  />
                )}
              </div>
            );
          })}
          </DialogBody>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={handleClose} disabled={saving}>
              {t("cancel")}
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? t("saving") || "Saving..." : t("save")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

