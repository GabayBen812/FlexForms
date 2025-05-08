import { UserRegistration } from "@/types/forms/UserRegistration";
import { ColumnDef } from "@tanstack/react-table";
import { useTranslation } from "react-i18next";
import { createApiService } from "@/api/utils/apiFactory";
import DataTable from "@/components/ui/completed/data-table";
import { Form } from "@/types/forms/Form";
import dayjs from "dayjs";
import { TableAction } from "@/types/ui/data-table-types";

const registrationsApi = createApiService<UserRegistration>("/registrations");

interface Props {
  form: Form;
}

export default function FormRegistrationsTable({ form }: Props) {
  const { t } = useTranslation();

  const actions: TableAction<UserRegistration>[] = [
    { label: t("delete"), type: "delete" },
  ];

  return (
    <div className="col-span-2">
      <h2 className="text-xl font-semibold mb-4">{t("registrations_list")}</h2>

      <DataTable<UserRegistration>
        fetchData={({ page = 1, pageSize = 10 }) => {
          console.log("Sending params:", {
            formId: form._id,
            page,
            pageSize,
          });

          return registrationsApi
            .customRequest("get", "/registrations", {
              params: {
                formId: form._id,
                page: String(page ?? 1),
                pageSize: String(pageSize ?? 10),
              },
            })
            .then((res) => {
              console.log("Response from /registrations:", res);
              return res;
            }) as Promise<{
            status: number;
            data: UserRegistration[];
            total: number;
          }>;
        }}
        columns={getColumns(t, form.fields || [])}
        idField="_id"
        isPagination
        defaultPageSize={10}
        pageSizeOptions={[5, 10, 20, 50]}
        searchable
        actions={actions}
      />
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
