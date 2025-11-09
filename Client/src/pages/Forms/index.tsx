import { useTranslation } from "react-i18next";
import { ColumnDef, RowSelectionState } from "@tanstack/react-table";
import { useNavigate } from "react-router-dom";
import DataTable from "@/components/ui/completed/data-table";
import { useOrganization } from "@/hooks/useOrganization";
import { createApiService } from "@/api/utils/apiFactory";
import { Form } from "@/types/forms/Form";
import { TableAction } from "@/types/ui/data-table-types";
import { useCallback, useEffect, useState } from "react";
import { Copy, Plus, CheckCircle2, XCircle } from "lucide-react";
import { AdvancedSearchModal } from "@/components/ui/completed/data-table/AdvancedSearchModal";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import apiClient from "@/api/apiClient";

const formsApi = createApiService<Form>("/forms");

export default function Forms() {
  const { t } = useTranslation();
  const { organization } = useOrganization();
  const navigate = useNavigate();
  const { toast } = useToast();
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
    size: 40,
  };

  const columns: ColumnDef<Form>[] = [
    selectionColumn,
    {
      accessorKey: "title",
      header: t("form_title"),
      cell: ({ row }) => {
        console.log("Title cell data:", row.original.title); // Debug log
        return <div className="w-full text-center">{row.original.title}</div>;
      },
      size: 250,
    },
    {
      accessorKey: "description",
      header: t("form_description"),
      cell: ({ row }) => (
        <div className="w-full text-center">{row.original.description}</div>
      ),
      size: 300,
    },
    {
      accessorKey: "actions",
      header: t("actions"),
      size: 300,
    },
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
  ];

  const columnOrder = [
    "select",
    "actions",
    "title",
    "description",
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
      console.log("No organization ID, returning empty data");
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

    console.log("Fetching forms with params:", {
      ...params,
      pageSize,
      page,
      organizationId: organization._id,
    });

    try {
      const response = await formsApi.fetchAll(
        {
          ...params,
          pageSize,
          page,
          organizationId: organization._id,
        },
        false,
        organization._id
      );

      console.log("API Response:", response);

      // Handle both ApiResponse and MutationResponse types
      const forms = Array.isArray(response.data)
        ? response.data
        : //@ts-ignore
          response.data?.data || [];

      console.log("Processed forms:", forms);

      // Get registration counts for the current page of forms only
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
          setRegistrationCounts((prev) => ({
            ...prev,
            ...res.data.data,
          }));
        } catch (err) {
          console.error("Error fetching registration counts:", err);
        }
      }

      // Return in the format expected by DataTable
      return {
        //@ts-ignore
        status: response.status || 200,
        //@ts-ignore
        data: forms,
        //@ts-ignore
        totalCount: response.totalCount || forms.length,
        //@ts-ignore
        totalPages: response.totalPages || Math.ceil(forms.length / pageSize),
      };
    } catch (error) {
      console.error("Error fetching forms:", error);
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

  const handleDelete = async (id: string): Promise<any> => {
    try {
      const response = await formsApi.delete(id);
      if (response.status === 200) {
        setRefreshKey((prev) => prev + 1); // Refresh the table
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

  return (
    <div className="mx-auto">
      <h1 className="text-2xl font-semibold text-primary mb-6">{t("forms")}</h1>
      <div className="mb-6 flex justify-center">
        <Button
          onClick={handleCreateActivity}
          className="min-w-[240px] justify-center gap-3 rounded-full bg-blue-500 px-10 py-5 text-xl font-semibold text-white shadow-lg transition-all duration-200 hover:bg-blue-600 hover:shadow-xl"
        >
          <Plus className="h-6 w-6" />
          {t("create_new_activity")}
        </Button>
      </div>
      <DataTable<Form>
        data={[]}
        key={refreshKey}
        fetchData={wrappedFetchData}
        addData={(data) => formsApi.create(data)}
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
        onRowClick={(form) => {
          if (form && form.code && form._id) {
            navigate(`/activity/${form.code}/dashboard`);
          } else {
            console.warn("Form row is missing code or _id", form);
          }
        }}
        showActionColumn={true}
        showEditButton={false}
        showDeleteButton={true}
        showDuplicateButton={true}
        isPagination={false}
        isLazyLoading={true}
      />
    </div>
  );
}
