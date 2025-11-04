import { UserRegistration } from "@/types/forms/UserRegistration";
import { ColumnDef } from "@tanstack/react-table";
import { useTranslation } from "react-i18next";
import { createApiService } from "@/api/utils/apiFactory";
import DataTable from "@/components/ui/completed/data-table";
import { Form } from "@/types/forms/Form";
import { formatDateForDisplay } from "@/lib/dateUtils";
import { TableAction } from "@/types/ui/data-table-types";
import { useState, useEffect } from "react";
import { AdvancedSearchModal } from "@/components/ui/completed/data-table/AdvancedSearchModal";
import { Button } from "@/components/ui/button";
import { useSidebar } from "@/components/ui/sidebar";

const registrationsApi = createApiService<UserRegistration>("/registrations");

interface Props {
  form: Form;
}

export default function FormRegistrationsTable({ form }: Props) {
  const { t } = useTranslation();
  const [advancedFilters, setAdvancedFilters] = useState<Record<string, any>>(
    {}
  );
  const [isAdvancedOpen, setIsAdvancedOpen] = useState(false);
  const { state } = useSidebar();
  const sidebarIsCollapsed = state === "collapsed";
  const [registrations, setRegistrations] = useState<UserRegistration[]>([]);

  const actions: TableAction<UserRegistration>[] = [
    { label: t("delete"), type: "delete" },
  ];

  return (
    <div className="col-span-2">
      <h2 className="text-xl font-semibold mb-4">
        {form.title} - {t("registrations_list")}
      </h2>
      <div
        className="overflow-x-auto w-full"
        style={{
          maxWidth: `calc(100vw - ${sidebarIsCollapsed ? "100px" : "20rem"})`,
        }}
      >
        <DataTable<UserRegistration>
          data={registrations}
          fetchData={async ({ page = 1, pageSize = 10, ...params }) => {
            const allParams = {
              ...params,
              ...advancedFilters,
              formId: form._id,
              page: String(page ?? 1),
              pageSize: String(pageSize ?? 10),
            };
            const res = (await registrationsApi.customRequest(
              "get",
              "/registrations",
              {
                params: allParams,
              }
            )) as { status: number; data: UserRegistration[]; total: number };
            setRegistrations(res.data);
            return res;
          }}
          addData={(data) => registrationsApi.create(data)}
          updateData={(data) =>
            registrationsApi.update({ ...data, id: data._id })
          }
          columns={getColumns(
            t,
            form.fields || [],
            registrations.some(
              (r) => r.additionalData && r.additionalData.paymentDetails
            )
          )}
          idField="_id"
          defaultPageSize={10}
          searchable
          showAdvancedSearch
          onAdvancedSearchChange={setAdvancedFilters}
          initialAdvancedFilters={advancedFilters}
          actions={actions}
          extraFilters={advancedFilters}
          isPagination={false}
        />
      </div>
    </div>
  );
}

function getColumns(
  t: ReturnType<typeof useTranslation>["t"],
  fields: { name: string; label: string; type?: string }[],
  showPaymentColumns: boolean
): ColumnDef<UserRegistration>[] {
  const baseColumns: ColumnDef<UserRegistration>[] = [
    // { accessorKey: "fullName", header: t("full_name") },
    // { accessorKey: "email", header: t("email") },
    // { accessorKey: "phone", header: t("phone") },
    {
      accessorKey: "createdAt",
      header: t("registered_at"),
      meta: { isDate: true },
    },
  ];

  const paymentColumns: ColumnDef<UserRegistration>[] = showPaymentColumns
    ? [
        {
          accessorKey: "additionalData.paymentDetails.cardOwnerName",
          header: t("card_owner_name"),
          cell: ({ row }) =>
            row.original.additionalData?.paymentDetails?.cardOwnerName || "-",
        },
        {
          accessorKey: "additionalData.paymentDetails.last4Digits",
          header: t("last4digits"),
          cell: ({ row }) =>
            row.original.additionalData?.paymentDetails?.last4Digits || "-",
        },
        {
          accessorKey: "additionalData.paymentDetails.amountPaid",
          header: t("amount_paid"),
          cell: ({ row }) =>
            row.original.additionalData?.paymentDetails?.amountPaid ?? "-",
        },
        {
          accessorKey: "additionalData.paymentDetails.paymentDate",
          header: t("payment_date"),
          meta: { isDate: true },
          cell: ({ row }) =>
            formatDateForDisplay(
              row.original.additionalData?.paymentDetails?.paymentDate
            ) || "-",
        },
        {
          accessorKey: "additionalData.paymentDetails.lowProfileCode",
          header: t("low_profile_code"),
          cell: ({ row }) =>
            row.original.additionalData?.paymentDetails?.lowProfileCode || "-",
        },
      ]
    : [];

  const additionalColumns: ColumnDef<UserRegistration>[] = fields
    .filter((f) => !!f.name)
    .map((field) => ({
      accessorKey: `additionalData.${field.name}`,
      header: field.label,
      meta: field.type === "date" ? { isDate: true } : undefined,
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

        if (val && typeof val === "object") {
          return "-";
        }

        return val !== undefined && val !== "" ? val : "-";
      },
    }));

  return [...baseColumns, ...paymentColumns, ...additionalColumns];
}
