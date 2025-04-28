import { fetchPermissions, updatePermissions } from "@/api/permissions";
import { Checkbox } from "@/components/ui/checkbox";
import DataTable from "@/components/ui/completed/data-table";
import type { Permissions } from "@/types//api/roles";
import { TableAction } from "@/types/ui/data-table-types";
import { ColumnDef, Row, Table } from "@tanstack/react-table";
import { useTranslation } from "react-i18next";

function Permissions() {
  const { t } = useTranslation();
  const onPermissionUpdate = async (
    row: Row<Permissions>,
    table: Table<Permissions>,
    action: "canView" | "canCreate" | "canUpdate" | "canDelete"
  ) => {
    if (!table?.options?.meta?.handleEdit) return;
    table.options.meta.handleEdit({
      ...row.original,
      [action]: !row.original[action],
    });
  };
  const columns: ColumnDef<Permissions>[] = [
    {
      accessorKey: "resource",
      header: t("resource"),
      size: 100,
      cell: ({ row }) => (
        <div className="w-full flex justify-center">
          {t(row.original.resource)}
        </div>
      ),
    },
    {
      accessorKey: "canCreate",
      header: t("can_create"),
      size: 100,
      cell: ({ row, table }) => (
        <div className="w-full flex justify-center">
          <Checkbox
            className="w-6 h-6 rounded-md"
            onClick={() => {
              onPermissionUpdate(row, table, "canCreate");
            }}
            checked={row.original.canCreate}
          />
        </div>
      ),
    },
    {
      accessorKey: "canView",
      header: t("can_view"),
      size: 100,
      cell: ({ row, table }) => (
        <div className="w-full flex justify-center">
          <Checkbox
            className="w-6 h-6 rounded-md"
            onClick={() => {
              onPermissionUpdate(row, table, "canView");
            }}
            checked={row.original.canView}
          />
        </div>
      ),
    },
    {
      accessorKey: "canUpdate",
      header: t("can_update"),
      size: 100,
      cell: ({ row, table }) => (
        <div className="w-full flex justify-center">
          <Checkbox
            className="w-6 h-6 rounded-md"
            onClick={() => {
              onPermissionUpdate(row, table, "canUpdate");
            }}
            checked={row.original.canUpdate}
          />
        </div>
      ),
    },
  ];

  const actions: TableAction<Permissions>[] = [];
  return (
    <div>
      <div>
        <DataTable<Permissions>
          fetchData={() => fetchPermissions(4)}
          idField={"id"}
          updateData={updatePermissions}
          columns={columns}
          actions={actions}
          onRowClick={() => {}}
          searchable={false}
        />
      </div>
    </div>
  );
}

export default Permissions;
