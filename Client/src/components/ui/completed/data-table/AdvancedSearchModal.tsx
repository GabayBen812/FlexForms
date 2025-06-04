import { useState } from "react";
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

  const handleChange = (key: string, value: any) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const handleReset = () => {
    setFilters({});
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl w-full rounded-2xl p-8 bg-white dark:bg-zinc-900 shadow-xl">
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
                    <Input
                      value={filters[accessorKey] || ""}
                      onChange={e => handleChange(accessorKey, e.target.value)}
                      placeholder={t("search_by_x", { x: t(col.header as string) })}
                      className="rounded-lg border-zinc-300 dark:border-zinc-700 focus:ring-2 focus:ring-primary"
                    />
                  </div>
                );
              })}
          </div>
           
          <DialogFooter className="flex gap-2 justify-end">
            <Button type="button" variant="ghost" 
              onClick={() => {
                    setFilters({});
                    onApply({});
                    onClose();
                  }}
              className="rounded-lg px-4 py-2 text-red-600 hover:bg-red-100 dark:hover:bg-red-900"
              >
                {t("remove_filter", " הסר סינון")}
              </Button>
            <Button type="button" variant="outline" onClick={handleReset} className="rounded-lg px-4 py-2">
              {t("reset", "אפס")}
            </Button>
            <Button type="submit" className="rounded-lg px-4 py-2">
              {t("apply_filtering", "החל סינון")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
} 