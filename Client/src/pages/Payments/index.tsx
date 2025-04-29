import { useTranslation } from "react-i18next";
import { useContext } from "react";
import { ColumnDef } from "@tanstack/react-table";
import { z } from "zod";

import DataTable from "@/components/ui/completed/data-table";
import DynamicForm, { FieldConfig } from "@/components/forms/DynamicForm";
import { OrganizationsContext } from "@/contexts/OrganizationsContext";
import { TableAction } from "@/types/ui/data-table-types";
import { createApiService } from "@/api/utils/apiFactory";

export type Payment = {
  id: string;
  payerName: string;
  payerEmail: string;
  amount: number;
  date: string;
  formId: string;
};

const paymentsApi = createApiService<Payment>("/payments", {
  includeOrgId: true,
});

export default function Payments() {
  const { t } = useTranslation();
  const { organization } = useContext(OrganizationsContext);

  const columns: ColumnDef<Payment>[] = [
    { accessorKey: "payerName", header: t("payer_name") },
    { accessorKey: "payerEmail", header: t("payer_email") },
    { accessorKey: "amount", header: t("amount") },
    { accessorKey: "date", header: t("date") },
    { accessorKey: "formId", header: t("form") },
  ];

  const actions: TableAction<Payment>[] = [
    { label: t("edit"), type: "edit" },
    { label: t("delete"), type: "delete" },
  ];

  const paymentFormFields: FieldConfig[] = [
    { name: "payerName", label: t("payer_name"), type: "text" },
    { name: "payerEmail", label: t("payer_email"), type: "email" },
    { name: "amount", label: t("amount"), type: "number" },
    { name: "date", label: t("date"), type: "date" },
    { name: "formId", label: t("form"), type: "text" },
  ];

  const paymentSchema = z.object({
    payerName: z.string().min(1),
    payerEmail: z.string().email(),
    amount: z.number(),
    date: z.string(),
    formId: z.string(),
  });

  return (
    <div className="mx-auto">
      <h1 className="text-2xl font-semibold text-primary mb-6">{t("payments")}</h1>
      <DataTable<Payment>
        fetchData={paymentsApi.fetchAll}
        addData={paymentsApi.create}
        deleteData={paymentsApi.delete}
        columns={columns}
        actions={actions}
        searchable
        showAddButton
        isPagination
        defaultPageSize={10}
        idField="id"
        renderExpandedContent={({ handleSave }) => (
          <DynamicForm
            mode="create"
            headerKey="payment"
            fields={paymentFormFields}
            validationSchema={paymentSchema}
            onSubmit={async (data) => {
              const newPayment = {
                ...data,
                organizationId: organization?.id,
              };
              const res = await paymentsApi.create(newPayment);
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