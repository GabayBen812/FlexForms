import React from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { FileDown, Loader2 } from "lucide-react";
import { ColumnDef, RowSelectionState, Table } from "@tanstack/react-table";
import ExcelJS from "exceljs/dist/exceljs.min.js";
import { formatDateForDisplay, isDateValue } from "@/lib/dateUtils";
import { cn } from "@/lib/utils";

interface DataTableExportToExcelBtnProps<TData> {
  showAdvancedSearch: boolean;
  rowSelection?: RowSelectionState | number;
  table: Table<TData>;
  className?: string;
  onExport?: (params: {
    selectedRows: TData[];
    table: Table<TData>;
  }) => Promise<void> | void;
}

type ColumnDefWithAccessorKey<TData> = ColumnDef<TData, unknown> & {
  accessorKey?: string;
};

const hasAccessorKey = <TData,>(
  columnDef: ColumnDef<TData, unknown>
): columnDef is ColumnDefWithAccessorKey<TData> =>
  typeof (columnDef as ColumnDefWithAccessorKey<TData>).accessorKey === "string";

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null;

const getStringProp = (
  record: Record<string, unknown>,
  key: string
): string | undefined => {
  const value = record[key];
  return typeof value === "string" ? value : undefined;
};

const getMetaBoolean = <TData,>(
  columnDef: ColumnDef<TData, unknown>,
  key: string
): boolean => {
  const meta = columnDef.meta;

  if (meta && typeof meta === "object") {
    const record = meta as Record<string, unknown>;
    const value = record[key];
    return typeof value === "boolean" ? value : Boolean(value);
  }

  return false;
};

export function DataTableExportToExcelBtn<TData>({
  showAdvancedSearch,
  rowSelection,
  table,
  className,
  onExport,
}: DataTableExportToExcelBtnProps<TData>) {
  const { t } = useTranslation();
  const [isExporting, setIsExporting] = React.useState(false);

  // Check if any rows are selected
  const hasSelectedRows = 
    typeof rowSelection === 'object' && 
    rowSelection !== null && 
    Object.keys(rowSelection).length > 0;

  if (!showAdvancedSearch) return null;

  const handleExport = async () => {
    if (!hasSelectedRows) {
      console.warn("No rows selected for export.");
      return;
    }

    setIsExporting(true);
    try {
      if (onExport) {
        const selectedRows = table
          .getSelectedRowModel()
          .rows.map((row) => row.original as TData);
        await onExport({ selectedRows, table });
        return;
      }

      // Get selected rows from the table
      const selectedRows = table.getSelectedRowModel().rows;

      // Get visible columns (excluding hidden ones)
      const visibleColumns = table.getAllColumns().filter(
        (column) => column.getCanHide() && column.getIsVisible()
      );

      // Extract headers - handle both string headers and function headers
      const headers: string[] = [];

      visibleColumns.forEach((column, index) => {
        const columnDef = column.columnDef;
        let headerText = '';
        
        // Try to get header text
        if (typeof columnDef.header === 'string') {
          headerText = columnDef.header;
        } else if (typeof columnDef.header === 'function') {
          // Try to call the function and see if it returns a string
          try {
            const headerResult = columnDef.header({
              column: column,
              header: column.id,
              table: table,
            } as any);
            // If it's a string, use it; otherwise fall through to accessorKey/id
            if (typeof headerResult === 'string') {
              headerText = headerResult;
            }
          } catch (e) {
            // If calling the function fails, fall through to accessorKey/id
          }
        }
        
        // Fallback to accessorKey or column id
        if (!headerText) {
          if (hasAccessorKey(columnDef) && columnDef.accessorKey) {
            headerText = String(columnDef.accessorKey);
          } else if (column.id) {
            headerText = column.id;
          }
        }

        // Clean up header text (remove common prefixes/suffixes)
        headerText = headerText.replace(/^dynamicFields\./, '').trim();
        
        // If still empty, use a default
        if (!headerText) {
          headerText = `Column ${index + 1}`;
        }
        
        headers.push(headerText);
      });

      // Format selected rows data
      const formattedData = selectedRows.map((row) => {
        const rowData: { [key: string]: any } = {};
        
        visibleColumns.forEach((column, index) => {
          const header = headers[index];
          const value = row.getValue(column.id);
          const columnDef = column.columnDef;
          const metaIsDate = getMetaBoolean(columnDef, "isDate");
          
          // Format the value for Excel
          let formattedValue: any = value;
          
          if (value === null || value === undefined) {
            formattedValue = '';
          } else if (
            value instanceof Date ||
            metaIsDate ||
            isDateValue(value)
          ) {
            // Format dates using the date utility
            if (value instanceof Date) {
              formattedValue = formatDateForDisplay(value);
            } else if (typeof value === "string" || typeof value === "number") {
              // Try to parse as date if it's a date string
              const dateValue = new Date(value);
              if (!isNaN(dateValue.getTime())) {
                formattedValue = formatDateForDisplay(dateValue);
              } else {
                formattedValue = String(value);
              }
            } else {
              formattedValue = String(value);
            }
          } else if (Array.isArray(value)) {
            // Handle arrays (like linked parents, etc.)
            formattedValue = value
              .map((item) => {
              if (isRecord(item)) {
                // If it's an object, try to get a display name
                const firstname = getStringProp(item, "firstname");
                const lastname = getStringProp(item, "lastname");
                if (firstname && lastname) {
                  return `${firstname} ${lastname}`;
                }
                return (
                  getStringProp(item, "name") ||
                  getStringProp(item, "label") ||
                  getStringProp(item, "_id") ||
                  JSON.stringify(item)
                );
              }
                if (
                  typeof item === "string" ||
                  typeof item === "number" ||
                  typeof item === "boolean"
                ) {
                  return item.toString();
                }
                return "";
              })
              .filter(Boolean)
              .join(", ");
          } else if (isRecord(value)) {
            // Handle objects
            const firstname = getStringProp(value, "firstname");
            const lastname = getStringProp(value, "lastname");
            if (firstname && lastname) {
              formattedValue = `${firstname} ${lastname}`;
            } else {
              formattedValue =
                getStringProp(value, "name") ||
                getStringProp(value, "label") ||
                getStringProp(value, "_id") ||
                JSON.stringify(value);
            }
          } else if (typeof value === 'boolean') {
            formattedValue = value ? 'Yes' : 'No';
          } else if (
            typeof value === "string" ||
            typeof value === "number" ||
            typeof value === "bigint"
          ) {
            formattedValue = value.toString();
          } else {
            formattedValue = "";
          }
          
          rowData[header] = formattedValue;
        });
        
        return rowData;
      });

      // Create a new workbook and worksheet
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet("Selected Rows");

      // Define styles
      const headerStyle = {
        font: { 
          bold: true, 
          color: { argb: 'FF000000' }, // Black text
          size: 11 
        },
        fill: {
          type: 'pattern' as const,
          pattern: 'solid' as const,
          fgColor: { argb: 'FFD3E3F5' } // Light blue background
        },
        alignment: { 
          horizontal: 'center' as const, 
          vertical: 'middle' as const,
          wrapText: true 
        },
        border: {
          top: { style: 'thin' as const, color: { argb: 'FF000000' } },
          left: { style: 'thin' as const, color: { argb: 'FF000000' } },
          bottom: { style: 'thin' as const, color: { argb: 'FF000000' } },
          right: { style: 'thin' as const, color: { argb: 'FF000000' } }
        }
      };

      const cellStyle = {
        alignment: { 
          horizontal: 'center' as const, 
          vertical: 'middle' as const,
          wrapText: true 
        },
        border: {
          top: { style: 'thin' as const, color: { argb: 'FFD3D3D3' } },
          left: { style: 'thin' as const, color: { argb: 'FFD3D3D3' } },
          bottom: { style: 'thin' as const, color: { argb: 'FFD3D3D3' } },
          right: { style: 'thin' as const, color: { argb: 'FFD3D3D3' } }
        }
      };

      const alternateRowStyle = {
        ...cellStyle,
        fill: {
          type: 'pattern' as const,
          pattern: 'solid' as const,
          fgColor: { argb: 'FFF5F5F5' } // Light gray for alternate rows
        }
      };

      // Add header row
      worksheet.addRow(headers);
      
      // Apply header styling to the first row
      const headerRow = worksheet.getRow(1);
      headerRow.height = 25; // Set header row height
      headerRow.eachCell({ includeEmpty: true }, (cell, colNumber) => {
        cell.style = headerStyle;
      });

      // Add data rows with alternating row colors
      formattedData.forEach((rowData, rowIndex) => {
        const row = worksheet.addRow(headers.map(header => rowData[header] || ''));
        
        // Apply alternating row colors (even rows get gray background)
        const rowStyle = rowIndex % 2 === 0 ? cellStyle : alternateRowStyle;
        
        // Apply cell styling to each cell in the row
        row.eachCell({ includeEmpty: true }, (cell, colNumber) => {
          cell.style = rowStyle;
        });
        
        // Set row height
        row.height = 20;
      });

      // Set column widths (auto-fit based on content)
      worksheet.columns.forEach((column, index) => {
        let maxLength = 10;
        
        // Check header length
        if (headers[index]) {
          maxLength = Math.max(maxLength, headers[index].length);
        }
        
        // Check data length in each cell of this column
        worksheet.getColumn(index + 1).eachCell({ includeEmpty: false }, (cell) => {
          const cellValue = cell.value?.toString() || '';
          maxLength = Math.max(maxLength, cellValue.length);
        });
        
        // Set column width (add some padding, max 50)
        column.width = Math.min(maxLength + 2, 50);
      });

      // Freeze the first row (sticky header)
      worksheet.views = [
        {
          state: 'frozen' as const,
          ySplit: 1, // Freeze first row
          activeCell: 'A2',
          showGridLines: true
        }
      ];

      // Generate Excel file buffer
      const buffer = await workbook.xlsx.writeBuffer();

      // Create blob and download
      const blob = new Blob([buffer], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8",
      });
      
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      const dateStr = new Date().toISOString().split('T')[0];
      link.setAttribute('download', `export-${dateStr}.xlsx`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Error exporting to Excel:", error);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <Button
      variant="outline"
      onClick={handleExport}
      disabled={!hasSelectedRows || isExporting}
      className={cn(
        "flex items-center gap-2 bg-green-600 text-white",
        "hover:bg-green-700 hover:text-white border-green-600 hover:border-green-700",
        "shadow-md hover:shadow-lg transition-all duration-200 font-medium",
        "disabled:bg-gray-300 disabled:border-gray-300 disabled:text-gray-500",
        "disabled:shadow-none disabled:cursor-not-allowed",
        className
      )}
    >
      {isExporting ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <FileDown className="h-4 w-4" />
      )}
      {isExporting ? t("exporting", "מייצא...") : t("export_to_excel")}
    </Button>
  );
}

