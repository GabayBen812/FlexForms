import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogBody,
} from "@/components/ui/dialog";
import { RowSelectionState } from "@tanstack/react-table";

interface DataTableAdvancedUpdateBtnProps {
  showAdvancedSearch: boolean;
  rowSelection?: RowSelectionState | number;
  onOpenChange?: (open: boolean) => void;
}

export function DataTableAdvancedUpdateBtn({
  showAdvancedSearch,
  rowSelection,
  onOpenChange,
}: DataTableAdvancedUpdateBtnProps) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);

  const handleOpenChange = (isOpen: boolean) => {
    setOpen(isOpen);
    onOpenChange?.(isOpen);
  };

  // Check if any rows are selected
  const hasSelectedRows = 
    typeof rowSelection === 'object' && 
    rowSelection !== null && 
    Object.keys(rowSelection).length > 0;

  if (!showAdvancedSearch) return null;

  return (
    <>
      <Button
        variant="outline"
        onClick={() => handleOpenChange(true)}
        disabled={!hasSelectedRows}
        className="flex items-center gap-2 bg-orange-600 hover:bg-orange-700 text-white hover:text-white border-orange-600 hover:border-orange-700 shadow-md hover:shadow-lg transition-all duration-200 font-medium disabled:bg-gray-300 disabled:border-gray-300 disabled:text-gray-500 disabled:shadow-none disabled:cursor-not-allowed"
      >
        <RefreshCw className="h-4 w-4" />
        {t("advanced_update", "עדכון מתקדם")}
      </Button>
      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent className="max-w-lg w-full p-6">
          <DialogHeader>
            <DialogTitle>{t("advanced_update", "עדכון מתקדם")}</DialogTitle>
          </DialogHeader>
          <DialogBody>
            <div className="py-4">
              {/* Empty dialog content - to be implemented later */}
            </div>
          </DialogBody>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => handleOpenChange(false)}
              className="bg-red-500 hover:bg-red-600 text-white border-red-500 hover:border-red-600 shadow-md hover:shadow-lg transition-all duration-200 font-medium"
            >
              {t("close", "סגור")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

