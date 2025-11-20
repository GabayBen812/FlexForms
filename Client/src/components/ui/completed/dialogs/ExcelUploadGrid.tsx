import { useCallback, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { ColumnDef } from "@tanstack/react-table";
import { DataSheetGrid, keyColumn, textColumn } from "react-datasheet-grid";
import "react-datasheet-grid/dist/style.css";
import * as XLSX from "xlsx";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/Input";
import { toast } from "@/hooks/use-toast";

type GridRow = Record<string, string>;

interface ExcelUploadGridProps {
  columns: ColumnDef<any, any>[];
  onSave: (rows: GridRow[]) => Promise<void>;
  /** Optional list of field keys to exclude from the grid */
  excludeFields?: string[];
}

const normalizeHeader = (header?: string | number | null) =>
  header?.toString().trim().toLowerCase() || "";

export function ExcelUploadGrid({ columns, onSave, excludeFields = [] }: ExcelUploadGridProps) {
  const { t } = useTranslation();
  const filteredColumns = useMemo(() => filterColumns(columns, excludeFields), [columns, excludeFields]);
  const [rows, setRows] = useState<GridRow[]>(() => [createEmptyRow(filteredColumns)]);
  const [isSaving, setIsSaving] = useState(false);
  const [isParsing, setIsParsing] = useState(false);

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
      return {
        ...keyColumn(accessorKey || "", textColumn),
        title,
      };
    });
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
      try {
        const data = await file.arrayBuffer();
        const workbook = XLSX.read(data, { cellDates: true });
        const firstSheet = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheet];
        const sheetRows = XLSX.utils.sheet_to_json<(string | number)[]>(worksheet, {
          header: 1,
          raw: false,
          defval: "",
        });

        if (!sheetRows.length) {
          toast.error(t("excel_empty_file", "הקובץ ריק"));
          return;
        }

        const [headerRow, ...dataRows] = sheetRows;
        if (!headerRow || headerRow.length === 0) {
          toast.error(t("excel_missing_headers", "לא נמצאו כותרות בקובץ"));
          return;
        }

        const columnKeys = headerRow
          .map((headerCell) => headerMap.get(normalizeHeader(headerCell)))
          .filter((key): key is string => !!key);

        if (!columnKeys.length) {
          toast.error(
            t("excel_no_matching_headers", "לא נמצאו כותרות תואמות בין הקובץ לטבלה"),
          );
          return;
        }

        const parsedRows: GridRow[] = dataRows
          .map((row) => {
            const baseRow = createEmptyRow(visibleColumns);
            columnKeys.forEach((key, index) => {
              const value = row[index];
              if (value !== undefined && value !== null) {
                baseRow[key] = value.toString();
              }
            });
            return baseRow;
          })
          .filter((row) => Object.values(row).some((value) => value && value.trim() !== ""));

        if (!parsedRows.length) {
          toast.error(t("excel_no_data_rows", "לא נמצאו נתונים בקובץ"));
          return;
        }

        setRows(parsedRows);
        toast.success(t("excel_loaded_successfully", "הקובץ נטען בהצלחה"));
      } catch (error) {
        console.error("Failed to parse Excel file", error);
        toast.error(t("excel_parse_failed", "נכשל בטעינת הקובץ"));
      } finally {
        setIsParsing(false);
      }
    },
    [headerMap, t, visibleColumns],
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

  const handleSave = useCallback(async () => {
    const filteredRows = rows.filter((row) =>
      Object.values(row).some((value) => (value || "").trim() !== ""),
    );

    if (!filteredRows.length) {
      toast.error(t("excel_no_rows_to_save", "אין נתונים לשמירה"));
      return;
    }

    setIsSaving(true);
    try {
      await onSave(filteredRows);
      setRows([createEmptyRow(visibleColumns)]);
    } catch (error) {
      console.error("Failed to save rows", error);
      toast.error(t("excel_save_failed", "נכשל בשמירת הנתונים"));
    } finally {
      setIsSaving(false);
    }
  }, [onSave, rows, t, visibleColumns]);

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
      <div className="rounded-lg border bg-card">
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


