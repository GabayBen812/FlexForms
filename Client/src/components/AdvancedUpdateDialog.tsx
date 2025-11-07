import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Button } from "./ui/button";
import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Input } from "./ui/Input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { SelectPortal } from "@radix-ui/react-select";
import { ColumnDef } from "@tanstack/react-table";

type FieldType = "TEXT" | "SELECT" | "DATE" | "FILE" | "CURRENCY" | string;

const toHeaderLabel = (header: ColumnDef<any>["header"]) => {
  if (typeof header === "string") return header;
  if (typeof header === "function") {
    try {
      const result = header({} as any);
      if (typeof result === "string") return result;
    } catch (error) {
      return "";
    }
  }
  if (typeof header === "object" && "props" in (header as any)) {
    return String((header as any).props?.children ?? "");
  }
  return String(header ?? "");
};

interface AdvancedUpdateDialogProps<TData> {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  columns: ColumnDef<TData>[];
  onUpdate?: (field: string, value: string) => Promise<void> | void;
  selectedRowCount: number;
}

export const AdvancedUpdateDialog = <TData,>({
  open,
  onOpenChange,
  columns,
  onUpdate,
  selectedRowCount,
}: AdvancedUpdateDialogProps<TData>) => {
  const { t } = useTranslation();
  const [selectedField, setSelectedField] = useState<string | null>(null);
  const [updateValue, setUpdateValue] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!open) {
      setSelectedField(null);
      setUpdateValue("");
    }
  }, [open]);

  const columnDef = useMemo(() => {
    return columns.find(
      (col) => (col as any).accessorKey === selectedField || col.id === selectedField
    );
  }, [selectedField, columns]);

  const fieldMeta = (columnDef?.meta as any) || {};
  const fieldType: FieldType = fieldMeta.fieldType || "TEXT";
  const options = fieldMeta.options || [];

  const handleUpdate = async () => {
    if (!selectedField || updateValue === "" || isSubmitting) return;

    if (!onUpdate) {
      onOpenChange(false);
      return;
    }

    try {
      setIsSubmitting(true);
      await onUpdate(selectedField, updateValue);
      onOpenChange(false);
    } catch (error) {
      console.error("AdvancedUpdateDialog failed to update field", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (isSubmitting) return;
        onOpenChange(nextOpen);
      }}
    >
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto p-6">
        <DialogHeader>
          <DialogTitle className="text-lg">{t("advanced_update")}</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
             <p className="text-lg text-center">
                {t("selected_rows_total_to_update", "כמות רשומות לעדכון")}: {selectedRowCount}
            </p>
          <div>
            <Label className="text-lg text-center">{t("select_field_to_update", "בחר שדה לעדכון")}</Label>
            <Select
              value={selectedField ?? undefined}
              onValueChange={setSelectedField}
              disabled={isSubmitting}
            >
            <SelectTrigger className="w-full h-12" disabled={isSubmitting}>
                {selectedField
                ? toHeaderLabel(columns.find(col => (col as any).accessorKey === selectedField || col.id === selectedField)?.header)
                : t("select_field_to_update", "בחר שדה לעדכון")}
            </SelectTrigger>
            <SelectPortal>
            <SelectContent  className="max-w-[700px] max-h-[300px] text-center" >
                {columns
                .filter(col => col.id !== "select" && col.id !== "edit" && !((col.meta as any)?.hidden))
                .map(col => (
                    <SelectItem className="text-base text-center" key={col.id} value={(col as any).accessorKey || col.id}>
                    {toHeaderLabel(col.header)}
                    </SelectItem>
                ))}
            </SelectContent>
            </SelectPortal>
            </Select>
          </div>
          
          {selectedField && (
            <div>
              <Label className="text-lg text-center">{t("new_value_to_update", "ערך לעדכון")}</Label>
              {fieldType === "SELECT" ? (
                <Select value={updateValue} onValueChange={setUpdateValue} disabled={isSubmitting}>
                    <SelectTrigger className="w-full" disabled={isSubmitting}>
                    <SelectValue placeholder={t("select_value", "בחר ערך")} />
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
                    disabled={isSubmitting}
                />
                )}
            </div>
          )}
        </div>
        
        <div className="flex justify-end gap-2">
          <Button 
            variant="outline" 
            onClick={() => onOpenChange(false)}
            className="bg-red-500 hover:bg-red-600 text-white border-red-500 hover:border-red-600 shadow-md hover:shadow-lg transition-all duration-200 font-medium"
            disabled={isSubmitting}
          >
            {t("cancel", "בטל")}
          </Button>
          <Button
            onClick={handleUpdate}
            disabled={!selectedField || updateValue === ""}
            loading={isSubmitting}
          >
            {t("update", "עדכן")}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};