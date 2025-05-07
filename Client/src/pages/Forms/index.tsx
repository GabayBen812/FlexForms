import { useTranslation } from "react-i18next";
import { ColumnDef } from "@tanstack/react-table";
import { z } from "zod";
import DataTable from "@/components/ui/completed/data-table";
import DynamicForm, { FieldConfig } from "@/components/forms/DynamicForm";
import { TableAction } from "@/types/ui/data-table-types";
import { useOrganization } from "@/hooks/useOrganization";
import { createApiService } from "@/api/utils/apiFactory";

export type Form = {
  id: string;
  formTitle: string;
  formDescription: string;
  fields: { label: string; type: string }[];
  isActive: boolean;
  createdAt: Date;
};

const formsApi = createApiService<Form>("/forms");

export default function Forms() {
  const { t } = useTranslation();
  const { organization, isOrganizationFetching } = useOrganization();

  const columns: ColumnDef<Form>[] = [
      { accessorKey: "title", header: t("form_title") },
      { accessorKey: "description", header: t("form_description") },
      { accessorKey: "fields", header: t("form_fields"),
        cell: ({ row }) => {
          const fields = row.original.fields;
          if (!fields || fields[0]?.label == "" || fields.length ==0) return "-";
      
          return (
            <details className="cursor-pointer">
              <summary>{fields[0]?.label}</summary>
              <ul className="mt-1 ml-4 list-disc">
                {fields.slice(1).map((field, index) => (
                  <li key={index}>{field.label}</li>
                ))}
              </ul>
            </details>
          );
        }
       },
      { accessorKey: "isActive", header: t("is_active") },
      { accessorKey: "createdAt", header: t("created_at") },
    ];

    const formFields: FieldConfig[] = [
      { name: "title", label: t("form_title"), type: "text" },
      { name: "description", label: t("form_description"), type: "text" },
      { name: "fields", label: t("form_fields"), type: "array" },
      { name: "isActive", label: t("is_active"), type: "boolean" }
    ];
    const formSchema = z.object({
            title: z.string().min(1),
            description: z.string(),
            });

  return (
    <div className="mx-auto">
      <h1 className="text-2xl font-semibold text-primary mb-6">{t("forms")}</h1>
      <DataTable<Form>
        fetchData={(params) => {
          if (!organization?._id) return Promise.resolve({ status: 200, data: [] });
          return formsApi.fetchAll(params, false, organization._id); // פרמטר שלישי - ה-ID
        }}
        // addData={paymentsApi.create}
        // deleteData={paymentsApi.delete}
        columns={columns}
        // actions={actions}
        searchable
        showAddButton
        isPagination
        defaultPageSize={10}
        idField="id"
        renderExpandedContent={({rowData, handleSave }) => (
          <DynamicForm
            mode="edit"
            headerKey="form"
            fields={formFields}
            validationSchema={formSchema}
            defaultValues={{
              title: rowData.title,
              description: rowData.description,
            }}
            onSubmit={async (data) => {
              console.log('Form ID:', rowData._id);
              const updatedForm = {
                ...data,
                id: rowData._id,
                organizationId: organization?.id,
              };
              const res = await formsApi.update(updatedForm);
              if (res.status === 200 && res.data) {
                handleSave?.(res.data);
              }
            }}
          />
        )}
      />
    </div>
  );
}
