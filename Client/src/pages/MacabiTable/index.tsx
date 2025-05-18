import { useTranslation } from "react-i18next";
import { ColumnDef } from "@tanstack/react-table";
import DataTable from "@/components/ui/completed/data-table";
import { useOrganization } from "@/hooks/useOrganization";
import { createApiService } from "@/api/utils/apiFactory";
import { MacabiClub } from "@/types/macabiClub/macabiClub";
import { FieldType } from "@/types/ui/data-table-types";
import { useState } from "react";
import { AdvancedSearchModal } from "@/components/ui/completed/data-table/AdvancedSearchModal";
import { Button } from "@/components/ui/button";
import { useSidebar } from "@/components/ui/sidebar";
import { InlineEditPopup } from "@/components/InlineEditPopup";
import { getClubColumns } from "@/columns/macabiClubColumns";

const usersApi = createApiService<MacabiClub>("/clubs");

export default function clubs() {
  const { t } = useTranslation();
  const { organization } = useOrganization();
  const [advancedFilters, setAdvancedFilters] = useState<Record<string, any>>({});
  const [isAdvancedOpen, setIsAdvancedOpen] = useState(false);
  const { state } = useSidebar();
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
const columns = getClubColumns(t);
  const visibleColumns = columns
  .filter((col) => !(col.meta?.hidden))
  .map((column) => ({
    ...column,
    cell: (info: any) => {
      const meta = column.meta;
      const value = info.getValue();
      if (meta?.editable) {
        return (
          <div
            onClick={(e) => {
              const rect = e.currentTarget.getBoundingClientRect();
              setEditingCell({
                rowIndex: info.row.index,
                columnId: info.column.id,
                value,
                fieldType: meta.fieldType,
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
  }));
  const [columnOrder, setColumnOrder] = useState<string[]>(() => 
  visibleColumns.map(col => col.accessorKey as string)
);

  return (
    <div className="mx-auto">
      <h1 className="text-2xl font-semibold text-primary mb-6">{t("clubs")}</h1>
      <div className="overflow-x-auto">
        <div className="flex gap-2 mb-2">
          <Button variant="outline" onClick={() => setIsAdvancedOpen(true)}>
            {t('advanced_search', 'חיפוש מתקדם')}
          </Button>
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
            maxWidth: `calc(100vw - ${sidebarIsCollapsed ? "100px" : "18rem"})`
          }}
        >
          <DataTable<MacabiClub>
            fetchData={(params) => {
              if (!organization?._id)
                return Promise.resolve({ status: 200, data: [] });
              return usersApi.fetchAll(params, false, organization._id);
            }}
            updateData={(updatedRow) => {
              return usersApi.update({
                ...updatedRow,
                id: updatedRow._id,
              });
            }}
            enableColumnReordering={true}
            columnOrder={columnOrder}
            onColumnOrderChange={setColumnOrder}
            columns={visibleColumns}
            searchable
            showAddButton
            isPagination
            defaultPageSize={10}
            idField="_id"
            extraFilters={advancedFilters}
            onRowClick={() => {
              
            }}
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
              editingCell.table?.options?.meta?.handleEdit(updatedRow);
              setEditingCell(null);
            }}
          />
        )}
        </div>
      </div>
    </div>
  );
}
