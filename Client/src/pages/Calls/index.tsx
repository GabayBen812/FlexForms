import { useTranslation } from "react-i18next";
import { useContext, useEffect } from "react";
import { ColumnDef } from "@tanstack/react-table";
import { z } from "zod";

import DataTable from "@/components/ui/completed/data-table";
import DynamicForm, { FieldConfig } from "@/pages/OrganizationSettings/Departments/DynamicForm";
import { OrganizationsContext } from "@/contexts/OrganizationsContext";
import { TableAction } from "@/types/ui/data-table-types";
import { createApiService } from "@/api/utils/apiFactory";
import { Call } from "@/types/api/calls";

const callsApi = createApiService<Call>("/calls", {
  includeOrgId: true,
});

export default function Calls() {
  const { t } = useTranslation();
  const { organization } = useContext(OrganizationsContext);

  useEffect(() => {
    callsApi.fetchAll().then(console.log);
  }, []);

  const columns: ColumnDef<Call>[] = [
    { accessorKey: "title", header: t("title") },
    { accessorKey: "description", header: t("description") },
    { accessorKey: "location", header: t("location") },
    { accessorKey: "roomNumber", header: t("room_number") },
    { accessorKey: "createdAt", header: t("created_at") },
    { accessorKey: "closedAt", header: t("closed_at") },
    { accessorKey: "departmentId", header: t("department") },
    { accessorKey: "createdById", header: t("created_by") },
    { accessorKey: "assignedToId", header: t("assigned_to") },
    { accessorKey: "closedById", header: t("closed_by") },
    { accessorKey: "status", header: t("status") },
    { accessorKey: "callCategoryId", header: t("call_category") },
  ];

  const actions: TableAction<Call>[] = [
    { label: t("edit") },
    { type: "delete", label: t("delete") },
  ];

  const callFormFields: FieldConfig[] = [
    { name: "title", label: t("title"), type: "text" },
    { name: "description", label: t("description"), type: "text" },
    { name: "location", label: t("location"), type: "text" },
    { name: "roomNumber", label: t("room_number"), type: "number" },
    { name: "departmentId", label: t("department"), type: "number" },
    { name: "createdById", label: t("created_by"), type: "number" },
    { name: "assignedToId", label: t("assigned_to"), type: "number" },
    { name: "closedById", label: t("closed_by"), type: "number" },
    {
      name: "status",
      label: t("status"),
      type: "autocomplete",
      options: [
        { label: "Open", value: "Open" },
        { label: "InProgress", value: "InProgress" },
        { label: "Closed", value: "Closed" },
      ],
    },
    { name: "callCategoryId", label: t("call_category"), type: "number" },
  ];

  const callSchema = z.object({
    title: z.string().min(1),
    description: z.string().min(1),
    location: z.string().min(1),
    roomNumber: z.number(),
    departmentId: z.number(),
    createdById: z.number(),
    assignedToId: z.number(),
    closedById: z.number().nullable(),
    status: z.enum(["Open", "InProgress", "Closed"]),
    callCategoryId: z.number(),
  });

  return (
    <div className="mx-auto">
      <h1 className="text-2xl font-semibold text-primary mb-6">{t("calls")}</h1>
      <DataTable<Call>
        fetchData={callsApi.fetchAll}
        addData={callsApi.create}
        deleteData={callsApi.delete}
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
            headerKey="call"
            fields={callFormFields}
            validationSchema={callSchema}
            onSubmit={async (data) => {
              const newCall = {
                ...data,
                organizationId: organization?.id,
              };
              const res = await callsApi.create(newCall);
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
