import type { Role } from "@/types/api/roles";
import { TableAction } from "@/types/ui/data-table-types";
import { ColumnDef } from "@tanstack/react-table";
import { useTranslation } from "react-i18next";
import DynamicForm, { FieldConfig } from "../Departments/DynamicForm";
import { z } from "zod";
import DataTable from "@/components/ui/completed/data-table";
import {
  fetchRolesParams,
  createRole,
  updateRole,
  deleteRole,
} from "@/api/roles/index";
import PeopleIcon from "@/assets/icons/PeopleIcon";
import { useNavigate } from "react-router-dom";

function RoleList() {
  const { t, i18n } = useTranslation();
  const router = useNavigate();
  const columns: ColumnDef<Role>[] = [
    {
      accessorKey: "name",
      header: t("name"),
      cell: ({ row }) => <div>{row?.original?.name[i18n.language]}</div>,
      size: 100,
    },
    {
      accessorKey: "userCount",
      header: t("users_count"),
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <PeopleIcon />
          {row?.original?.userCount || 0}
          <h1>אנשים</h1>
        </div>
      ),
      size: 100,
    },
  ];
  const actions: TableAction<Role>[] = [
    { label: "Edit", type: "edit" },
    { type: "delete", label: "Delete" },
  ];
  const FormFields: FieldConfig[] = [
    { name: "name", label: t("name"), type: "language" },
  ];
  const schema = z.object({
    name: z.object({
      he: z.string().min(2),
      en: z.string().min(2),
    }),
  });
  return (
    <div className="p-2 flex flex-col gap-4">
      <div className="flex gap-3 items-center mb-3">
        <h1 className="text-2xl text-primary font-semibold">{t("roles")}</h1>
      </div>
      <DataTable<Role>
        fetchData={fetchRolesParams}
        addData={createRole}
        updateData={updateRole}
        deleteData={deleteRole}
        columns={columns}
        actions={actions}
        searchable={true}
        showAddButton={true}
        isPagination={true}
        onRowClick={(row) =>
          router(`?tab=roles&id=${row.original.id}`, { replace: true })
        }
        defaultPageSize={10}
        idField="id"
        renderExpandedContent={({ handleSave, rowData, handleEdit }) => {
          const mode = rowData?.id ? "edit" : "create";
          return (
            <DynamicForm
              mode={mode}
              defaultValues={rowData}
              headerKey="department"
              fields={FormFields}
              validationSchema={schema}
              onSubmit={(data: z.infer<typeof schema>) => {
                if (handleSave && mode === "create") handleSave(data);
                else if (handleEdit && mode === "edit")
                  handleEdit({ id: rowData?.id, ...data });
              }}
            />
          );
        }}
      />
    </div>
  );
}

export default RoleList;
