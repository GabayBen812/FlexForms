import { useContext, useMemo } from "react";
import { ColumnDef } from "@tanstack/react-table";
import { useTranslation } from "react-i18next";
import { z } from "zod";
import { DoorOpen } from "lucide-react";

import DataTable from "@/components/ui/completed/data-table";
import DynamicForm, { FieldConfig } from "../Departments/DynamicForm";
import { OrganizationsContext } from "@/contexts/OrganizationsContext";
import { deleteImage, getImage } from "@/lib/supabase";
import { handleImageChange, handleLogoUpload } from "@/lib/formUtils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

import { CallCategory } from "@/types/api/calls";
import { TableAction } from "@/types/ui/data-table-types";
import {
  deleteCallCategory,
  createCallCategory,
  updateCallCategory,
  fetchCallCategoriesParams,
} from "@/api/calls/categories";

import i18n from "@/i18n";

const CallSettingsTable = () => {
  const { t } = useTranslation();
  const { organization, departments } = useContext(OrganizationsContext);

  const columns: ColumnDef<CallCategory>[] = [
    {
      accessorKey: "logo",
      header: t("picture"),
      cell: ({ row }) => (
        <Avatar className="rounded-md size-12">
          <AvatarImage className="object-cover" src={row.getValue("logo")} />
          <AvatarFallback className="bg-sidebar-primary text-white rounded-md">
            <DoorOpen className="size-4" />
          </AvatarFallback>
        </Avatar>
      ),
      size: 100,
    },
    {
      accessorKey: "name",
      header: t("name"),
      cell: ({ row }) => {
        const name = row.getValue("name") as { he: string; en: string };
        return <div>{name[i18n.language as "he" | "en"]}</div>;
      },
      size: 100,
    },
  ];

  const actions: TableAction<CallCategory>[] = [
    { label: t("edit") },
    { type: "delete", label: t("delete") },
  ];
  const formattedDepartments = useMemo(() => {
    return departments?.map((dep) => ({
      label: dep.name[i18n.language as "he" | "en"],
      value: dep.id,
    }));
  }, [departments, i18n.language]);
  console.log(formattedDepartments, "Nigger");

  const formFields = useMemo<FieldConfig[]>(() => {
    return [
      { name: "logo", label: t("picture"), type: "image" },
      { name: "name", label: t("name"), type: "language" },
      {
        name: "departmentId",
        label: t("department"),
        type: "autocomplete",
        options: formattedDepartments,
      },
    ];
  }, [t, i18n.language, departments]);

  const schema = z.object({
    name: z.object({
      he: z.string().min(2),
      en: z.string().min(2),
    }),
    logo: z.any().optional(),
    departmentId: z.coerce.number().min(1),
  });

  return (
    <DataTable<CallCategory>
      idField="id"
      columns={columns}
      actions={actions}
      searchable
      showAddButton
      isPagination
      defaultPageSize={10}
      fetchData={fetchCallCategoriesParams}
      addData={createCallCategory}
      deleteData={deleteCallCategory}
      updateData={updateCallCategory}
      renderExpandedContent={({ handleSave, rowData, handleEdit }) => {
        const mode = rowData?.id ? "edit" : "create";
        return (
          <DynamicForm
            mode={mode}
            headerKey="call_category"
            fields={formFields}
            defaultValues={rowData}
            validationSchema={schema}
            onSubmit={async (formData) => {
              const isCreateMode = mode === "create";
              const logoPath = await handleImageChange({
                newImage: formData.logo,
                oldImage: rowData?.logo,
                isCreateMode,
                path: `${organization?.id}/callCategories`,
              });
              const payload: Partial<CallCategory> = {
                ...formData,
                logo: typeof logoPath === "string" ? logoPath : undefined,
                organizationId: organization?.id!,
                id: rowData?.id,
              };

              if (isCreateMode && handleSave) {
                handleSave(payload);
              } else if (!isCreateMode && handleEdit) {
                handleEdit(payload);
              }
            }}
          />
        );
      }}
    />
  );
};

export default CallSettingsTable;
