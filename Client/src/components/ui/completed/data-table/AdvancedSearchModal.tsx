import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/Input";
import { useTranslation } from "react-i18next";
import { ColumnDef } from '@tanstack/react-table';
import { MultiSelect } from "@/components/ui/multi-select";
import { Check, RotateCcw, X } from "lucide-react";

interface AdvancedSearchModalProps<T> {
  open: boolean;
  onClose: () => void;
  columns: ColumnDef<T>[];
  onApply: (filters: Record<string, any>) => void;
  initialFilters?: Record<string, any>;
}

export function AdvancedSearchModal<T = any>({ open, onClose, columns, onApply, initialFilters = {} }: AdvancedSearchModalProps<T>) {
  const { t } = useTranslation();
  const [filters, setFilters] = useState<Record<string, any>>(initialFilters);

  // Reset filters when initialFilters change (e.g., when modal opens)
  useEffect(() => {
    if (open) {
      setFilters(initialFilters);
    }
  }, [open, initialFilters]);

  const handleChange = (key: string, value: any) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const handleReset = () => {
    setFilters({});
  };

  // Helper to check if a field is dynamic
  const isDynamicField = (accessorKey: string): boolean => {
    return accessorKey.startsWith("dynamicFields.");
  };

  // Get dynamic field name from accessorKey
  const getDynamicFieldName = (accessorKey: string): string => {
    return accessorKey.replace("dynamicFields.", "");
  };

  // Render appropriate input based on field type and meta
  const renderSearchField = (col: ColumnDef<T>, accessorKey: string) => {
    const meta = (col.meta as any) || {};
    const fieldType = meta.fieldType;
    const options = meta.options;
    const fieldDefinition = meta.fieldDefinition;
    const isDynamic = meta.isDynamic || isDynamicField(accessorKey);
    const isDate = meta.isDate;
    const isMoney = meta.isMoney;
    const isTime = meta.isTime;
    
    // Get field value
    const fieldValue = filters[accessorKey] !== undefined ? filters[accessorKey] : "";

    // Handle SELECT field type
    if (fieldType === "SELECT" && options && Array.isArray(options)) {
      return (
        <select
          value={fieldValue || ""}
          onChange={(e) => handleChange(accessorKey, e.target.value)}
          className="w-full rounded-lg border border-zinc-300 dark:border-zinc-700 px-3 py-2 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:ring-2 focus:ring-primary"
        >
          <option value="">{t("all", "הכל")}</option>
          {options.map((opt: any) => (
            <option key={opt.value || opt} value={opt.value || opt}>
              {opt.label || opt}
            </option>
          ))}
        </select>
      );
    }

    // Handle MULTI_SELECT field type
    if (fieldType === "MULTI_SELECT" && options && Array.isArray(options)) {
      const selectedValues = Array.isArray(fieldValue) ? fieldValue : fieldValue ? [fieldValue] : [];
      return (
        <MultiSelect
          options={options}
          selected={selectedValues}
          onSelect={(values) => handleChange(accessorKey, values)}
          placeholder={t("select_options", "בחר אפשרויות...")}
        />
      );
    }

    // Handle CHECKBOX field type
    if (fieldType === "CHECKBOX" || (isDynamic && fieldDefinition?.type === "CHECKBOX")) {
      return (
        <select
          value={fieldValue || ""}
          onChange={(e) => handleChange(accessorKey, e.target.value === "" ? undefined : e.target.value === "true")}
          className="w-full rounded-lg border border-zinc-300 dark:border-zinc-700 px-3 py-2 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:ring-2 focus:ring-primary"
        >
          <option value="">{t("all", "הכל")}</option>
          <option value="true">{t("yes", "כן")}</option>
          <option value="false">{t("no", "לא")}</option>
        </select>
      );
    }

    // Handle DATE field type
    if (isDate || (isDynamic && fieldDefinition?.type === "DATE")) {
      return (
        <Input
          type="text"
          value={fieldValue}
          onChange={(e) => handleChange(accessorKey, e.target.value)}
          placeholder="DD/MM/YYYY"
          className="rounded-lg border-zinc-300 dark:border-zinc-700 focus:ring-2 focus:ring-primary"
        />
      );
    }

    // Handle TIME field type
    if (isTime || (isDynamic && fieldDefinition?.type === "TIME")) {
      return (
        <Input
          type="time"
          value={fieldValue}
          onChange={(e) => handleChange(accessorKey, e.target.value)}
          className="rounded-lg border-zinc-300 dark:border-zinc-700 focus:ring-2 focus:ring-primary"
        />
      );
    }

    // Handle MONEY field type
    if (isMoney || (isDynamic && fieldDefinition?.type === "MONEY")) {
      return (
        <div className="flex items-center gap-2">
          <Input
            type="number"
            step="0.01"
            value={fieldValue}
            onChange={(e) => handleChange(accessorKey, e.target.value)}
            placeholder={t("enter_amount", "הכנס סכום")}
            className="rounded-lg border-zinc-300 dark:border-zinc-700 focus:ring-2 focus:ring-primary"
          />
          <span className="text-sm font-medium whitespace-nowrap">₪</span>
        </div>
      );
    }

    // Handle NUMBER field type
    if (isDynamic && fieldDefinition?.type === "NUMBER") {
      return (
        <Input
          type="number"
          value={fieldValue}
          onChange={(e) => handleChange(accessorKey, e.target.value)}
          placeholder={t("enter_number", "הכנס מספר")}
          className="rounded-lg border-zinc-300 dark:border-zinc-700 focus:ring-2 focus:ring-primary"
        />
      );
    }

    // Handle EMAIL field type
    if (isDynamic && fieldDefinition?.type === "EMAIL") {
      return (
        <Input
          type="email"
          value={fieldValue}
          onChange={(e) => handleChange(accessorKey, e.target.value)}
          placeholder={t("search_by_x", { x: t(col.header as string) })}
          className="rounded-lg border-zinc-300 dark:border-zinc-700 focus:ring-2 focus:ring-primary"
        />
      );
    }

    // Handle PHONE field type
    if (isDynamic && fieldDefinition?.type === "PHONE") {
      return (
        <Input
          type="tel"
          value={fieldValue}
          onChange={(e) => handleChange(accessorKey, e.target.value)}
          placeholder={t("search_by_x", { x: t(col.header as string) })}
          className="rounded-lg border-zinc-300 dark:border-zinc-700 focus:ring-2 focus:ring-primary"
        />
      );
    }

    // Default: TEXT input for TEXT, ADDRESS, and other field types
    return (
      <Input
        type="text"
        value={fieldValue}
        onChange={(e) => handleChange(accessorKey, e.target.value)}
        placeholder={t("search_by_x", { x: t(col.header as string) })}
        className="rounded-lg border-zinc-300 dark:border-zinc-700 focus:ring-2 focus:ring-primary"
      />
    );
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl w-full rounded-2xl p-8 bg-white dark:bg-zinc-900 shadow-xl">
        <DialogHeader>
          <DialogTitle className="text-2xl font-semibold mb-2 text-zinc-900 dark:text-zinc-100">
            {t("advanced_search", "חיפוש מתקדם")}
          </DialogTitle>
        </DialogHeader>
        <form
          onSubmit={e => {
            e.preventDefault();
            onApply(filters);
            onClose();
          }}
        >
          <div className="space-y-6 mb-6 max-h-[60vh] overflow-y-auto pr-2">
            {columns
              .filter((col) => typeof (col as any).accessorKey === "string")
              .map((col) => {
                const accessorKey = String((col as any).accessorKey);
                return (
                  <div key={accessorKey} className="flex flex-col gap-1">
                    <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-200 mb-1">
                      {t(String(col.header))}
                    </label>
                    {renderSearchField(col, accessorKey)}
                  </div>
                );
              })}
          </div>
           
          <DialogFooter className="flex gap-2 justify-center">
            <Button type="button" variant="ghost" 
              onClick={() => {
                    setFilters({});
                    onApply({});
                    onClose();
                  }}
              className="rounded-lg px-4 py-2 text-red-600 hover:bg-red-100 dark:hover:bg-red-900 flex items-center gap-2"
              >
                <X className="w-4 h-4" />
                {t("remove_filter", " הסר סינון")}
              </Button>
            <Button type="button" variant="outline" onClick={handleReset} className="rounded-lg px-4 py-2 flex items-center gap-2">
              <RotateCcw className="w-4 h-4" />
              {t("reset", "אפס")}
            </Button>
            <Button type="submit" className="rounded-lg px-4 py-2 flex items-center gap-2">
              <Check className="w-4 h-4" />
              {t("apply_filtering", "החל סינון")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
} 