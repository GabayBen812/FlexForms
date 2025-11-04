import { useTranslation } from "react-i18next";
import { ColumnDef } from "@tanstack/react-table";
import { useNavigate } from "react-router-dom";
import DataTable from "@/components/ui/completed/data-table";
import { useOrganization } from "@/hooks/useOrganization";
import { createApiService } from "@/api/utils/apiFactory";
import { Request } from "@/types/requests/request";
import { useState } from "react";
import { AdvancedSearchModal } from "@/components/ui/completed/data-table/AdvancedSearchModal";
import { Button } from "@/components/ui/button";
import { Pencil } from "lucide-react";
import { nanoid } from "nanoid";
import { request } from "node:http";
import { RequestDefinitionDialog } from "@/components/request-definition";
import { Organization } from "@/types/api/organization";

const usersApiRequest = createApiService<Request>("/requests");
const usersApiOrganization = createApiService<Organization>("/organizations");

type RequestColumnMeta = { hidden?: boolean };

export default function Requests() {
  const { t } = useTranslation();
  const { organization } = useOrganization();
  const navigate = useNavigate();
  const [isRequestDefinitionOpen, setIsRequestDefinitionOpen] = useState(false);
  const [advancedFilters, setAdvancedFilters] = useState<Record<string, any>>(
    {}
  );
  const [isAdvancedOpen, setIsAdvancedOpen] = useState(false);
  const [requests, setRequests] = useState<Request[]>([]);
  const statusOptions = [
  { value: "בעריכה", label: t("status_in_editing") },
  { value: "הוגש", label: t("status_submitted") },
  { value: "טופל", label: t("status_handled") },
  { value: "נדחה", label: t("status_rejected") },
];

  const columns: ColumnDef<Request, any>[] = [
    {
      id: "edit",
      header: "#", 
      cell: ({ row }) => (
        <Button
          variant="ghost"
          size="icon"
          title={t("edit_request")}
        >
          <Pencil  className="w-4 h-4" />
        </Button>
      ),
      meta: { className: "text-center", editable: false },
    },
    { accessorKey: "name", header: t("request_name") },
    { accessorKey: "submittedBy", header: t("submitted_by") },
    { accessorKey: "type", header: t("request_type") },
   { 
  accessorKey: "status",
  header: t("request_status"),
  meta: { fieldType: "SELECT", options: statusOptions },
  cell: ({ getValue }) => {
    const value = getValue<string>();
    const option = statusOptions.find(opt => opt.value === value);
    return option ? option.label : value;
  },
  },
    

    { accessorKey: "organizationId", header: "", meta: { hidden: true } },
  ];
  
  const visibleColumns = columns.filter((col) => !((col.meta as any)?.hidden));

const handleSaveRequestDefinition = async (newRequestDefinition: any) => {
  try {
    if (!organization?._id) return;

    const orgRes = await usersApiOrganization.fetch({ path: organization._id });
    const orgData = orgRes?.data;
    if (!orgData) return;

    const existingDefs = orgData.requestDefinitions || {};

    let updatedDefinitions;

    if (newRequestDefinition.requestType) {
      const existing = existingDefs[newRequestDefinition.requestType];
      if (!existing) throw new Error("Invalid requestType");
      const updatedFields = {
  ...existing.fields,
  ...Object.fromEntries(
    newRequestDefinition.fields.map((f: any) => {
      const fieldData: any = { type: f.type };
      if (f.type === "FIELD_SELECT" && f.choices) {
        fieldData.choices = f.choices;
      }
      return [f.name, fieldData];
    })
  ),
};

      updatedDefinitions = {
        ...existingDefs,
        [newRequestDefinition.requestType]: {
          ...existing,
          fields: updatedFields,
        },
      };
    } else {
      const newId = nanoid();
      const fieldsObject = Object.fromEntries(
  newRequestDefinition.fields.map((f: any) => {
    const fieldData: any = { type: f.type };
    if (f.type === "FIELD_SELECT" && f.choices) {
      fieldData.choices = f.choices;
    }
    return [f.name, fieldData];
  })
);
      updatedDefinitions = {
        ...existingDefs,
        [newId]: {
          _id: newId,
          type: newRequestDefinition.requestName,
          fields: fieldsObject,
        },
      };
    }

    await usersApiOrganization.update({
      id: orgData._id,
      route: "request-definitions",
      ...updatedDefinitions,
    });

    console.log("Request definition saved successfully");
    setIsRequestDefinitionOpen(false);
  } catch (error) {
    console.error("Error saving request definition:", error);
  }
};


  return (
    <div className="mx-auto">
      <h1 className="text-2xl font-semibold text-primary mb-6">{t("requests")}</h1>
     
      <div className="mb-6">
      <Button
        variant="outline" 
        onClick={() => setIsRequestDefinitionOpen(true)}
        >
          {t("set_requests")}
        </Button></div>
        <RequestDefinitionDialog
      open={isRequestDefinitionOpen}
      onClose={() => setIsRequestDefinitionOpen(false)}
      onSave={handleSaveRequestDefinition}
    />
      <DataTable<Request>
        data={requests}
        updateData={async () => Promise.resolve({} as any)}
        fetchData={async (params) => {
          if (!organization?._id) return { status: 200, data: [] };
          const result = await usersApiRequest.fetchAll(
            { path: `organization/${organization._id}` },
            false,
            organization._id
          );
          if ("data" in result && Array.isArray(result.data))
            setRequests(result.data);
          return result;
        }}
        addData={usersApiRequest.create}
        columns={visibleColumns}
        searchable
        showAddButton
        showAdvancedSearch
        onAdvancedSearchChange={setAdvancedFilters}
        initialAdvancedFilters={advancedFilters}
        isPagination={false}
        defaultPageSize={10}
        idField="_id"
        extraFilters={advancedFilters}
        onRowClick={(user) => {}}
        organazitionId={organization?._id}
      />
    </div>
  );
}
