import { useTranslation } from "react-i18next";
import { ColumnDef, RowSelectionState } from "@tanstack/react-table";
import { useNavigate } from "react-router-dom";
import DataTable from "@/components/ui/completed/data-table";
import { useOrganization } from "@/hooks/useOrganization";
import { createApiService } from "@/api/utils/apiFactory";
import { Form } from "@/types/forms/Form";
import { TableAction } from "@/types/ui/data-table-types";
import { useCallback, useEffect, useState, useMemo } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Copy, Plus, CheckCircle2, XCircle, ExternalLink } from "lucide-react";
import { AdvancedSearchModal } from "@/components/ui/completed/data-table/AdvancedSearchModal";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import apiClient from "@/api/apiClient";
import { mergeColumnsWithDynamicFields } from "@/utils/tableFieldUtils";
import { showConfirm } from "@/utils/swal";
import { formatDateForDisplay } from "@/lib/dateUtils";
import { fetchSeasons } from "@/api/seasons";

const formsApi = createApiService<Form>("/forms");

export default function Forms() {
  const { t } = useTranslation();
  const { organization } = useOrganization();
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [advancedFilters, setAdvancedFilters] = useState<Record<string, any>>(
    {}
  );
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
  const [refreshKey, setRefreshKey] = useState(0);
  const [tableRows, setTableRows] = useState<Form[]>([]);

  // Get form IDs from table rows for the query
  const formIds = useMemo(
    () => tableRows.map((f) => f._id).filter(Boolean).join(","),
    [tableRows]
  );

  // Fetch registration counts using React Query
  const { data: registrationCounts = {} } = useQuery({
    queryKey: ["registrationCounts", formIds, organization?._id],
    queryFn: async () => {
      if (!formIds || !organization?._id) return {};
      const res = await apiClient.get<{
        status: number;
        data: Record<string, number>;
      }>("/registrations/count-by-form-ids", {
        params: {
          formIds,
          organizationId: organization._id,
        },
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token") || ""}`,
        },
      });
      return (res.data as any).data || res.data;
    },
    enabled: !!formIds && !!organization?._id,
    staleTime: 30000, // Cache for 30 seconds
  });

  // Fetch seasons for the season column
  const { data: seasons = [] } = useQuery({
    queryKey: ["seasons", organization?._id],
    queryFn: fetchSeasons,
    enabled: !!organization?._id,
  });

  const selectionColumn: ColumnDef<Form, any> = {
    id: "select",
    enableSorting: false,
    header: () => null,
    cell: ({ row }) => (
      <div className="flex justify-center">
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={(checked) => row.toggleSelected(!!checked)}
          onClick={(e) => e.stopPropagation()}
          aria-label="Select row"
        />
      </div>
    ),
    size: 56,
    minSize: 48,
  };

  const handleTitleClick = (form: Form) => {
    if (form && form.code && form._id) {
      navigate(`/activity/${form.code}/dashboard`);
    } else {
      console.warn("Form row is missing code or _id", form);
    }
  };

  const baseColumns = useMemo<ColumnDef<Form>[]>(() => [
    selectionColumn,
    {
      accessorKey: "title",
      header: t("form_title"),
      cell: ({ row }) => {
        const form = row.original;
        return (
          <div
            className="w-full text-center cursor-pointer text-primary hover:text-primary/80 hover:underline transition-colors text-lg font-medium"
            onClick={(e) => {
              e.stopPropagation();
              handleTitleClick(form);
            }}
          >
            {form.title}
          </div>
        );
      },
      size: 250,
      minSize: 220,
      meta: { editable: false },
    },
    {
      accessorKey: "actions",
      header: t("actions"),
      size: 300,
      minSize: 260,
      meta: { editable: false },
    },
    {
      accessorKey: "numberOfRegistrations",
      header: t("number_of_registrations", "מספר נרשמים"),
      cell: ({ row }) => (
        <div className="w-full text-center">
          {registrationCounts[row.original._id] ?? 0}
        </div>
      ),
      size: 140,
      minSize: 120,
      meta: { editable: false },
    },
    {
      accessorKey: "createdAt",
      header: t("date_created", "תאריך יצירה"),
      cell: ({ row }) => (
        <div className="w-full text-center">
          {formatDateForDisplay(row.original.createdAt)}
        </div>
      ),
      size: 150,
      minSize: 130,
      meta: { editable: false, isDate: true },
    },
    {
      accessorKey: "code",
      header: t("form_code", "קוד טופס"),
      cell: ({ row }) => {
        const form = row.original;
        const registrationUrl = `${window.location.origin}/activity/${form.code}/registration`;
        return (
          <div
            className="w-full text-center cursor-pointer text-primary hover:text-primary/80 hover:underline transition-colors flex items-center justify-center gap-2"
            onClick={(e) => {
              e.stopPropagation();
              window.open(registrationUrl, "_blank");
            }}
          >
            <ExternalLink className="h-4 w-4" />
            {form.code}
          </div>
        );
      },
      size: 160,
      minSize: 140,
      meta: { editable: false },
    },
    {
      accessorKey: "seasonId",
      header: t("season", "עונה"),
      cell: ({ row }) => {
        const form = row.original;
        const season = seasons.find(s => s._id === form.seasonId);
        return (
          <div className="w-full text-center">
            {season?.name || "-"}
          </div>
        );
      },
      size: 140,
      minSize: 120,
      meta: { editable: false },
    },
  ], [t, registrationCounts, seasons]);

  const columns = useMemo(() => {
    return mergeColumnsWithDynamicFields(
      baseColumns,
      "forms",
      organization,
      t
    );
  }, [organization, t, baseColumns]);

  const columnOrder = [
    "select",
    "actions",
    "code",
    "title",
    "seasonId",
    "createdAt",
    "numberOfRegistrations",
  ];

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
    if (!organization?._id) {
      return Promise.resolve({
        status: 200,
        data: [],
        totalCount: 0,
        totalPages: 0,
      });
    }

    // Ensure pageSize is included in the request
    const pageSize = params.pageSize || 10;
    const page = params.page || 1;

    try {
      // Build query params - NO season filter, show ALL forms for the organization
      const queryParams: any = {
        ...params,
        pageSize,
        page,
        organizationId: organization._id,
        sortBy: 'createdAt',
        sortOrder: 'desc',
        // Removed seasonId filter to show all forms regardless of season
      };

      const response = await formsApi.fetchAll(
        queryParams,
        false,
        organization._id
      );

      // Handle both ApiResponse and MutationResponse types
      const forms = Array.isArray(response.data)
        ? response.data
        : //@ts-ignore
          response.data?.data || [];


      // Sort forms by createdAt in descending order (newest first)
      const sortedForms = [...forms].sort((a, b) => {
        const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return dateB - dateA; // Descending order (newest first)
      });

      // Return in the format expected by DataTable
      return {
        //@ts-ignore
        status: response.status || 200,
        //@ts-ignore
        data: sortedForms,
        //@ts-ignore
        totalCount: response.totalCount || sortedForms.length,
        //@ts-ignore
        totalPages: response.totalPages || Math.ceil(sortedForms.length / pageSize),
      };
    } catch (error) {
      return {
        status: 500,
        data: [],
        totalCount: 0,
        totalPages: 0,
      };
    }
  };
  const handleDuplicateForm = async (form: Form) => {
    try {
      // Remove fields that shouldn't be copied
      const { _id, code, createdAt, updatedAt, ...formDataToCopy } = form;
      
      const duplicatedForm = {
        ...formDataToCopy,
        // Optionally add "-Copy" to title, but keep original for now
        // title: `${form.title}-Copy`,
      };

      const created = await formsApi.create(duplicatedForm);
      if (created) {
        setRefreshKey((prev) => prev + 1);
        // Invalidate registration counts to refresh after duplication
        queryClient.invalidateQueries({ queryKey: ["registrationCounts"] });
        toast({
          title: t("form_duplicated_successfully") || t("success"),
          description: t("form_duplicated_description") || "Form duplicated successfully",
          variant: "default",
        });
      }
    } catch (error) {
      console.error("שגיאה בשכפול הטופס:", error);
      toast({
        title: t("error_duplicating_form") || t("error"),
        description: t("error_duplicating_form_description") || "Failed to duplicate form",
        variant: "destructive",
      });
    }
  };

  // Custom handler for addData that properly handles form duplication
  const handleAddForm = async (data: Partial<Form>) => {
    try {
      // Remove fields that shouldn't be copied when duplicating
      const { _id, code, createdAt, updatedAt, seasonId: _, ...formDataToCopy } = data as Form;
      
      // Get current seasonId, fallback to the form's original seasonId if no current season
      const currentSeasonId = organization?.currentSeasonId || (data as Form).seasonId;
      
      // Create the form with cleaned data (code will be auto-generated by backend)
      const formToCreate = {
        ...formDataToCopy,
        seasonId: currentSeasonId,
        organizationId: organization?._id,
      };

      console.log("🆕 Creating form with:", {
        seasonId: currentSeasonId,
        organizationId: organization?._id,
        title: formToCreate.title,
      });

      const response = await formsApi.create(formToCreate);
      
      console.log("✅ Created form response:", response);
      console.log("📝 Created form data:", response?.data);
      
      if (response && response.data) {
        // Invalidate registration counts to refresh after duplication
        queryClient.invalidateQueries({ queryKey: ["registrationCounts"] });
        toast({
          title: t("form_duplicated_successfully") || t("success"),
          description: t("form_duplicated_description") || "Form duplicated successfully",
          variant: "default",
        });
        
        // Return response - the backend should return the correct form with seasonId
        return response;
      }
      
      // Return response in format expected by DataTable's handleAdd
      return response;
    } catch (error) {
      console.error("Error creating form:", error);
      toast({
        title: t("error_duplicating_form") || t("error"),
        description: t("error_duplicating_form_description") || "Failed to duplicate form",
        variant: "destructive",
      });
      throw error;
    }
  };

  const handleDelete = async (id: string): Promise<any> => {
    try {
      const response = await formsApi.delete(id);
      if (response.status === 200) {
        setRefreshKey((prev) => prev + 1); // Refresh the table
        // Invalidate registration counts to refresh after deletion
        queryClient.invalidateQueries({ queryKey: ["registrationCounts"] });
        toast({
          title: t("form_deleted_successfully"),
          description: t("form_deleted_description"),
          variant: "success",
        });
        return response;
      } else {
        toast({
          title: t("error_deleting_form"),
          description: t("error_deleting_form_description"),
          variant: "destructive",
        });
        return response;
      }
    } catch (error) {
      console.error("Error deleting form:", error);
      toast({
        title: t("error_deleting_form"),
        description: t("error_deleting_form_description"),
        variant: "destructive",
      });
      throw error;
    }
  };

  const handleCreateActivity = () => {
    navigate("/create-form");
  };

  const handleBulkDelete = async (selectedRowsParam?: Form[]) => {
    const fallbackSelectedRows = Object.keys(rowSelection)
      .map(Number)
      .map((index) => tableRows[index])
      .filter((row): row is Form => !!row);

    const selectedRows = selectedRowsParam?.length
      ? selectedRowsParam
      : fallbackSelectedRows;

    const selectedIds = selectedRows
      .map((row) => row._id)
      .filter((id): id is string => !!id);
    
    if (selectedIds.length === 0) return;
    
    const confirmed = await showConfirm(
      t("confirm_delete") || t("common:confirm_delete") || "Are you sure?"
    );
    
    if (!confirmed) return;
    
    try {
      await Promise.all(selectedIds.map((id) => formsApi.delete(id)));
      setRefreshKey((prev) => prev + 1);
      setRowSelection({});
      // Invalidate registration counts to refresh after bulk deletion
      queryClient.invalidateQueries({ queryKey: ["registrationCounts"] });
      toast({
        title: t("forms_deleted_successfully", "הטפסים נמחקו בהצלחה"),
        description: t("forms_deleted_description", `${selectedIds.length} טפסים נמחקו`),
        variant: "success",
      });
    } catch (error) {
      console.error("Error deleting forms:", error);
      toast({
        title: t("error_deleting_forms", "שגיאה במחיקת טפסים"),
        description: t("error_deleting_forms_description", "אירעה שגיאה במחיקת הטפסים"),
        variant: "destructive",
      });
    }
  };

  return (
    <div className="w-full">
      <div className="mx-auto flex w-full max-w-[1920px] flex-col items-center px-4">
        <h1 className="mb-6 text-center text-2xl font-semibold text-primary">
          {t("forms")}
        </h1>
        
        <div className="mb-6 flex w-full justify-center">
          <Button
            onClick={handleCreateActivity}
            className="min-w-[240px] justify-center gap-3 rounded-full bg-blue-500 px-10 py-5 text-xl font-semibold text-white shadow-lg transition-all duration-200 hover:bg-blue-600 hover:shadow-xl"
          >
            <Plus className="h-6 w-6" />
            {t("create_new_form")}
          </Button>
        </div>
        <div className="w-full max-w-[1800px]">
          <DataTable<Form>
            data={[]}
            key={refreshKey}
            fetchData={wrappedFetchData}
            addData={handleAddForm}
            updateData={(data) => formsApi.update({ ...data, id: data._id })}
            deleteData={handleDelete}
            columns={columns}
            columnOrder={columnOrder}
            searchable
            showAdvancedSearch
            onAdvancedSearchChange={setAdvancedFilters}
            initialAdvancedFilters={advancedFilters}
            showAddButton={false}
            defaultPageSize={250}
            idField="_id"
            extraFilters={advancedFilters}
            rowSelection={rowSelection}
            onRowSelectionChange={setRowSelection}
            showActionColumn={true}
            showEditButton={false}
            showDeleteButton={false}
            showDuplicateButton={true}
            isPagination={false}
            isLazyLoading={true}
            onBulkDelete={handleBulkDelete}
            entityType="forms"
            visibleRows={useCallback((rows) => setTableRows(rows), [])}
          />
        </div>
      </div>
    </div>
  );
}
