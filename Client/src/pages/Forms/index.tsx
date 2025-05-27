import { useTranslation } from "react-i18next";
import { ColumnDef, RowSelectionState } from "@tanstack/react-table";
import { useNavigate } from "react-router-dom";
import DataTable from "@/components/ui/completed/data-table";
import { useOrganization } from "@/hooks/useOrganization";
import { createApiService } from "@/api/utils/apiFactory";
import { Form } from "@/types/forms/Form";
import { TableAction } from "@/types/ui/data-table-types";
import { useCallback, useEffect, useState, useMemo } from "react";
import { Copy, Plus } from "lucide-react";
import { AdvancedSearchModal } from "@/components/ui/completed/data-table/AdvancedSearchModal";
import { Button } from "@/components/ui/button";
import apiClient from "@/api/apiClient";

const formsApi = createApiService<Form>("/forms");

export default function Forms() {
  const { t } = useTranslation();
  const { organization } = useOrganization();
  const navigate = useNavigate();
  const [advancedFilters, setAdvancedFilters] = useState<Record<string, any>>(
    {}
  );
  const [isAdvancedOpen, setIsAdvancedOpen] = useState(false);
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
  const [registrationCounts, setRegistrationCounts] = useState<
    Record<string, number>
  >({});
  const [refreshKey, setRefreshKey] = useState(0);

  const selectionColumn: ColumnDef<Form, any> = {
    accessorKey: "select",
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
      accessorKey: "numberOfRegistrations",
      header: t("number_of_registrations", "מספר נרשמים"),
      cell: ({ row }) => (
        <div className="w-full text-center">
          {registrationCounts[row.original._id] ?? 0}
        </div>
      ),
      size: 120,
    },
    {
      accessorKey: "description",
      header: t("form_description"),
      cell: ({ row }) => (
        <div className="w-full text-center">{row.getValue("description")}</div>
      ),
      size: 300,
    },
    {
      accessorKey: "title",
      header: t("form_title"),
      cell: ({ row }) => (
        <div className="w-full text-center">{row.getValue("title")}</div>
      ),
      size: 250,
    },
  ];

  const columnOrder = [
    "select",
    "title",
    "description",
    "numberOfRegistrations",
  ];

  const actions: TableAction<Form>[] = [{ label: t("delete"), type: "delete" }];

  const fetchData = useCallback(
    async (params: any) => {
      const cleanParams = Object.fromEntries(
        Object.entries({
          ...params,
          ...advancedFilters,
          organizationId: organization?._id,
        }).filter(([, v]) => v !== undefined && v !== "")
      );
      if (!organization?._id)
        return Promise.resolve({
          data: [],
          totalCount: 0,
          totalPages: 0,
        });

      const res = await formsApi.fetchAll(cleanParams);
      const forms: Form[] = Array.isArray(res.data)
        ? res.data.filter(Boolean)
        : [];

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
    const forms: Form[] = Array.isArray(response.data)
      ? response.data.filter(Boolean)
      : [];
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
        setRefreshKey((prev) => prev + 1);
      }
    } catch (error) {
      console.error("שגיאה בשכפול הטופס:", error);
      alert("שגיאה בשכפול הטופס");
    }
  };

  const CustomAddButton = useMemo(
    () => (
      <Button variant="outline" onClick={() => navigate("/create-form")}>
        <Plus className="w-4 h-4 mr-2" /> צור טופס חדש
      </Button>
    ),
    [navigate]
  );

  return (
    <div className="mx-auto">
      <h1 className="text-2xl font-semibold text-primary mb-6">{t("forms")}</h1>
      <DataTable<Form>
        data={[]}
        key={refreshKey}
        fetchData={wrappedFetchData}
        addData={(data) => formsApi.create(data)}
        updateData={(data) => formsApi.update({ ...data, id: data._id })}
        columns={columns}
        columnOrder={columnOrder}
        searchable
        showAdvancedSearch
        onAdvancedSearchChange={setAdvancedFilters}
        initialAdvancedFilters={advancedFilters}
        showAddButton={[{ name: "numberOfRegistrations", defaultValue: "0" }]}
        customAddButton={CustomAddButton}
        actions={actions}
        defaultPageSize={10}
        idField="_id"
        extraFilters={advancedFilters}
        rowSelection={rowSelection}
        onRowSelectionChange={setRowSelection}
        onRowClick={(form) => {
          if (form && form.code && form._id) {
            navigate(`/forms/${form.code}/dashboard`);
          } else {
            console.warn("Form row is missing code or _id", form);
          }
        }}
        showActionColumn={true}
        showEditButton={true}
        showDeleteButton={true}
        showDuplicateButton={true}
        isPagination={false}
      />
    </div>
  );
}
