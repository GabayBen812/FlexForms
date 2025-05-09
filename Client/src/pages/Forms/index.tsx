import { useTranslation } from "react-i18next";
import { ColumnDef } from "@tanstack/react-table";
import { useNavigate } from "react-router-dom";
import DataTable from "@/components/ui/completed/data-table";
import { useOrganization } from "@/hooks/useOrganization";
import { createApiService } from "@/api/utils/apiFactory";
import { Form } from "@/types/forms/Form";
import { Action } from "sonner";
import { TableAction } from "@/types/ui/data-table-types";

const formsApi = createApiService<Form>("/forms");

export default function Forms() {
  const { t } = useTranslation();
  const { organization } = useOrganization();
  const navigate = useNavigate();

  const columns: ColumnDef<Form>[] = [
    { accessorKey: "title", header: t("form_title") },
    { accessorKey: "description", header: t("form_description") },
    {
      accessorKey: "fields",
      header: t("form_fields"),
      cell: ({ row }) => {
        const fields = row.original.fields;
        if (!fields || fields.length === 0 || fields[0]?.label === "") return "-";
  
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
      },
    },
    { accessorKey: "isActive", header: t("is_active") },
    { accessorKey: "createdAt", header: t("created_at") },
    {
      accessorKey: "organizationId",
      header: "",
      meta: { hidden: true },
    },
  ];

  const actions: TableAction<Form>[] = [
    { label: t("delete"), type: "delete" },
  ];

  return (
    <div className="mx-auto">
      <h1 className="text-2xl font-semibold text-primary mb-6">{t("forms")}</h1>
      <DataTable<Form>
        fetchData={(params) => {
          if (!organization?._id)
            return Promise.resolve({ status: 200, data: [] });
          return formsApi.fetchAll(params, false, organization._id);
        }}
        addData={(data) => formsApi.create(data)}
        updateData={(data) => formsApi.update({ ...data, id: data._id })}
        columns={columns}
        searchable
        showAddButton
        isPagination
        actions={actions}
        defaultPageSize={10}
        idField="_id"
        onRowClick={(formRow) => {
          const form = formRow.original;
          if (form.code && form._id) {
            navigate(`/forms/${form.code}`);
          }
        }}
      />
    </div>
  );
}
