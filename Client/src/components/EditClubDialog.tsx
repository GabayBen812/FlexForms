import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import type { FieldType } from "@/types/ui/data-table-types";
import { MacabiClub } from "@/types/macabiClub/macabiClub";
import { ColumnDef } from "@tanstack/react-table";

type EditClubDialogProps = {
  open: boolean;
  onClose: () => void;
  rowData: MacabiClub | null;
  columns: ColumnDef<MacabiClub>[];
  onSave: (data: MacabiClub) => void;
};

export function EditClubDialog({ open, onClose, rowData, columns, onSave }: EditClubDialogProps) {
  const [formData, setFormData] = useState<MacabiClub | null>(null);
    const { t } = useTranslation();

  useEffect(() => {
    if (rowData) {
      setFormData({ ...rowData });
    }else {
      // Initialize with empty values for create mode
      const emptyData = {} as MacabiClub;
      columns.forEach(col => {
        const key = (col as any).accessorKey as keyof MacabiClub | undefined;
        if (key) {
          emptyData[key] = "" as any;
        }
      });
      setFormData(emptyData);
    }
  }, [rowData, columns]);

  const handleChange = (key: keyof MacabiClub, value: any) => {
    if (formData) {
      setFormData({ ...formData, [key]: value });
    }
  };

  const handleSubmit = () => {
    if (formData) {
      onSave(formData);
      onClose();
    }
  };

  if (!formData) return null;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto p-6">
        <DialogHeader style={{ position: "sticky", top: 0, zIndex: 5, backgroundColor: "white" }}>
          <DialogTitle>{rowData?._id 
              ? `${t("edit_club")} - ${rowData.clubName || ""}`
              : t("add_new_club")}</DialogTitle>
        </DialogHeader>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4">
          {columns
            .filter(col => (col as any).accessorKey && !((col.meta as any)?.hidden === true))
            .map(column => {
              const accessor = (column as any).accessorKey as keyof MacabiClub;
              const meta = column.meta as any;
              const value = formData[accessor];
              const label = column.header?.toString() || accessor;

              return (
                <div key={accessor} className="space-y-2">
                  <label className="block text-sm font-medium">{label}</label>
                  
                  {meta?.fieldType === "SELECT" ? (
                    <select
                      className="w-full p-2 border rounded"
                      value={value as string || ''}
                      onChange={(e) => handleChange(accessor, e.target.value)}
                    >
                      {meta.options?.map(option => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <input
                      type="text"
                      className="w-full p-2 border rounded"
                      value={value as string || ''}
                      onChange={(e) => handleChange(accessor, e.target.value)}
                    />
                  )}
                </div>
              );
            })}
        </div>
        
        <DialogFooter style={{ position: "sticky", bottom: 0 }}>
          <Button onClick={handleSubmit}>{t("save_changes")}</Button>
          <Button variant="outline" onClick={onClose} className="bg-red-500 hover:bg-red-600 text-white border-red-500 hover:border-red-600 shadow-md hover:shadow-lg transition-all duration-200 font-medium">{t("cancel")}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}