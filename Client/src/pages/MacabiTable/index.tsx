import { useTranslation } from "react-i18next";
import { ColumnDef, RowSelectionState } from "@tanstack/react-table";
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  flexRender,
} from "@tanstack/react-table";
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
import CustomClubTable from "@/components/CustomClubTable";
import { useToast } from "@/hooks/use-toast";

const usersApi = createApiService<MacabiClub>("/clubs");

export default function clubs() {
  const { t } = useTranslation();
   const { toast } = useToast();
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
  const [clubsData, setClubsData] = useState<MacabiClub[]>([]);
  const columns = getClubColumns(t);

  const visibleColumns = columns
    //@ts-ignore
    .filter((col) => !col.meta?.hidden)
    .map((column) => {
      if (column.id === "select") {
        return column;
      }

      useEffect(() => {
        if (!organization?._id) return;

        usersApi.fetchAll({ pageSize: 1000 }, false, organization._id)
            .then((res) => {
            setClubsData(res.data);
            setCurrentVisibleRows(res.data);
          })
          .catch((err) => {
            console.error("Failed to fetch clubs:", err);
          });
      }, [organization?._id]);

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

    const table = useReactTable({
      data: clubsData,
      columns: visibleColumns,
      state: {
        rowSelection,
      },
      onRowSelectionChange: setRowSelection,
      getCoreRowModel: getCoreRowModel(),
      getSortedRowModel: getSortedRowModel(),
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

const handleEditCellSave = async (newValue) => {
  const columnId = editingCell.columnId;
  const rowData = editingCell.rowData;

  const updatedRow = {
    ...rowData,
    [columnId]: newValue,
  };

  try {
    await usersApi.update({
      ...updatedRow,
      id: updatedRow._id,
    });

    setClubsData((prev) =>
      prev.map((row) => (row._id === updatedRow._id ? updatedRow : row))
    );
    toast({
      title: t("changes_updated_successfully"),
      description: t("changes_updated_successfully"),
      duration: 1000,
      variant: "success",
    });
    

  } catch (error) {
    console.error("Failed to update row", error);
  }

  setEditingCell(null);
};

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
        <div
          className="overflow-x-auto w-full"
          style={{
            maxWidth: `calc(100vw - ${sidebarIsCollapsed ? "100px" : "18rem"})`,
          }}
        >
          <div className="max-h-[calc(100vh-15rem)] overflow-auto relative">
          <CustomClubTable
            table={table}
            // columns={visibleColumns}
            // data={clubsData}
            // rowSelection={rowSelection}
            // onRowSelectionChange={setRowSelection}
            // editingCell={editingCell}
            setEditingCell={setEditingCell}/>
            </div>
          {editingCell && (
            <InlineEditPopup
              value={editingCell.value}
              fieldType={editingCell.fieldType}
              position={editingCell.position}
              options={editingCell.options}
              onClose={() => setEditingCell(null)}
              onSave= {handleEditCellSave}
            />
          )}
        </div>
      </div>
    </div>
  );
}
