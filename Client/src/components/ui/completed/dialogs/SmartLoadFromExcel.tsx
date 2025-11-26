import { useState, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { FileUp } from "lucide-react";
import { ColumnDef } from "@tanstack/react-table";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogBody,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ExcelUploadGrid } from "./ExcelUploadGrid";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { Progress } from "@/components/ui/progress";

interface SaveProgressUpdate {
  processed: number;
  total: number;
  message?: string;
}

type SaveRowsResult = Promise<void> | AsyncIterable<SaveProgressUpdate>;

const isAsyncIterable = (
  value: SaveRowsResult,
): value is AsyncIterable<SaveProgressUpdate> =>
  typeof value === "object" &&
  value !== null &&
  typeof (value as AsyncIterable<SaveProgressUpdate>)[Symbol.asyncIterator] === "function";

interface SmartLoadFromExcelProps {
  /** Optional title for the dialog */
  title?: string;
  /** Optional children to render inside the dialog body */
  children?: React.ReactNode;
  /** Optional button variant */
  buttonVariant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link";
  /** Optional button className */
  buttonClassName?: string;
  /** Optional button text override */
  buttonText?: string;
  /** Table columns to map Excel headers */
  columns?: ColumnDef<any, any>[];
  /** Callback invoked when rows are ready to be saved */
  onSaveRows?: (rows: Record<string, string>[]) => SaveRowsResult;
  /** Optional list of field keys to exclude from the grid (e.g., ["linked_parents"]) */
  excludeFields?: string[];
}

export function SmartLoadFromExcel({
  title,
  children,
  buttonVariant = "outline",
  buttonClassName,
  buttonText,
  columns,
  onSaveRows,
  excludeFields = [],
}: SmartLoadFromExcelProps) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveProgress, setSaveProgress] = useState<SaveProgressUpdate | null>(null);

  const defaultButtonClassName =
    "bg-green-600 hover:bg-green-700 text-white hover:text-white border-green-600 hover:border-green-700 shadow-md hover:shadow-lg transition-all duration-200 font-medium";

  const shouldRenderGrid = columns && columns.length > 0 && onSaveRows;

  const handleSaveRows = useCallback(
    async (rows: Record<string, string>[]) => {
      if (!onSaveRows) return;
      const totalRows = rows.length;
      setIsSaving(true);
      setSaveProgress({
        processed: 0,
        total: totalRows,
        message: t("smart_excel_preparing_save", "מכין לשמירה..."),
      });
      try {
        const result = onSaveRows(rows);
        if (isAsyncIterable(result)) {
          for await (const update of result) {
            setSaveProgress({
              processed: Math.min(update.processed ?? 0, update.total ?? totalRows),
              total: update.total ?? totalRows,
              message: update.message,
            });
          }
          setSaveProgress((prev) =>
            prev
              ? {
                  ...prev,
                  processed: prev.total,
                  message: t("smart_excel_save_complete", "השמירה הושלמה"),
                }
              : null,
          );
        } else {
          await result;
          setSaveProgress({
            processed: totalRows,
            total: totalRows,
            message: t("smart_excel_save_complete", "השמירה הושלמה"),
          });
        }
      } finally {
        setTimeout(() => setSaveProgress(null), 800);
        setIsSaving(false);
      }
    },
    [onSaveRows, t],
  );

  const progressPercent =
    saveProgress && saveProgress.total > 0
      ? Math.min(100, Math.round((saveProgress.processed / saveProgress.total) * 100))
      : 0;

  return (
    <>
      <Button
        variant={buttonVariant}
        onClick={() => setOpen(true)}
        className={buttonClassName || defaultButtonClassName}
      >
        <FileUp className="w-4 h-4 mr-2" />
        {buttonText || t("smart_load_from_excel", "טעינה חכמה מאקסל")}
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>
              {title || t("smart_load_from_excel", "טעינה חכמה מאקסל")}
            </DialogTitle>
          </DialogHeader>
          <DialogBody>
            {shouldRenderGrid ? (
              <div className="relative">
                <ExcelUploadGrid columns={columns} onSave={handleSaveRows} excludeFields={excludeFields} />
                {isSaving && (
                  <div className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-4 rounded-lg bg-background/70 backdrop-blur-sm px-6 text-center">
                    <LoadingSpinner size="lg" />
                    <div className="space-y-1">
                      <p className="text-sm font-medium text-foreground">
                        {saveProgress?.message ||
                          t("smart_excel_saving_rows", "שומר נתונים, אנא המתן...")}
                      </p>
                      {saveProgress && (
                        <>
                          <p className="text-xs text-muted-foreground">
                            {t("smart_excel_saving_progress", {
                              defaultValue: "Saving {{processed}} of {{total}} rows",
                              processed: saveProgress.processed,
                              total: saveProgress.total,
                            })}
                          </p>
                          <Progress value={progressPercent} className="h-2 w-48" />
                        </>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              children || (
                <div className="flex items-center justify-center py-8">
                  <p className="text-muted-foreground">
                    {t("dialog_content_placeholder", "Dialog content will be added here")}
                  </p>
                </div>
              )
            )}
          </DialogBody>
        </DialogContent>
      </Dialog>
    </>
  );
}

