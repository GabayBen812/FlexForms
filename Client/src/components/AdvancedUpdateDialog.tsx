import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Button } from "./ui/button";
import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Input } from "./ui/Input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { SelectPortal } from "@radix-ui/react-select";
import { ColumnDef } from "@tanstack/react-table";
import { MultiSelect } from "@/components/ui/multi-select";
import { Badge } from "@/components/ui/badge";

type FieldType = "TEXT" | "SELECT" | "MULTI_SELECT" | "DATE" | "FILE" | "CURRENCY" | string;

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
  onUpdate?: (field: string, value: string | string[]) => Promise<void> | void;
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
  const [updateValue, setUpdateValue] = useState<string | string[]>("");
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
  const normalizedOptions = useMemo(
    () =>
      Array.isArray(options)
        ? options.map((option: any) => {
            if (typeof option === "string") {
              return { value: option, label: option };
            }
            const value = option?.value ?? option?.id ?? option;
            const label = option?.label ?? option?.name ?? String(value ?? "");
            return { value: String(value ?? ""), label: String(label) };
          })
        : [],
    [options]
  );
  const isMultiSelectField = fieldType === "MULTI_SELECT";
  const selectedFieldLabel = useMemo(() => {
    return selectedField ? toHeaderLabel(columnDef?.header) : "";
  }, [selectedField, columnDef]);
  const fieldTypeFallbackLabel = useMemo(() => {
    switch (fieldType) {
      case "SELECT":
        return t("field_type_select", "בחירה");
      case "MULTI_SELECT":
        return t("field_type_multi_select", "בחירה מרובה");
      case "DATE":
        return t("field_type_date", "תאריך");
      case "TEXT":
        return t("field_type_text", "טקסט");
      case "FILE":
        return t("field_type_file", "קובץ");
      case "CURRENCY":
        return t("field_type_currency", "מטבע");
      default:
        return fieldType ? String(fieldType) : "";
    }
  }, [fieldType, t]);
  const badgeLabel = fieldType
    ? t(`field_types:${String(fieldType).toLowerCase()}`, fieldTypeFallbackLabel)
    : "";

  useEffect(() => {
    if (!selectedField) {
      setUpdateValue("");
      return;
    }

    if (isMultiSelectField) {
      setUpdateValue((prev) => (Array.isArray(prev) ? prev : []));
    } else {
      setUpdateValue((prev) => (typeof prev === "string" ? prev : ""));
    }
  }, [selectedField, isMultiSelectField]);

  const isValueProvided = useMemo(() => {
    if (Array.isArray(updateValue)) {
      return updateValue.length > 0;
    }
    return typeof updateValue === "string" && updateValue.trim().length > 0;
  }, [updateValue]);

  const handleUpdate = async () => {
    if (!selectedField || !isValueProvided || isSubmitting) return;

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
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden border border-zinc-200/80 bg-gradient-to-br from-white via-zinc-50 to-white p-0 shadow-2xl dark:border-zinc-800/80 dark:from-zinc-900 dark:via-zinc-950 dark:to-zinc-900">
        <DialogHeader className="px-6 pt-6 text-center">
          <DialogTitle className="text-2xl font-semibold tracking-tight">
            {t("advanced_update", "עדכון מתקדם")}
          </DialogTitle>
          <p className="mt-2 text-sm text-muted-foreground">
            {t("advanced_update_hint", "בחר שדה אחד והגדר ערך חדש לכל הרשומות שבחרת.")}
          </p>
        </DialogHeader>
        <div className="space-y-6 px-6 pb-6">
          <div className="rounded-2xl border border-dashed border-primary/30 bg-primary/5 px-4 py-4 text-center text-primary dark:border-primary/20 dark:bg-primary/10">
            <p className="text-sm font-medium">
              {t("selected_rows_total_to_update", "כמות רשומות לעדכון")}
            </p>
            <p className="text-3xl font-semibold">{selectedRowCount}</p>
          </div>

          <div className="space-y-3">
            <Label className="block text-right text-base font-medium text-foreground">
              {t("select_field_to_update", "בחר שדה לעדכון")}
            </Label>
            <Select
              value={selectedField ?? undefined}
              onValueChange={(value) => {
                setSelectedField(value);
              }}
              disabled={isSubmitting}
            >
              <SelectTrigger className="h-12 w-full rounded-xl border border-primary/30 bg-white text-base font-medium shadow-sm transition-all hover:border-primary/50 focus:ring-2 focus:ring-primary/30 disabled:cursor-not-allowed disabled:opacity-70 dark:bg-zinc-900">
                {selectedField ? (
                  <div className="flex w-full items-center justify-between">
                    <span className="truncate text-right">{selectedFieldLabel}</span>
                    {badgeLabel && (
                      <Badge variant="outline" className="rounded-full border-primary/30 bg-primary/10 text-xs text-primary">
                        {badgeLabel}
                      </Badge>
                    )}
                  </div>
                ) : (
                  <span className="text-muted-foreground">
                    {t("select_field_placeholder", "בחר שדה מתוך הרשימה")}
                  </span>
                )}
              </SelectTrigger>
              <SelectPortal>
                <SelectContent className="max-h-[320px] max-w-[700px] overflow-y-auto rounded-xl border border-primary/20 bg-white p-2 text-base shadow-lg dark:bg-zinc-900">
                  {columns
                    .filter(
                      (col) =>
                        col.id !== "select" &&
                        col.id !== "edit" &&
                        !((col.meta as any)?.hidden)
                    )
                    .map((col) => (
                      <SelectItem
                        className="cursor-pointer rounded-lg px-3 py-2 text-right text-base hover:bg-primary/10 focus:bg-primary/10"
                        key={col.id}
                        value={(col as any).accessorKey || col.id}
                      >
                        {toHeaderLabel(col.header)}
                      </SelectItem>
                    ))}
                </SelectContent>
              </SelectPortal>
            </Select>
          </div>

          {selectedField && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-base font-medium text-foreground">
                  {t("new_value_to_update", "ערך לעדכון")}
                </Label>
                {isMultiSelectField && (
                  <span className="text-xs text-muted-foreground">
                    {t("multi_select_hint", "ניתן לבחור כמה אפשרויות")}
                  </span>
                )}
              </div>
              {isMultiSelectField ? (
                <MultiSelect
                  options={normalizedOptions}
                  selected={Array.isArray(updateValue) ? updateValue : []}
                  onSelect={setUpdateValue}
                  placeholder={t("select_options", "בחר אפשרויות")}
                  className="rounded-xl border border-primary/30 bg-white text-base font-medium hover:border-primary/50 dark:bg-zinc-900"
                />
              ) : fieldType === "SELECT" ? (
                <Select
                  value={typeof updateValue === "string" ? updateValue : ""}
                  onValueChange={(value) => setUpdateValue(value)}
                  disabled={isSubmitting}
                >
                  <SelectTrigger className="h-12 w-full rounded-xl border border-primary/30 bg-white text-base font-medium shadow-sm transition-all hover:border-primary/50 focus:ring-2 focus:ring-primary/30 disabled:cursor-not-allowed disabled:opacity-70 dark:bg-zinc-900">
                    <SelectValue placeholder={t("select_value", "בחר ערך")} />
                  </SelectTrigger>
                  <SelectContent className="max-h-72 rounded-xl border border-primary/20 bg-white text-base shadow-lg dark:bg-zinc-900">
                    {normalizedOptions.map((option) => (
                      <SelectItem
                        className="cursor-pointer rounded-lg px-3 py-2 text-right text-base hover:bg-primary/10 focus:bg-primary/10"
                        key={option.value}
                        value={option.value}
                      >
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <Input
                  type="text"
                  value={typeof updateValue === "string" ? updateValue : ""}
                  onChange={(e) => setUpdateValue(e.target.value)}
                  placeholder={t("enter_new_value", "הקלד ערך חדש")}
                  className="h-12 w-full rounded-xl border border-primary/30 bg-white px-4 text-base shadow-sm transition-all hover:border-primary/50 focus:ring-2 focus:ring-primary/30 disabled:cursor-not-allowed disabled:opacity-70 dark:bg-zinc-900"
                  disabled={isSubmitting}
                />
              )}
            </div>
          )}

          <div className="mt-6 flex flex-col-reverse items-center justify-center gap-3 sm:flex-row">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="min-w-[140px] rounded-full border-2 border-destructive/60 bg-transparent px-6 py-2 text-base font-semibold text-destructive shadow-sm transition-all hover:-translate-y-0.5 hover:border-destructive hover:bg-destructive/10 hover:shadow-lg dark:bg-transparent"
              disabled={isSubmitting}
            >
              {t("cancel", "בטל")}
            </Button>
            <Button
              onClick={handleUpdate}
              disabled={!selectedField || !isValueProvided}
              loading={isSubmitting}
              className="min-w-[160px] rounded-full bg-gradient-to-r from-blue-600 via-purple-600 to-blue-500 px-6 py-2 text-base font-semibold text-white shadow-lg transition-all hover:-translate-y-0.5 hover:from-blue-600 hover:via-purple-500 hover:to-blue-400 hover:text-white hover:shadow-xl disabled:cursor-not-allowed disabled:bg-gradient-to-r disabled:from-zinc-300 disabled:via-zinc-300 disabled:to-zinc-300 disabled:text-zinc-500"
            >
              {t("update", "עדכן")}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};