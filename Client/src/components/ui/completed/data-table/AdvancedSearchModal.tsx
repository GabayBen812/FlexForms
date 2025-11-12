import { useState, useEffect, useMemo } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/Input";
import { useTranslation } from "react-i18next";
import { ColumnDef } from '@tanstack/react-table';
import { MultiSelect } from "@/components/ui/multi-select";
import { Check, RotateCcw, Search, X } from "lucide-react";

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
  const [selectedFields, setSelectedFields] = useState<string[]>([]);

  const availableFieldOptions = useMemo(() => {
    return columns
      .filter((col) => typeof (col as any).accessorKey === "string")
      .map((col) => {
        const accessorKey = String((col as any).accessorKey);
        const label = typeof col.header === "string" ? col.header : accessorKey;
        return {
          label: t(label),
          value: accessorKey,
        };
      });
  }, [columns, t]);

  // Reset filters when initialFilters change (e.g., when modal opens)
  useEffect(() => {
    if (!open) return;

    setFilters(initialFilters);
    const initialSelected = Object.keys(initialFilters).filter((key) =>
      availableFieldOptions.some((option) => option.value === key)
    );
    setSelectedFields(initialSelected);
  }, [open, initialFilters, availableFieldOptions]);

  const handleChange = (key: string, value: any) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const handleReset = () => {
    setFilters({});
    setSelectedFields([]);
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
    const options = meta.options || [];
    const relationshipOptions = meta.relationshipOptions || [];
    const isRelationshipField = relationshipOptions && Array.isArray(relationshipOptions) && relationshipOptions.length > 0;
    const isSingleSelectRelationship = isRelationshipField && meta.singleSelect === true;
    const isMultiSelectRelationship = isRelationshipField && !isSingleSelectRelationship;
    const fieldDefinition = meta.fieldDefinition;
    const isDynamic = meta.isDynamic || isDynamicField(accessorKey);
    const isDate = meta.isDate;
    const isMoney = meta.isMoney;
    const isTime = meta.isTime;
    
    // Use relationshipOptions if available, otherwise use options
    const effectiveOptions = isRelationshipField ? relationshipOptions : options;
    const normalizedOptions = Array.isArray(effectiveOptions)
      ? effectiveOptions.map((option: any) => {
          if (typeof option === "string") {
            return { value: option, label: option };
          }
          const value = option?.value ?? option?.id ?? option;
          const label = option?.label ?? option?.name ?? String(value ?? "");
          return { value: String(value ?? ""), label: String(label) };
        })
      : [];
    const inputClasses =
      "h-12 rounded-xl border border-sky-200/60 bg-white/90 px-4 text-base text-slate-900 placeholder:text-slate-400 shadow-sm transition-colors focus:outline-none focus:ring-2 focus:ring-sky-200 focus:border-sky-300 dark:border-slate-700 dark:bg-slate-900/70 dark:text-slate-100 dark:placeholder:text-slate-500 dark:focus:ring-sky-500/40";
    const selectClasses =
      "h-12 rounded-xl border border-sky-200/60 bg-white/90 px-3 text-base text-slate-900 shadow-sm transition-colors focus:outline-none focus:ring-2 focus:ring-sky-200 focus:border-sky-300 dark:border-slate-700 dark:bg-slate-900/70 dark:text-slate-100 dark:focus:ring-sky-500/40";
    
    // Get field value
    const fieldValue = filters[accessorKey] !== undefined ? filters[accessorKey] : "";

    // Handle single-select relationship field
    if (isSingleSelectRelationship) {
      return (
        <select
          value={fieldValue || ""}
          onChange={(e) => handleChange(accessorKey, e.target.value === "" ? undefined : e.target.value)}
          className={selectClasses}
        >
          <option value="">{t("all", "הכל")}</option>
          {normalizedOptions.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      );
    }

    // Handle multi-select relationship field
    if (isMultiSelectRelationship) {
      const selectedValues = Array.isArray(fieldValue) ? fieldValue : fieldValue ? [fieldValue] : [];
      return (
        <MultiSelect
          options={normalizedOptions}
          selected={selectedValues}
          onSelect={(values) => handleChange(accessorKey, values)}
          placeholder={t("select_options", "בחר אפשרויות...")}
          className="h-auto rounded-xl border border-sky-200/60 bg-white/90 text-base font-medium text-slate-900 hover:border-sky-300 hover:bg-sky-50 hover:text-sky-700 focus:ring-2 focus:ring-sky-200 dark:border-slate-700 dark:bg-slate-900/70 dark:text-slate-100 dark:hover:border-sky-500/40 dark:hover:bg-slate-900 dark:hover:text-sky-200"
        />
      );
    }

    // Handle SELECT field type
    if (fieldType === "SELECT" && Array.isArray(options)) {
      return (
        <select
          value={fieldValue || ""}
          onChange={(e) => handleChange(accessorKey, e.target.value)}
          className={selectClasses}
        >
          <option value="">{t("all", "הכל")}</option>
          {normalizedOptions.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      );
    }

    // Handle MULTI_SELECT field type
    if (fieldType === "MULTI_SELECT" && Array.isArray(options)) {
      const selectedValues = Array.isArray(fieldValue) ? fieldValue : fieldValue ? [fieldValue] : [];
      return (
        <MultiSelect
          options={normalizedOptions}
          selected={selectedValues}
          onSelect={(values) => handleChange(accessorKey, values)}
          placeholder={t("select_options", "בחר אפשרויות...")}
          className="h-auto rounded-xl border border-sky-200/60 bg-white/90 text-base font-medium text-slate-900 hover:border-sky-300 hover:bg-sky-50 hover:text-sky-700 focus:ring-2 focus:ring-sky-200 dark:border-slate-700 dark:bg-slate-900/70 dark:text-slate-100 dark:hover:border-sky-500/40 dark:hover:bg-slate-900 dark:hover:text-sky-200"
        />
      );
    }

    // Handle CHECKBOX field type
    if (fieldType === "CHECKBOX" || (isDynamic && fieldDefinition?.type === "CHECKBOX")) {
      return (
        <select
          value={fieldValue || ""}
          onChange={(e) => handleChange(accessorKey, e.target.value === "" ? undefined : e.target.value === "true")}
          className={selectClasses}
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
          className={inputClasses}
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
          className={inputClasses}
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
            className={inputClasses}
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
          className={inputClasses}
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
          className={inputClasses}
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
          className={inputClasses}
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
        className={inputClasses}
      />
    );
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl w-full overflow-hidden rounded-3xl border border-sky-200/60 bg-gradient-to-br from-sky-50 via-white to-indigo-50 p-0 shadow-2xl dark:border-sky-900/50 dark:from-slate-950 dark:via-slate-950 dark:to-slate-900">
        <DialogHeader className="px-8 pt-8 text-center">
          <DialogTitle className="text-3xl font-semibold text-slate-900 dark:text-slate-50">
            {t("advanced_search", "חיפוש מתקדם")}
          </DialogTitle>
          <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
            {t("advanced_search_hint", "בחר שדות, קבע תנאים, וסנן את הרשומות בדיוק שאתה צריך.")}
          </p>
        </DialogHeader>
        <form
          onSubmit={e => {
            e.preventDefault();
            const sanitizedFilters = selectedFields.reduce<Record<string, any>>((acc, key) => {
              const value = filters[key];
              const isEmptyString = typeof value === "string" && value.trim() === "";
              const isEmptyArray = Array.isArray(value) && value.length === 0;
              if (
                value === undefined ||
                value === null ||
                isEmptyString ||
                isEmptyArray
              ) {
                return acc;
              }
              acc[key] = value;
              return acc;
            }, {});
            onApply(sanitizedFilters);
            onClose();
          }}
        >
          <div className="space-y-8 px-8 pb-8">
            <div className="rounded-2xl border border-sky-200/70 bg-white/90 p-6 shadow-sm backdrop-blur-sm dark:border-slate-800/70 dark:bg-slate-900/60">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-sky-100 via-sky-50 to-indigo-100 text-sky-600 dark:from-sky-950 dark:via-slate-900 dark:to-slate-900 dark:text-sky-300">
                    <Search className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-lg font-semibold text-slate-900 dark:text-slate-50">
                      {t("select_fields_to_search", "בחר שדות לחיפוש")}
                    </p>
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                      {t("search_and_select_fields", "חפש ובחר שדות...")}
                    </p>
                  </div>
                </div>
                {selectedFields.length > 0 && (
                  <span className="inline-flex items-center gap-2 rounded-full border border-sky-200 bg-sky-50 px-3 py-1 text-sm font-semibold text-sky-700 dark:border-sky-700/40 dark:bg-slate-900/70 dark:text-sky-200">
                    <Check className="h-4 w-4" />
                    {selectedFields.length}
                  </span>
                )}
              </div>
              <MultiSelect
                options={availableFieldOptions}
                selected={selectedFields}
                onSelect={(values) => {
                  setSelectedFields(values);
                  setFilters((prev) => {
                    const updated = { ...prev };
                    Object.keys(updated).forEach((key) => {
                      if (!values.includes(key)) {
                        delete updated[key];
                      }
                    });
                    values.forEach((key) => {
                      if (!(key in updated)) {
                        updated[key] = "";
                      }
                    });
                    return updated;
                  });
                }}
                placeholder={t("search_and_select_fields", "חפש ובחר שדות...")}
                className="mt-4 rounded-xl border border-sky-200/70 bg-white/95 text-base font-medium text-slate-900 shadow-sm transition-colors hover:border-sky-300 hover:bg-sky-50 hover:text-sky-700 focus:ring-2 focus:ring-sky-200 dark:border-slate-800 dark:bg-slate-900/70 dark:text-slate-100 dark:hover:border-sky-500/40 dark:hover:bg-slate-900 dark:hover:text-sky-200"
              />
            </div>
            <div className="space-y-4 max-h-[50vh] overflow-y-auto pr-2">
              {columns
                .filter((col) => {
                  const accessorKey = String((col as any).accessorKey);
                  return selectedFields.includes(accessorKey);
                })
                .map((col) => {
                  const accessorKey = String((col as any).accessorKey);
                  return (
                    <div
                      key={accessorKey}
                      className="rounded-2xl border border-sky-200/70 bg-white/95 p-5 shadow-sm backdrop-blur-sm dark:border-slate-800 dark:bg-slate-900/70"
                    >
                      <label className="mb-3 block text-base font-semibold text-slate-900 dark:text-slate-50">
                        {t(String(col.header))}
                      </label>
                      <div className="max-w-full">{renderSearchField(col, accessorKey)}</div>
                    </div>
                  );
                })}
              {selectedFields.length === 0 && (
                <div className="rounded-2xl border border-dashed border-sky-200/80 bg-white/70 py-10 text-center text-base text-slate-500 dark:border-slate-700 dark:bg-slate-900/40 dark:text-slate-400">
                  {t("no_fields_selected_hint", "בחר שדות למעלה כדי להתחיל לחפש")}
                </div>
              )}
            </div>
          </div>

          <div className="flex flex-col-reverse items-center justify-center gap-3 border-t border-sky-100/80 bg-white/80 px-8 pb-8 pt-6 dark:border-slate-800 dark:bg-slate-900/70 sm:flex-row">
            <Button
              type="button"
              variant="ghost"
              onClick={() => {
                setFilters({});
                setSelectedFields([]);
                onApply({});
                onClose();
              }}
              className="flex min-w-[160px] items-center justify-center gap-2 rounded-full border border-transparent bg-transparent px-5 py-2 text-sm font-semibold text-sky-700 transition-all hover:bg-sky-100 hover:text-sky-800 dark:text-sky-300 dark:hover:bg-sky-900/40"
            >
              <X className="h-4 w-4" />
              {t("remove_filter", " הסר סינון")}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={handleReset}
              className="flex min-w-[160px] items-center justify-center gap-2 rounded-full border-2 border-sky-200 bg-white/90 px-5 py-2 text-sm font-semibold text-sky-700 shadow-sm transition-all hover:-translate-y-0.5 hover:border-sky-300 hover:bg-sky-50 hover:text-sky-800 dark:border-slate-700 dark:bg-slate-900 dark:text-sky-200 dark:hover:border-sky-500/40 dark:hover:bg-slate-800"
            >
              <RotateCcw className="h-4 w-4" />
              {t("reset", "אפס")}
            </Button>
            <Button
              type="submit"
              className="flex min-w-[180px] items-center justify-center gap-2 rounded-full bg-gradient-to-r from-sky-500 via-blue-600 to-indigo-500 px-6 py-2 text-sm font-semibold text-white shadow-lg transition-all hover:-translate-y-0.5 hover:from-sky-500 hover:via-blue-500 hover:to-indigo-400 hover:text-white hover:shadow-xl"
            >
              <Check className="h-4 w-4" />
              {t("apply_filtering", "החל סינון")}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
} 