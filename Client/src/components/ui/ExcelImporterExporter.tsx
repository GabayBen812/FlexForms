import React, { useEffect, useRef, useState } from "react";
import { HotTable } from "@handsontable/react";
import Handsontable from "handsontable";
import "handsontable/dist/handsontable.full.css";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import * as XLSX from "xlsx";
import { useTranslation } from "react-i18next";
import { FileDown, Download } from "lucide-react";

type ExcelImporterExporterProps = {
  title?: string;
  subtitle?: string;
  fields?: Array<{ visual_name: string; technical_name: string }>;
  excelData?: any[];
  onlyImport?: boolean;
  onlyExport?: boolean;
  loading?: boolean;
  importTitle?: string;
  exportTitle?: string;
  onExport?: () => void;
  onSave?: (data: any[]) => void;
  disabled?: boolean;
  color?: string;
};
export default function ExcelImporterExporter({
  title,
  subtitle,
  fields,
  excelData,
  onlyImport = false,
  onlyExport = false,
  loading = false,
  importTitle,
  exportTitle,
  onExport,
  onSave,
  disabled,
  color = "#2e7d32",
}: ExcelImporterExporterProps) {
  const [showDialog, setShowDialog] = useState(false);
  const [data, setData] = useState([]);
  const tableRef = useRef(null);
  const { t } = useTranslation();
  const [columns, setColumns] = useState([]);
  const [headers, setHeaders] = useState([]);

  useEffect(() => {
    if (!excelData?.length && fields?.length && data.length === 0) {
      const filtered = fields.filter(
        (f) =>
          f.visual_name !== "כמות ספורטאים" &&
          f.visual_name !== "כמות ספורטאים מאושרים"
      );
      const emptyRow = Object.fromEntries(
        filtered.map((f) => [f.technical_name, ""])
      );
      setData([emptyRow]);
    }
  }, [fields]);

  useEffect(() => {
    if (excelData) {
      setData(excelData);
    }
  }, [excelData]);

  const handleSave = () => {
    const hot = tableRef.current?.hotInstance as Handsontable | undefined;
    if (!hot || !fields) return;

    const rawData = hot.getData();
    const headers = fields.map((f) => f.technical_name);

    const parsedData = rawData
      .map((row) =>
        Object.fromEntries(headers.map((key, idx) => [key, row[idx]]))
      )
      .filter((rowObj) =>
        Object.values(rowObj).some(
          (val) =>
            val !== null && val !== undefined && String(val).trim() !== ""
        )
      );

    console.log("Parsed & Filtered Data", parsedData);
    onSave && onSave(parsedData);
    setShowDialog(false);
  };
  useEffect(() => {
    console.log(fields?.map((f) => f.visual_name));
    if (
      (!excelData || excelData.length === 0) &&
      fields?.length &&
      data.length === 0
    ) {
      const filtered = fields.filter(
        (f) =>
          f.visual_name !== "כמות ספורטאים" &&
          f.visual_name !== "כמות ספורטאים מאושרים"
      );
      const emptyRow = Object.fromEntries(
        filtered.map((f) => [f.technical_name, ""])
      );
      setData([emptyRow]);
    }
  }, [excelData, fields]);

  const handleExport = () => {
    if (!data || !data.length) return;
    console.log("fields", fields);
    console.log("data", data);
    const filteredFields = fields
      ?.filter(
        (field) =>
          field.technical_name !== "_id" &&
          field.technical_name !== "organizationId" &&
          field.technical_name !== "select"
      )
      .reverse();

    const exportData = data.map((row) => {
      const result: Record<string, any> = {};
      filteredFields?.forEach((field) => {
        const displayName = field.visual_name || field.technical_name;
        result[displayName] = row[field.technical_name] ?? "-";
      });
      return result;
    });
    const worksheet = XLSX.utils.json_to_sheet(exportData, {
      skipHeader: false,
    });
    worksheet["!cols"] = filteredFields.map(() => ({ wch: 15 }));
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Export");
    const today = new Date();
    const formattedDate = today.toLocaleDateString("he-IL").replace(/\//g, "-");
    const filename = `export_${formattedDate}.xlsx`;
    XLSX.writeFile(workbook, filename, { bookType: "xlsx", cellStyles: true });
  };

  return (
    <div style={{ textAlign: "center" }}>
      <div className="flex justify-center gap-2 mb-2">
        {!onlyExport && (
          <Button
            onClick={() => setShowDialog(true)}
            variant="success"
            disabled={disabled}
            className="gap-2"
          >
            {t("read_from_excel_file")}
            <FileDown className="w-5 h-5" />
          </Button>
        )}

        {!onlyImport && (
          <Button
            onClick={handleExport}
            variant="success"
            className="gap-2"
          >
            {t("export_to_excel_file")}
            <Download className="w-5 h-5" />
          </Button>
        )}
      </div>

      <Dialog
        open={showDialog}
        onOpenChange={(open) => {
          if (!open) {
            setShowDialog(false);
          }
        }}
      >
        <DialogContent className="w-[80vw] h-[70vh] max-w-none">
          <DialogHeader>
            <DialogTitle>{title}</DialogTitle>
            {subtitle && <DialogDescription>{subtitle}</DialogDescription>}
          </DialogHeader>
          {showDialog && (
            <HotTable
              ref={tableRef}
              colHeaders={fields?.map((f) => f.visual_name)}
              columns={fields?.map((f) => ({
                data: f.technical_name,
                width: 150,
              }))}
              licenseKey="non-commercial-and-evaluation"
              stretchH="all"
              height="60vh"
              rowHeaders={true}
            />
          )}

          <DialogFooter>
            <Button
              onClick={handleSave}
              //@ts-ignore
              variant="contained"
              disabled={loading}
              style={{
                backgroundColor: "green",
                color: "white",
                marginTop: "0px",
              }}
            >
              {t("save")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
