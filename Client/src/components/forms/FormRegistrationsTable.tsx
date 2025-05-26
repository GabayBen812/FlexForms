import { UserRegistration } from "@/types/forms/UserRegistration";
import { ColumnDef } from "@tanstack/react-table";
import { useTranslation } from "react-i18next";
import { createApiService } from "@/api/utils/apiFactory";
import DataTable from "@/components/ui/completed/data-table";
import { Form } from "@/types/forms/Form";
import dayjs from "dayjs";
import { TableAction } from "@/types/ui/data-table-types";
import { useState } from "react";
import { AdvancedSearchModal } from "@/components/ui/completed/data-table/AdvancedSearchModal";
import { Button } from "@/components/ui/button";
import { useSidebar } from "@/components/ui/sidebar";

const registrationsApi = createApiService<UserRegistration>("/registrations");

interface Props {
  form: Form;
}

export default function FormRegistrationsTable({ form }: Props) {
  const { t } = useTranslation();
  const [advancedFilters, setAdvancedFilters] = useState<Record<string, any>>({});
  const [isAdvancedOpen, setIsAdvancedOpen] = useState(false);
  const { state } = useSidebar();
  const sidebarIsCollapsed = state === "collapsed";

  const actions: TableAction<UserRegistration>[] = [
    { label: t("delete"), type: "delete" },
  ];

  return (
    <div className="col-span-2">
      <h2 className="text-xl font-semibold mb-4">{form.title}</h2>
      <div className="flex gap-2 mb-2">
        <Button variant="outline" onClick={() => setIsAdvancedOpen(true)}>
          {t('advanced_search', 'חיפוש מתקדם')}
        </Button>
      </div>
      <AdvancedSearchModal
        open={isAdvancedOpen}
        onClose={() => setIsAdvancedOpen(false)}
        columns={getColumns(t, form.fields || [])}
        onApply={setAdvancedFilters}
        initialFilters={advancedFilters}
      />
       <div
          className="overflow-x-auto w-full"
          style={{
            maxWidth: `calc(100vw - ${sidebarIsCollapsed ? "100px" : "20rem"})`
          }}
        >
      <DataTable<UserRegistration>
        data={[]}
        fetchData={({ page = 1, pageSize = 10, ...params }) => {
          const allParams = {
            ...params,
            ...advancedFilters,
            formId: form._id,
            page: String(page ?? 1),
            pageSize: String(pageSize ?? 10),
          };
          return registrationsApi
            .customRequest("get", "/registrations", {
              params: allParams,
            })
            .then((res) => res) as Promise<{
            status: number;
            data: UserRegistration[];
            total: number;
          }>;
        }}
        addData={(data) => registrationsApi.create(data)}
        updateData={(data) => registrationsApi.update({ ...data, id: data._id })}
        columns={getColumns(t, form.fields || [])}
        idField="_id"
        isPagination
        defaultPageSize={10}
        searchable
        actions={actions}
        extraFilters={advancedFilters}
      />
      </div>
    </div>
  );
}

function getColumns(
  t: ReturnType<typeof useTranslation>["t"],
  fields: { name: string; label: string; type?: string }[]
): ColumnDef<UserRegistration>[] {
  const baseColumns: ColumnDef<UserRegistration>[] = [
    { accessorKey: "fullName", header: t("full_name") },
    { accessorKey: "email", header: t("email") },
    { accessorKey: "phone", header: t("phone") },
    {
      accessorKey: "createdAt",
      header: t("registered_at"),
      cell: ({ row }) =>
        dayjs(row.original.createdAt).format("DD/MM/YYYY HH:mm"),
    },
  ];

  const additionalColumns: ColumnDef<UserRegistration>[] = fields
    .filter((f) => !!f.name)
    .map((field) => ({
      accessorKey: `additionalData.${field.name}`,
      header: field.label,
      cell: ({ row }) => {
        const val = row.original.additionalData?.[field.name];

        if (field.type === "signature" && typeof val === "string") {
          return (
            <img
              src={val}
              alt="signature"
              style={{ width: "120px", height: "60px", objectFit: "contain" }}
            />
          );
        }

        return val !== undefined && val !== "" ? val : "-";
      },
    }));

  return [...baseColumns, ...additionalColumns];
}
