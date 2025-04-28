import { useContext, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { ColumnDef } from "@tanstack/react-table";
import { z } from "zod";

import DataTable from "@/components/ui/completed/data-table";
import DynamicForm, { FieldConfig } from "@/pages/OrganizationSettings/Departments/DynamicForm";
import { OrganizationsContext } from "@/contexts/OrganizationsContext";
import { TableAction } from "@/types/ui/data-table-types";
import { User } from "@/types/api/user";
import { fetchRolesParams } from "@/api/roles";
import { Role } from "@/types/api/roles";
import { createUser, deleteUser, fetchUsersParams, adminUpdateUser } from "@/api/users";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Hotel } from "lucide-react";
import { handleImageChange } from "@/lib/formUtils";
import { Button } from "@/components/ui/button";

function Employees() {
  const { t, i18n } = useTranslation();
  const { organization } = useContext(OrganizationsContext);
  const [roleOptions, setRoleOptions] = useState<{ label: string; value: string }[]>([]);
  const [editPasswordMode, setEditPasswordMode] = useState(false);

  useEffect(() => {
    const fetchRoles = async () => {
      if (!organization?.id) return;
      const res = await fetchRolesParams({});
      if (Array.isArray(res.data)) {
        const formatted = res.data.map((role: Role) => ({
          label: role.name[i18n.language === "he" ? "he" : "en"] || role.name.en,
          value: JSON.stringify(role.name),
        }));
        setRoleOptions(formatted);
      }
    };
    fetchRoles();
  }, [organization?.id, i18n.language]);

  const columns: ColumnDef<User>[] = [
    {
      accessorKey: "logo",
      header: t("logo"),
      cell: ({ row }) => (
        <Avatar className="h-8 w-8">
          {row.original.logo ? (
            <AvatarImage src={row.original.logo} />
          ) : (
            <AvatarFallback>
              <Hotel className="h-4 w-4" />
            </AvatarFallback>
          )}
        </Avatar>
      ),
    },
    {
      accessorKey: "name",
      header: t("name"),
      cell: ({ row }) => <div>{row.original.name}</div>,
    },
    {
      accessorKey: "email",
      header: t("email"),
      cell: ({ row }) => <div>{row.original.email}</div>,
    },
    {
      accessorKey: "userType",
      header: t("user_type"),
      cell: ({ row }) => <div>{t(row.original.userType)}</div>,
    },
    {
      accessorKey: "role",
      header: t("role"),
      cell: ({ row }) => {
        const firstRole = row.original.organizationRoles?.[0]?.role;
        if (!firstRole) return "-";
        return (
          <div>
            {firstRole.name[i18n.language === "he" ? "he" : "en"] || firstRole.name.en}
          </div>
        );
      },
    },
    {
      accessorKey: "password",
      header: t("password"),
      cell: () => <div>******</div>,
    },
  ];

  const actions: TableAction<User>[] = [
    { label: t("edit"), type: "edit" },
    { label: t("delete"), type: "delete" },
  ];

  const userFormFields: FieldConfig[] = [
    { name: "logo", label: t("logo"), type: "image" },
    { name: "email", label: t("email"), type: "email" },
    { name: "name", label: t("name"), type: "text" },
    { name: "username", label: t("username"), type: "text" },
    {
      name: "userType",
      label: t("user_type"),
      type: "autocomplete",
      options: [
        { label: t("employee"), value: "EMPLOYEE" },
        { label: t("employer"), value: "EMPLOYER" },
      ],
    },
    {
      name: "roleName",
      label: t("role"),
      type: "autocomplete",
      options: roleOptions,
    },
    {
      name: "password",
      label: t("password"),
      type: "text",
    },
  ];

  const userSchema = z.object({
    email: z.string().email(),
    username: z.string().min(2),
    name: z.string().min(2),
    userType: z.enum(["EMPLOYER", "EMPLOYEE"]),
    roleName: z.string(),
    logo: z.any().optional(),
    password: z.string().min(6).optional(),
  });

  return (
    <div className="mx-auto p-6 space-y-6">
      <h1 className="text-3xl font-bold text-primary mb-4">{t("employees_page_title")}</h1>

      <DataTable<User>
        fetchData={fetchUsersParams}
        addData={createUser}
        deleteData={deleteUser}
        updateData={adminUpdateUser}
        columns={columns}
        actions={actions}
        searchable
        showAddButton
        isPagination
        defaultPageSize={10}
        idField="id"
        renderExpandedContent={({ handleSave, rowData, handleEdit }) => {
          const mode = rowData?.id ? "edit" : "create";
          const defaultValues = {
            ...rowData,
            password: "", // ריק כדי שלא יראו את ההאש!
            roleName: rowData?.organizationRoles?.[0]?.role?.name
              ? JSON.stringify(rowData.organizationRoles[0].role.name)
              : "",
          };
          return (
            <div style={{ zIndex: 50, position: "relative" }}>
              <DynamicForm
                mode={mode}
                headerKey="user"
                fields={userFormFields}
                validationSchema={userSchema}
                defaultValues={defaultValues}
                onSubmit={async (data: z.infer<typeof userSchema>) => {
                  const isCreateMode = mode === "create";

                  const isLogoChanged = data.logo instanceof File;

                  const logoPath = isLogoChanged
                    ? await handleImageChange({
                        newImage: data.logo,
                        oldImage: rowData?.logo,
                        isCreateMode,
                        path: `${organization?.id}/users`,
                      })
                    : rowData?.logo;

                  const parsedRoleName = data.roleName
                    ? JSON.parse(data.roleName)
                    : undefined;

                  const userData = {
                    ...data,
                    logo: logoPath,
                    roleName: parsedRoleName?.en || "",
                    id: rowData?.id,
                  };

                  console.log("logoPath", logoPath);
                  

                  try {
                    if (isCreateMode && handleSave) {
                      await handleSave(userData);
                    } else if (!isCreateMode && handleEdit) {
                      await handleEdit(userData);
                    }
                  } catch (error) {
                    console.error("Error submitting form:", error);
                  }
                }}
                extraButtons={
                  mode === "edit" ? (
                    <Button
                      variant="outline"
                      onClick={() => setEditPasswordMode(true)}
                      className="self-start mb-4"
                    >
                      {t("change_password")}
                    </Button>
                  ) : undefined
                }
              />
            </div>
          );
        }}
      />
    </div>
  );
}

export default Employees;
