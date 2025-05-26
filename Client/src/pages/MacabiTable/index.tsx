import { useTranslation } from "react-i18next";
import { ColumnDef, RowSelectionState } from "@tanstack/react-table";
import DataTable from "@/components/ui/completed/data-table";
import { useOrganization } from "@/hooks/useOrganization";
import { createApiService } from "@/api/utils/apiFactory";
import { MacabiClub } from "@/types/macabiClub/macabiClub";
import { FieldType } from "@/types/ui/data-table-types";
import { useEffect, useState } from "react";
import { AdvancedSearchModal } from "@/components/ui/completed/data-table/AdvancedSearchModal";
import { Button } from "@/components/ui/button";
import { useSidebar } from "@/components/ui/sidebar";
import { InlineEditPopup } from "@/components/InlineEditPopup";
import { getClubColumns } from "@/columns/macabiClubColumns";
import ExcelImporterExporter from "@/components/ui/ExcelImporterExporter";
import apiClient from "@/api/apiClient";

const usersApi = createApiService<MacabiClub>("/clubs");

export default function clubs() {
  const { t } = useTranslation();
  const { organization } = useOrganization();
  const [advancedFilters, setAdvancedFilters] = useState<Record<string, any>>(
    {}
  );
  const [isAdvancedOpen, setIsAdvancedOpen] = useState(false);
  const { state } = useSidebar();
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
  const [editingCell, setEditingCell] = useState<{
    rowIndex: number;
    columnId: string;
    value: any;
    fieldType: FieldType;
    position: { x: number; y: number };
    options?: any;
    rowData: MacabiClub;
    table: any;
  } | null>(null);
  const sidebarIsCollapsed = state === "collapsed";
  const [excelData, setExcelData] = useState<MacabiClub[]>([]);
  const [currentVisibleRows, setCurrentVisibleRows] = useState<any[]>([]);
  const columns = getClubColumns(t);

  const visibleColumns = columns
    //@ts-ignore
    .filter((col) => !col.meta?.hidden)
    .map((column) => {
      if (column.id === "select") {
        return column;
      }

      return {
        ...column,
        cell: (info: any) => {
          const meta = column.meta;
          const value = info.getValue();

          //@ts-ignore
          if (meta?.editable) {
            return (
              <div
                onClick={(e) => {
                  const rect = e.currentTarget.getBoundingClientRect();
                  setEditingCell({
                    rowIndex: info.row.index,
                    columnId: info.column.id,
                    value,
                    //@ts-ignore
                    fieldType: meta.fieldType,
                    //@ts-ignore
                    options: meta.options,
                    rowData: info.row.original,
                    table: info.table,
                    position: { x: rect.left + rect.width / 2, y: rect.bottom },
                  });
                }}
              >
                {value?.toString?.() || ""}
              </div>
            );
          }

          return <div className="px-2 py-1">{value?.toString?.() || ""}</div>;
        },
      };
    });

  const [columnOrder, setColumnOrder] = useState<string[]>(
    //@ts-ignore
    () => visibleColumns.map((col) => col.id ?? col.accessorKey) as string[]
  );
  const fieldMap: Record<string, string> = {};
  columns.forEach((col) => {
    //@ts-ignore
    const accessor = col.accessorKey;
    const header = col.header?.toString?.();
    if (accessor && header) {
      fieldMap[header] = accessor;
    }
  });

  const handleExcelSave = async (newData: Record<string, any>[]) => {
    for (const newclub of newData) {
      try {
        if (newclub._id) {
          await usersApi.update({ ...newclub, id: newclub._id });
        } else {
          newclub.organizationId = organization?._id;
          await usersApi.create(newclub);
        }
      } catch (error) {
        console.error("Failed to import row", newclub, error);
      }
    }
  };
  return (
    <div className="mx-auto">
      <h1 className="text-2xl font-semibold text-primary mb-6">{t("clubs")}</h1>
      <div className="overflow-x-auto">
        <div className="flex gap-2 mb-2">
          <Button variant="outline" onClick={() => setIsAdvancedOpen(true)}>
            {t("advanced_search", "חיפוש מתקדם")}
          </Button>
          <ExcelImporterExporter
            title={t("import_excel_title", "ייבוא קובץ מועדונים")}
            subtitle={t(
              "import_excel_subtitle",
              "אנא וודא שהעמודות תואמות לשדות"
            )}
            fields={columns
              .map((col) => ({
                visual_name: col.header?.toString?.() || "",
                //@ts-ignore
                technical_name: col.accessorKey || col.id || "",
              }))
              .slice(1, -1)}
            onlyImport={false}
            onlyExport={false}
            excelData={currentVisibleRows}
            onSave={(data) => {
              handleExcelSave(data);
              setExcelData(data);
            }}
          />
        </div>
        <AdvancedSearchModal
          open={isAdvancedOpen}
          onClose={() => setIsAdvancedOpen(false)}
          columns={visibleColumns}
          onApply={setAdvancedFilters}
          initialFilters={advancedFilters}
        />
        <div
          className="overflow-x-auto w-full"
          style={{
            maxWidth: `calc(100vw - ${sidebarIsCollapsed ? "100px" : "18rem"})`,
          }}
        >
          <DataTable<MacabiClub>
            fetchData={(params) => {
              if (!organization?._id)
                return Promise.resolve({ status: 200, data: [] });
              return usersApi.fetchAll(params, false, organization._id);
            }}
            updateData={(updatedRow) => {
              console.log("updatedRow", updatedRow);
              return usersApi.update({
                ...updatedRow,
                //@ts-ignore
                id: updatedRow._id,
              });
            }}
            enableColumnReordering={true}
            columnOrder={columnOrder}
            onColumnOrderChange={setColumnOrder}
            columns={visibleColumns}
            rowSelection={rowSelection}
            onRowSelectionChange={setRowSelection}
            stickyColumnCount={3}
            searchable
            showAddButton
            isPagination
            defaultPageSize={465}
            visibleRows={setCurrentVisibleRows}
            //@ts-ignore
            idField="_id"
            extraFilters={advancedFilters}
            onRowClick={() => {}}
          />
          {editingCell && (
            <InlineEditPopup
              value={editingCell.value}
              fieldType={editingCell.fieldType}
              position={editingCell.position}
              options={editingCell.options}
              onClose={() => setEditingCell(null)}
              onSave={(newValue) => {
                const columnId = editingCell.columnId;
                const rowData = editingCell.rowData;
                const updatedRow = {
                  ...rowData,
                  [columnId]: newValue,
                };
                editingCell.table?.options?.meta?.handleEdit(
                  editingCell.table.getRow(editingCell.rowIndex),
                  { [columnId]: newValue }
                );
                setEditingCell(null);
              }}
            />
          )}
        </div>
      </div>
    </div>
  );
}
