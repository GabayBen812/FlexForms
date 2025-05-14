import { useTranslation } from "react-i18next";
import { ColumnDef, RowSelectionState } from "@tanstack/react-table";
import { useNavigate } from "react-router-dom";
import DataTable from "@/components/ui/completed/data-table";
import { useOrganization } from "@/hooks/useOrganization";
import { createApiService } from "@/api/utils/apiFactory";
import { Form } from "@/types/forms/Form";
import { TableAction } from "@/types/ui/data-table-types";
import { useCallback, useEffect, useState } from "react";
import { Copy } from 'lucide-react';
import { AdvancedSearchModal } from "@/components/ui/completed/data-table/AdvancedSearchModal";
import { Button } from "@/components/ui/button";
import apiClient from "@/api/apiClient";

const formsApi = createApiService<Form>("/forms");

export default function Forms() {
  const { t } = useTranslation();
  const { organization } = useOrganization();
  const navigate = useNavigate();
  const [advancedFilters, setAdvancedFilters] = useState<Record<string, any>>({});
  const [isAdvancedOpen, setIsAdvancedOpen] = useState(false);
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
  const [registrationCounts, setRegistrationCounts] = useState<Record<string, number>>({});
  const [refreshKey, setRefreshKey] = useState(0);
  
const selectionColumn: ColumnDef<Form, any> = {
  id: "select",
  header: ({ table }) => (
    <input
      type="checkbox"
      checked={table.getIsAllPageRowsSelected()}
      onChange={table.getToggleAllPageRowsSelectedHandler()}
      onClick={(e) => e.stopPropagation()}
    />
  ),
  cell: ({ row }) => (
    <input
      type="checkbox"
      checked={row.getIsSelected()}
      onChange={row.getToggleSelectedHandler()}
      onClick={(e) => e.stopPropagation()}
    />
  ),
  size: 40,
};

  const columns: ColumnDef<Form>[] = [
    selectionColumn,
    {
      id: "duplicate",
      header: "",
      cell: ({ row }) => (
        <Button
          variant="outline" size="sm"
          onClick={(e) => {
          e.stopPropagation();
          handleDuplicateForm(row.original);
        }}
        >
          {t("duplicate_form")}
          <Copy className="w-5 h-5"/>
        </Button>
      ),
      size: 100,
    },
    { accessorKey: "title", header: t("form_title") },
    { accessorKey: "description", header: t("form_description") },
    {accessorKey: "numberOfRegistrations",
      header: t("number_of_registrations", "מספר נרשמים"),
      cell: ({ row }) => {
      const formId = row.original._id;
      return registrationCounts[formId] ?? 0;
      }
      },

    // {
    //   accessorKey: "organizationId",
    //   header: "",
    //   meta: { hidden: true },
    // },
  ];

  const actions: TableAction<Form>[] = [
    { label: t("delete"), type: "delete" },
  ];

  const fetchData = useCallback(
    async (params: any) => {
        const cleanParams = Object.fromEntries(
        Object.entries({ ...params, ...advancedFilters, organizationId: organization?._id }).filter(
          ([, v]) => v !== undefined && v !== ""
        )
      );
      if (!organization?._id)
        return Promise.resolve({ 
          data: [], 
          totalCount: 0, 
          totalPages: 0 
        });
      
      const res = await formsApi.fetchAll(cleanParams);
      const forms: Form[] = Array.isArray(res.data) ? res.data.filter(Boolean) : [];
      
      return {
        data: forms,
        totalCount: forms.length,
        totalPages: 1,
      };
    },
    [organization?._id, advancedFilters]
  );
  const wrappedFetchData = async (params: any) => {
    if (!organization?._id) return Promise.resolve({ status: 200, data: [] });
    const response = await formsApi.fetchAll(params, false, organization._id);
    const forms: Form[] = Array.isArray(response.data) ? response.data.filter(Boolean) : [];
     const formIds = forms.map((f) => f._id).join(",");
      if (formIds) {
        try {
          const res = await apiClient.get<{
            status: number;
            data: Record<string, number>;
          }>("/registrations/count-by-form-ids", {
            params: { formIds },
            headers: {
              Authorization: `Bearer ${localStorage.getItem("token") || ""}`,
            },
          });
          setRegistrationCounts(res.data.data || {});
        } catch (err) {
          console.error("שגיאה בשליפת מספר נרשמים:", err);
        }
      }

      return response;
    };
  const handleDuplicateForm = async (form: Form) => {
  try {
    const duplicatedForm = {
      ...form,
      title: `${form.title}-Copy`,
      _id: undefined,
      id: undefined,
      createdAt: undefined,
      updatedAt: undefined,
    };

    const created = await formsApi.create(duplicatedForm);
    if (created) {
  setRefreshKey(prev => prev + 1);
}
  } catch (error) {
    console.error("שגיאה בשכפול הטופס:", error);
    alert("שגיאה בשכפול הטופס");
  }
};

  return (
    <div className="mx-auto">
      <h1 className="text-2xl font-semibold text-primary mb-6">{t("forms")}</h1>
      <div className="flex gap-2 mb-2">
        <Button variant="outline" onClick={() => setIsAdvancedOpen(true)}>
          {t('advanced_search', 'חיפוש מתקדם')}
        </Button>
      </div>
      <AdvancedSearchModal
        open={isAdvancedOpen}
        onClose={() => setIsAdvancedOpen(false)}
        columns={columns}
        onApply={(filters) => {
          console.log('Advanced search filters:', filters);
          setAdvancedFilters(filters);
        }}
        initialFilters={advancedFilters}
      />
      <DataTable<Form>
        key={refreshKey}
        fetchData={wrappedFetchData}
        addData={(data) => formsApi.create(data)}
        updateData={(data) => formsApi.update({ ...data, id: data._id })}
        columns={columns}
        searchable
        showAddButton
        isPagination
        actions={actions}
        defaultPageSize={10}
        idField="_id"
        extraFilters={advancedFilters}
        rowSelection={rowSelection}
        onRowSelectionChange={setRowSelection}
        onRowClick={(formRow) => {
          const form = formRow.original;
          if (form.code && form._id) {
            navigate(`/forms/${form.code}/dashboard`);
          }
        }}
      />
    </div>
  );
}
