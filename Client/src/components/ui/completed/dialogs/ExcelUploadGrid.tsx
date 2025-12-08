import { useCallback, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { ColumnDef } from "@tanstack/react-table";
import { DataSheetGrid, keyColumn, textColumn } from "react-datasheet-grid";
import "react-datasheet-grid/dist/style.css";
import * as XLSX from "xlsx";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/Input";
import { Progress } from "@/components/ui/progress";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { toast } from "@/hooks/use-toast";

type GridRow = Record<string, string>;

interface ExcelUploadGridProps {
  columns: ColumnDef<any, any>[];
  onSave: (rows: GridRow[]) => Promise<void>;
  /** Optional list of field keys to exclude from the grid */
  excludeFields?: string[];
}

type ProgressStage = "reading" | "parsing" | "processing" | "done";

interface ProgressState {
  current: number;
  total: number;
  stage: ProgressStage;
  fileName?: string;
}

const normalizeHeader = (header?: string | number | Date | null) =>
  header?.toString().trim().toLowerCase() || "";

export function ExcelUploadGrid({ columns, onSave, excludeFields = [] }: ExcelUploadGridProps) {
  const { t } = useTranslation();
  const filteredColumns = useMemo(() => filterColumns(columns, excludeFields), [columns, excludeFields]);
  const [rows, setRows] = useState<GridRow[]>(() => [createEmptyRow(filteredColumns)]);
  const [isSaving, setIsSaving] = useState(false);
  const [isParsing, setIsParsing] = useState(false);
  const [progress, setProgress] = useState<ProgressState>({
    current: 0,
    total: 0,
    stage: "done",
  });

  const visibleColumns = useMemo(() => filteredColumns, [filteredColumns]);

  const headerMap = useMemo(() => {
    const map = new Map<string, string>();
    visibleColumns.forEach((column) => {
      const accessorKey = ('accessorKey' in column ? column.accessorKey : column.id)?.toString();
      if (!accessorKey) return;

      const headerCandidates: (string | undefined)[] = [];
      if (typeof column.header === "string") {
        headerCandidates.push(column.header);
      }
      if (column.meta && "fieldDefinition" in column.meta) {
        const definition = (column.meta as Record<string, any>).fieldDefinition;
        if (definition?.label) {
          headerCandidates.push(definition.label);
        }
      }

      headerCandidates
        .map((candidate) => normalizeHeader(candidate))
        .filter(Boolean)
        .forEach((normalized) => {
          if (!map.has(normalized)) {
            map.set(normalized, accessorKey);
          }
        });
    });
    return map;
  }, [visibleColumns]);

  const gridColumns = useMemo(() => {
    return visibleColumns.map((column) => {
      const accessorKey = ('accessorKey' in column ? column.accessorKey : column.id)?.toString();
      const title =
        typeof column.header === "string"
          ? column.header
          : accessorKey || "";
      
      const meta = column.meta as Record<string, any> | undefined;
      const isDateColumn = meta?.isDate === true;
      
      // For date columns, add custom paste handler
      if (isDateColumn) {
        return {
          ...keyColumn(accessorKey || "", {
            ...textColumn,
            // Custom paste handler for date columns
            pasteValue: ({ value }: { value: string }) => {
              // Handle Excel date serial numbers (e.g., 45567)
              if (/^\d{5,}$/.test(value.trim())) {
                const serialNumber = parseInt(value.trim(), 10);
                // Excel date serial: days since 1900-01-01 (with a bug for 1900 being a leap year)
                const excelEpoch = new Date(1899, 11, 30); // Dec 30, 1899
                const date = new Date(excelEpoch.getTime() + serialNumber * 86400000);
                
                if (!isNaN(date.getTime())) {
                  const day = String(date.getDate()).padStart(2, '0');
                  const month = String(date.getMonth() + 1).padStart(2, '0');
                  const year = date.getFullYear();
                  return `${day}/${month}/${year}`;
                }
              }
              
              // Handle dates with dots (DD.MM.YYYY)
              if (/^\d{2}\.\d{2}\.\d{4}$/.test(value.trim())) {
                const parts = value.trim().split('.');
                if (parts.length === 3) {
                  const [day, month, year] = parts;
                  return `${day}/${month}/${year}`;
                }
              }
              
              // Handle dates that are already in DD/MM/YYYY format
              if (/^\d{2}\/\d{2}\/\d{4}$/.test(value.trim())) {
                return value.trim();
              }
              
              // Try to parse other date formats
              const dateValue = new Date(value);
              if (!isNaN(dateValue.getTime()) && value.trim() !== "" && value.trim().length > 4) {
                const day = String(dateValue.getDate()).padStart(2, '0');
                const month = String(dateValue.getMonth() + 1).padStart(2, '0');
                const year = dateValue.getFullYear();
                return `${day}/${month}/${year}`;
              }
              
              // Return as-is for text input
              return value;
            },
          }),
          title,
        };
      }
      
      // For non-date columns, use default text column
      return {
        ...keyColumn(accessorKey || "", textColumn),
        title,
      };
    });
  }, [visibleColumns]);

  // Pre-create empty row template for optimization
  const emptyRowTemplate = useMemo(() => {
    return createEmptyRow(visibleColumns);
  }, [visibleColumns]);

  const handleAddRow = useCallback(() => {
    setRows((prev) => [...prev, createEmptyRow(visibleColumns)]);
  }, [visibleColumns]);

  const handleClearRows = useCallback(() => {
    setRows([createEmptyRow(visibleColumns)]);
  }, [visibleColumns]);

  const handleParseExcel = useCallback(
    async (file: File) => {
      setIsParsing(true);
      setProgress({
        current: 0,
        total: 0,
        stage: "reading",
        fileName: file.name,
      });

      try {
        // Stage 1: Reading file (0-10%)
        setProgress((prev) => ({ ...prev, current: 5, stage: "reading" }));

        const data = await file.arrayBuffer();
        setProgress((prev) => ({ ...prev, current: 10, stage: "parsing" }));

        const workbook = XLSX.read(data, { cellDates: true, dateNF: 'dd/mm/yyyy' });
        const firstSheet = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheet];
        const sheetRows = XLSX.utils.sheet_to_json<(string | number | Date)[]>(worksheet, {
          header: 1,
          raw: true,  // Keep dates as Date objects
          defval: "",
        });

        if (!sheetRows.length) {
          toast.error(t("excel_empty_file", "הקובץ ריק"));
          setProgress({ current: 0, total: 0, stage: "done" });
          return;
        }

        const [headerRow, ...dataRows] = sheetRows;
        if (!headerRow || headerRow.length === 0) {
          toast.error(t("excel_missing_headers", "לא נמצאו כותרות בקובץ"));
          setProgress({ current: 0, total: 0, stage: "done" });
          return;
        }

        // Map Excel column indexes to accessor keys, preserving original column positions
        const columnMappings: Array<{ index: number; key: string }> = [];
        headerRow.forEach((headerCell, excelIndex) => {
          const accessorKey = headerMap.get(normalizeHeader(headerCell));
          if (accessorKey) {
            columnMappings.push({ index: excelIndex, key: accessorKey });
          }
        });

        if (!columnMappings.length) {
          toast.error(
            t("excel_no_matching_headers", "לא נמצאו כותרות תואמות בין הקובץ לטבלה"),
          );
          setProgress({ current: 0, total: 0, stage: "done" });
          return;
        }

        // Stage 2: Processing rows in chunks (10-100%)
        const totalRows = dataRows.length;
        const CHUNK_SIZE = 15; // Process 15 rows at a time for smooth progress
        const parsedRows: GridRow[] = [];

        setProgress({
          current: 10,
          total: totalRows,
          stage: "processing",
          fileName: file.name,
        });

        // Process rows in chunks to avoid blocking the main thread
        const processChunk = async (startIndex: number): Promise<void> => {
          return new Promise<void>((resolve) => {
            // Use setTimeout to yield to the browser and keep UI responsive
            setTimeout(() => {
              const endIndex = Math.min(startIndex + CHUNK_SIZE, totalRows);
              const chunk = dataRows.slice(startIndex, endIndex);

              for (const row of chunk) {
                // Skip if row is undefined, null, or not an array
                if (!row || !Array.isArray(row)) {
                  continue;
                }
                
                // Use pre-created template for better performance
                const baseRow: GridRow = { ...emptyRowTemplate };
                let hasAnyValue = false;
                
                columnMappings.forEach(({ index, key }) => {
                  const value = row[index];
                  if (value !== undefined && value !== null && value !== "") {
                    // Handle Date objects from Excel
                    if (value instanceof Date) {
                      // Format date as DD/MM/YYYY for display in the grid
                      const day = String(value.getDate()).padStart(2, '0');
                      const month = String(value.getMonth() + 1).padStart(2, '0');
                      const year = value.getFullYear();
                      baseRow[key] = `${day}/${month}/${year}`;
                      hasAnyValue = true;
                    } else {
                      const stringValue = value.toString().trim();
                      if (stringValue !== "") {
                        baseRow[key] = stringValue;
                        hasAnyValue = true;
                      }
                    }
                  }
                });
                
                // Only add rows that have at least one non-empty value
                // This ensures we skip completely empty rows but keep rows with partial data
                if (hasAnyValue) {
                  parsedRows.push(baseRow);
                }
              }

              // Update progress
              const processedCount = Math.min(endIndex, totalRows);
              const progressPercent = 10 + (processedCount / totalRows) * 90;
              setProgress({
                current: processedCount,
                total: totalRows,
                stage: "processing",
                fileName: file.name,
              });

              resolve();
            }, 0);
          });
        };

        // Process all chunks sequentially
        for (let i = 0; i < totalRows; i += CHUNK_SIZE) {
          await processChunk(i);
        }

        if (!parsedRows.length) {
          toast.error(t("excel_no_data_rows", "לא נמצאו נתונים בקובץ"));
          setProgress({ current: 0, total: 0, stage: "done" });
          return;
        }

        // Stage 3: Done (100%)
        setProgress({
          current: totalRows,
          total: totalRows,
          stage: "done",
          fileName: file.name,
        });

        setRows(parsedRows);
        toast.success(t("excel_loaded_successfully", "הקובץ נטען בהצלחה"));
        
        // Reset progress after a short delay to show completion
        setTimeout(() => {
          setProgress({ current: 0, total: 0, stage: "done" });
        }, 500);
      } catch (error) {
        console.error("Failed to parse Excel file", error);
        toast.error(t("excel_parse_failed", "נכשל בטעינת הקובץ"));
        setProgress({ current: 0, total: 0, stage: "done" });
      } finally {
        setIsParsing(false);
      }
    },
    [headerMap, t, visibleColumns, emptyRowTemplate],
  );

  const handleFileChange = useCallback(
    async (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (!file) return;
      await handleParseExcel(file);
      event.target.value = "";
    },
    [handleParseExcel],
  );

  // Get list of required field keys
  const requiredFields = useMemo(() => {
    const required: string[] = [];
    visibleColumns.forEach((column) => {
      const accessorKey = ('accessorKey' in column ? column.accessorKey : column.id)?.toString();
      if (!accessorKey) return;

      // Check if field is required via fieldDefinition
      const meta = column.meta as Record<string, any> | undefined;
      if (meta?.fieldDefinition?.required === true) {
        required.push(accessorKey);
      }

      // Hardcoded required fields (firstname, lastname are typically required)
      if (accessorKey === "firstname" || accessorKey === "lastname") {
        if (!required.includes(accessorKey)) {
          required.push(accessorKey);
        }
      }
    });
    return required;
  }, [visibleColumns]);

  const handleSave = useCallback(async () => {
    // Filter out completely empty rows
    const nonEmptyRows = rows.filter((row) =>
      Object.values(row).some((value) => (value || "").trim() !== ""),
    );

    if (!nonEmptyRows.length) {
      toast.error(t("excel_no_rows_to_save", "אין נתונים לשמירה"));
      return;
    }

    // Filter out rows missing required fields
    const validRows: GridRow[] = [];
    const skippedRows: number[] = [];

    nonEmptyRows.forEach((row, index) => {
      const missingRequired = requiredFields.filter(
        (fieldKey) => !row[fieldKey] || (row[fieldKey] || "").trim() === "",
      );

      if (missingRequired.length === 0) {
        validRows.push(row);
      } else {
        skippedRows.push(index + 1);
      }
    });

    if (!validRows.length) {
      const missingFields = requiredFields.join(", ");
      toast.error(
        t("excel_no_valid_rows", {
          defaultValue: `אין רשומות תקינות לשמירה. שדות חובה: ${missingFields}`,
        }) || `אין רשומות תקינות לשמירה. שדות חובה: ${missingFields}`,
      );
      return;
    }

    setIsSaving(true);
    try {
      await onSave(validRows);
      setRows([createEmptyRow(visibleColumns)]);
      
      // Show success message with info about skipped rows if any
      if (skippedRows.length > 0) {
        toast.error(
          t("excel_some_rows_skipped", {
            defaultValue: `${validRows.length} רשומות נשמרו. ${skippedRows.length} רשומות דולגו עקב שדות חובה חסרים`,
          }) ||
            `${validRows.length} רשומות נשמרו. ${skippedRows.length} רשומות דולגו עקב שדות חובה חסרים`,
        );
      } else if (validRows.length > 0) {
        toast.success(
          t("excel_save_success", {
            defaultValue: `${validRows.length} רשומות נשמרו בהצלחה`,
          }) || `${validRows.length} רשומות נשמרו בהצלחה`,
        );
      }
    } catch (error) {
      console.error("Failed to save rows", error);
      toast.error(t("excel_save_failed", "נכשל בשמירת הנתונים"));
    } finally {
      setIsSaving(false);
    }
  }, [onSave, rows, t, visibleColumns, requiredFields]);

  // Calculate progress percentage
  const progressPercentage = useMemo(() => {
    if (progress.stage === "reading") {
      return progress.current > 0 ? 5 : 0;
    }
    if (progress.stage === "parsing") {
      return 10;
    }
    if (progress.stage === "processing" && progress.total > 0) {
      // 10% for reading + (90% * progress ratio)
      return Math.min(100, 10 + (progress.current / progress.total) * 90);
    }
    if (progress.stage === "done") {
      return 100;
    }
    return 0;
  }, [progress]);

  // Get stage text for display
  const stageText = useMemo(() => {
    switch (progress.stage) {
      case "reading":
        return t("excel_reading_file", "קורא קובץ...");
      case "parsing":
        return t("excel_parsing_file", "מעבד קובץ...");
      case "processing":
        return t("excel_processing_rows", "מעבד שורות...");
      case "done":
        return t("excel_ready", "מוכן");
      default:
        return "";
    }
  }, [progress.stage, t]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        <Input
          type="file"
          accept=".xlsx,.xls"
          onChange={handleFileChange}
          disabled={isParsing}
          className="w-full sm:w-auto"
        />
        <Button variant="outline" onClick={handleAddRow} disabled={isParsing}>
          {t("add_row", "הוסף שורה")}
        </Button>
        <Button variant="ghost" onClick={handleClearRows} disabled={isParsing}>
          {t("clear_rows", "נקה הכל")}
        </Button>
      </div>

      {/* Progress UI */}
      {isParsing && (
        <div className="space-y-3 rounded-lg border bg-card p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <LoadingSpinner size="md" />
            <div className="flex-1 space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-foreground transition-all duration-300">
                  {stageText}
                </span>
                <span className="text-xs text-muted-foreground transition-all duration-300">
                  {Math.round(progressPercentage)}%
                </span>
              </div>
              <Progress
                value={progressPercentage}
                className="h-2 transition-all duration-300"
              />
              {progress.stage === "processing" && progress.total > 0 && (
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span className="transition-all duration-300">
                    {t("excel_processing_row_x_of_y", {
                      current: progress.current,
                      total: progress.total,
                      defaultValue: `מעבד שורה ${progress.current} מתוך ${progress.total}`,
                    })}
                  </span>
                  {progress.fileName && (
                    <span className="truncate max-w-[200px] transition-all duration-300">
                      {progress.fileName}
                    </span>
                  )}
                </div>
              )}
              {progress.stage === "reading" && progress.fileName && (
                <div className="text-xs text-muted-foreground transition-all duration-300">
                  {progress.fileName}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <div className="rounded-lg border bg-card relative">
        {isParsing && (
          <div className="absolute inset-0 bg-background/50 backdrop-blur-sm z-10 rounded-lg flex items-center justify-center">
            <div className="text-center space-y-2">
              <LoadingSpinner size="lg" />
              <p className="text-sm text-muted-foreground">{stageText}</p>
            </div>
          </div>
        )}
        <DataSheetGrid
          value={rows}
          onChange={setRows}
          columns={gridColumns}
          lockRows={false}
          addRowsComponent={null}
        />
      </div>
      <div className="flex justify-end gap-2">
        <Button onClick={handleSave} disabled={isSaving || isParsing}>
          {isSaving ? t("saving", "שומר...") : t("save_rows", "שמור רשומות")}
        </Button>
      </div>
    </div>
  );
}

function filterColumns(columns: ColumnDef<any, any>[], excludeFields: string[] = []) {
  return columns.filter((column) => {
    const accessorKey = ('accessorKey' in column ? column.accessorKey : column.id)?.toString();
    if (!accessorKey) return false;
    
    // Exclude hidden columns
    if (column.meta && "hidden" in column.meta && column.meta.hidden) {
      return false;
    }
    
    // Exclude fields in the excludeFields list
    if (excludeFields.includes(accessorKey)) {
      return false;
    }
    
    // Exclude IMAGE fields
    const meta = column.meta as Record<string, any> | undefined;
    if (meta) {
      // Check for image field indicators
      if (
        meta.isImage === true ||
        meta.fieldType === "IMAGE" ||
        (meta.fieldDefinition && meta.fieldDefinition.type === "IMAGE")
      ) {
        return false;
      }
    }
    
    return true;
  });
}

function createEmptyRow(columns: ColumnDef<any, any>[]): GridRow {
  return columns.reduce<GridRow>((row, column) => {
    const accessorKey = ('accessorKey' in column ? column.accessorKey : column.id)?.toString();
    if (accessorKey) {
      row[accessorKey] = "";
    }
    return row;
  }, {});
}


