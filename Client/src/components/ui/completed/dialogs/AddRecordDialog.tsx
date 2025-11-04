import { useState, useEffect, ChangeEvent, FormEvent, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { ColumnDef } from "@tanstack/react-table";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
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

  // Initialize form with edit data when dialog opens in edit mode
  useEffect(() => {
    if (open && editMode && editData) {
      // Convert dates to DD/MM/YYYY format for editing
      const formattedData: Record<string, any> = {};
      Object.keys(editData).forEach((key) => {
        const value = editData[key];
        if (isDateField(key) && value) {
          formattedData[key] = formatDateForEdit(value);
        } else {
          formattedData[key] = value;
        }
      });
      setForm(formattedData);
    } else if (open && !editMode) {
      setForm({});
    }
  }, [open, editMode, editData]);

  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      // Convert DD/MM/YYYY dates back to ISO format for submission
      const processedData: Record<string, any> = {};
      Object.keys(form).forEach((key) => {
        const value = form[key];
        if (isDateField(key) && value && typeof value === "string") {
          // Convert DD/MM/YYYY to YYYY-MM-DD for API
          const isoDate = parseDateForSubmit(value);
          processedData[key] = isoDate || value;
        } else {
          processedData[key] = value;
        }
      });
      
      if (editMode && onEdit) {
        await onEdit({ ...processedData, ...defaultValues });
      } else {
        await onAdd({ ...processedData, ...defaultValues });
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
      <DialogContent className="max-w-lg w-full p-6">
        <DialogHeader>
          <DialogTitle>{editMode ? t("edit") : t("add")}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          {dataColumns.map((col) => {
            const accessorKey = (col as any).accessorKey as string;
            const header = typeof col.header === "string" ? col.header : col.header?.toString() || accessorKey;
            const fieldType = (col.meta as any)?.fieldType;
            const options = (col.meta as any)?.options;

            return (
              <div key={accessorKey}>
                <label className="block mb-1 font-medium">{header}</label>
                {fieldType === "SELECT" && options ? (
                  <select
                    name={accessorKey}
                    value={form[accessorKey] || ""}
                    onChange={handleChange}
                    className="w-full border rounded px-2 py-1"
                    required
                  >
                    <option value="">{t("select_option")}</option>
                    {options.map((opt: any) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                ) : isDateField(accessorKey) ? (
                  <input
                    type="text"
                    name={accessorKey}
                    value={form[accessorKey] || ""}
                    onChange={handleChange}
                    placeholder="DD/MM/YYYY"
                    pattern="\d{2}/\d{2}/\d{4}"
                    title="Please enter date in DD/MM/YYYY format"
                    className="w-full border border-border rounded-md placeholder:text-muted-foreground font-normal rtl:text-right ltr:text-left focus:outline-border outline-none px-3 py-2"
                    required
                  />
                ) : accessorKey === "email" ? (
                  <Input
                    type="email"
                    name={accessorKey}
                    value={form[accessorKey] || ""}
                    onChange={handleChange}
                    className="w-full"
                    required
                  />
                ) : accessorKey === "phone" ? (
                  <Input
                    type="tel"
                    name={accessorKey}
                    value={form[accessorKey] || ""}
                    onChange={handleChange}
                    className="w-full"
                    required
                  />
                ) : (
                  <Input
                    type="text"
                    name={accessorKey}
                    value={form[accessorKey] || ""}
                    onChange={handleChange}
                    className="w-full"
                    required
                  />
                )}
              </div>
            );
          })}
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

