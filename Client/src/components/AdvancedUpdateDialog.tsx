// Add this above the clubs component
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { ChevronDown } from "lucide-react";
import { Button } from "./ui/button";
import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { color } from "framer-motion";
import { Input } from "./ui/Input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { SelectPortal } from "@radix-ui/react-select";

interface AdvancedUpdateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  columns: ColumnDef<MacabiClub>[];
  onUpdate: (field: string, value: any) => void;
  selectedRowCount: number;
}

export const AdvancedUpdateDialog = ({
  open,
  onOpenChange,
  columns,
  onUpdate,
  selectedRowCount
}: AdvancedUpdateDialogProps) => {
  const { t } = useTranslation();
  const [selectedField, setSelectedField] = useState<string | null>(null);
  const [updateValue, setUpdateValue] = useState<any>("");

  
  useEffect(() => {
    if (!open) {
      setSelectedField(null);
      setUpdateValue("");
    }
  }, [open]);

  const columnDef = useMemo(() => {
    return columns.find(
      col => col.accessorKey === selectedField || col.id === selectedField
    );
  }, [selectedField, columns]);

  const fieldType = columnDef?.meta?.fieldType || "TEXT";
  const options = columnDef?.meta?.options || [];

  const handleUpdate = () => {
    if (!selectedField) return;
    onUpdate(selectedField, updateValue);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto p-6">
        <DialogHeader>
          <DialogTitle className="text-lg">{t("advanced_update")}</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
             <p className="text-lg text-center">
                {t("selected_rows_total_to_update")}: {selectedRowCount}
            </p>
          <div>
            <Label className="text-lg text-center">{t("select_field_to_update")}</Label>
            <Select  value={selectedField ?? undefined} onValueChange={setSelectedField}>
            <SelectTrigger className="w-full h-12">
                {selectedField
                ? columns.find(col => col.accessorKey === selectedField || col.id === selectedField)?.header?.toString()
                : t("select_field_to_update")}
            </SelectTrigger>
            <SelectPortal>
            <SelectContent  className="max-w-[700px] max-h-[300px] text-center" >
                {columns
                .filter(col => col.id !== "select" && col.id !== "edit" && !col.meta?.hidden)
                .map(col => (
                    <SelectItem className="text-base text-center" key={col.id} value={col.accessorKey || col.id}>
                    {col.header?.toString()}
                    </SelectItem>
                ))}
            </SelectContent>
            </SelectPortal>
            </Select>
          </div>
          
          {selectedField && (
            <div>
              <Label className="text-lg text-center">{t("new_value_to_update")}</Label>
              {fieldType === "SELECT" ? (
                <Select value={updateValue} onValueChange={setUpdateValue}>
                    <SelectTrigger className="w-full">
                    <SelectValue placeholder={t("select_value")} />
                    </SelectTrigger>
                    <SelectContent>
                    {options.map((option: any) => (
                        <SelectItem className="text-base" key={option.value} value={option.value}>
                        {option.label}
                        </SelectItem>
                    ))}
                    </SelectContent>
                </Select>
                ) : (
                <Input
                    type="text"
                    value={updateValue}
                    onChange={(e) => setUpdateValue(e.target.value)}
                    className="w-full p-2 border rounded mt-1"
                />
                )}
            </div>
          )}
        </div>
        
        <div className="flex justify-end gap-2">
          <Button 
            variant="outline" 
            onClick={() => onOpenChange(false)}
          >
            {t("cancel")}
          </Button>
          <Button
            onClick={handleUpdate}
            disabled={!selectedField || updateValue === ""}
          >
            {t("update")}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};