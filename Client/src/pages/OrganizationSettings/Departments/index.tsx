import { useContext } from "react";
import DataTable from "@/components/ui/completed/data-table";
import { ColumnDef } from "@tanstack/react-table";
import { useTranslation } from "react-i18next";
import { TableAction } from "@/types/ui/data-table-types";
import { fetchDepartmentsParams } from "@/api/departments";
import { Department } from "@/types/api/departments";
import i18n from "@/i18n";
import DynamicForm, { FieldConfig } from "./DynamicForm";
import { z } from "zod";
import { OrganizationsContext } from "@/contexts/OrganizationsContext";
import { handleImageChange } from "@/lib/formUtils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Building } from "lucide-react";

const UserTable = () => {
  const { t } = useTranslation();
  const {
    organization,
    createNewDepartment,
    deleteDepartment,
    updateDepartment,
    departments,
  } = useContext(OrganizationsContext);
  const columns: ColumnDef<Department>[] = [
    {
      accessorKey: "logo",
      header: t("picture"),
      cell: ({ row }) => (
        <div>
          {
            <Avatar className="rounded-md size-12">
              <AvatarImage
                className="object-cover rounded-full"
                src={row.getValue("logo")}
              />
              <AvatarFallback className="rounded-md text-white bg-[var(--datatable-header)]">
                <Building className="size-4" />
              </AvatarFallback>
            </Avatar>
          }
        </div>
      ),
      size: 100,
    },
    {
      accessorKey: "name",
      header: t("name"),
      cell: ({ row }) => <div>{row.original.name[i18n.language]}</div>,
      size: 100,
    },
  ];

  const actions: TableAction<Department>[] = [
    { label: "Edit" },
    { type: "delete", label: "Delete" },
  ];
  const userFormFields: FieldConfig[] = [
    { name: "logo", label: t("picture"), type: "image" },
    { name: "name", label: t("name"), type: "language" },
  ];

  const userSchema = z.object({
    name: z.object({
      he: z.string().min(2),
      en: z.string().min(2),
    }),
    logo: z.any().optional(),
  });
  return (
    <DataTable<Department>
      initialData={departments}
      fetchData={fetchDepartmentsParams}
      addData={createNewDepartment}
      deleteData={deleteDepartment}
      updateData={updateDepartment}
      columns={columns}
      actions={actions}
      searchable={true}
      showAddButton={true}
      isPagination={true}
      defaultPageSize={10}
      idField="id"
      renderExpandedContent={({ handleSave, rowData, handleEdit }) => {
        const mode = rowData?.id ? "edit" : "create";
        return (
          <DynamicForm
            mode={mode}
            defaultValues={rowData}
            headerKey="department"
            fields={userFormFields}
            validationSchema={userSchema}
            onSubmit={async (data: z.infer<typeof userSchema>) => {
              const isCreateMode = mode === "create";

              const logoPath = await handleImageChange({
                newImage: data.logo,
                oldImage: rowData?.logo,
                isCreateMode,
                path: `${organization?.id}/departments`,
              });

              const departmentData: Partial<Department> = {
                ...data,
                logo: logoPath,
              };

              if (!isCreateMode) departmentData.id = rowData?.id;

              if (isCreateMode && handleSave) {
                handleSave(departmentData);
              } else if (!isCreateMode && handleEdit) {
                handleEdit(departmentData);
              }
            }}
          />
        );
      }}
    />
  );
};

export default UserTable;
