// components/data-table/data-table-add-button.tsx
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/Input";

interface DataTableAddButtonProps {
  showAddButton: any;
  onToggleAddRow?: any;
  columns?: any[];
  onAdd: any;
  excludeFields?: any[];
}

export function DataTableAddButton({ showAddButton, onToggleAddRow, columns = [], onAdd, excludeFields = [] }: DataTableAddButtonProps) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({});
  const [saving, setSaving] = useState(false);

  // Exclude fields by name
  const excludeNames = excludeFields.map(f => f.name);
  const defaultValues = Object.fromEntries(excludeFields.map(f => [f.name, f.defaultValue]));

  // Only show data columns (exclude select/duplicate/actions and excluded fields)
  const dataColumns = columns.filter(
    (col) => col.accessorKey && !["select", "duplicate", "actions"].includes(col.accessorKey) && !excludeNames.includes(col.accessorKey)
  );

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    await onAdd({ ...form, ...defaultValues });
    setSaving(false);
    setOpen(false);
    setForm({});
  };

  if (!showAddButton) return null;

  return (
    <>
      <Button 
        variant="outline" 
        onClick={() => setOpen(true)}
        className="bg-green-600 hover:bg-green-700 text-white hover:text-white border-green-600 hover:border-green-700 shadow-md hover:shadow-lg transition-all duration-200 font-medium"
      >
        <Plus className="w-4 h-4 mr-2" /> הוסף
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg w-full p-6">
          <DialogHeader>
            <DialogTitle>הוסף רשומה חדשה</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            {dataColumns.map((col) => (
  <div key={col.accessorKey}>
    <label className="block mb-1 font-medium">{col.header}</label>
    {col.cellType === "select" && col.options ? (
      <select
        name={col.accessorKey}
        value={form[col.accessorKey] || ""}
        onChange={handleChange}
        className="w-full border rounded px-2 py-1"
        required
      >
        <option value="">בחר</option>
        {col.options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    ) : (
      <Input
        name={col.accessorKey}
        value={form[col.accessorKey] || ""}
        onChange={handleChange}
        className="w-full"
        required
      />
    )}
  </div>
))}
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpen(false)} className="bg-red-500 hover:bg-red-600 text-white border-red-500 hover:border-red-600 shadow-md hover:shadow-lg transition-all duration-200 font-medium">
                ביטול
              </Button>
              <Button type="submit" disabled={saving}>
                שמור
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}

export default DataTableAddButton;
