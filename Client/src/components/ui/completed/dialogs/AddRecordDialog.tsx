import { useState } from "react";
import { useTranslation } from "react-i18next";
import { ColumnDef } from "@tanstack/react-table";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/Input";

interface AddRecordDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  columns: ColumnDef<any>[];
  onAdd: (data: any) => Promise<void>;
  excludeFields?: string[];
  defaultValues?: Record<string, any>;
}

export function AddRecordDialog({
  open,
  onOpenChange,
  columns,
  onAdd,
  excludeFields = [],
  defaultValues = {},
}: AddRecordDialogProps) {
  const { t } = useTranslation();
  const [form, setForm] = useState<Record<string, any>>({});
  const [saving, setSaving] = useState(false);

  // Filter columns to show only visible data fields
  const dataColumns = columns.filter(
    (col) =>
      col.accessorKey &&
      !["select", "duplicate", "actions"].includes(col.accessorKey as string) &&
      !excludeFields.includes(col.accessorKey as string) &&
      !(col.meta as any)?.hidden
  );

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await onAdd({ ...form, ...defaultValues });
      setOpen(false);
      setForm({});
    } catch (error) {
      console.error("Error adding record:", error);
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
          <DialogTitle>{t("add")}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          {dataColumns.map((col) => {
            const accessorKey = col.accessorKey as string;
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
                ) : accessorKey === "birthdate" ? (
                  <Input
                    type="date"
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

