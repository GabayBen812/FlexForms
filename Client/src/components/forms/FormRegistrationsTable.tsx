import { UserRegistration } from "@/types/forms/UserRegistration";
import { ColumnDef, RowSelectionState } from "@tanstack/react-table";
import { useTranslation } from "react-i18next";
import { createApiService } from "@/api/utils/apiFactory";
import DataTable from "@/components/ui/completed/data-table";
import { Form } from "@/types/forms/Form";
import { formatDateForDisplay, formatDateTimeForDisplay } from "@/lib/dateUtils";
import { TableAction } from "@/types/ui/data-table-types";
import { useState, useEffect, useRef } from "react";
import { AdvancedSearchModal } from "@/components/ui/completed/data-table/AdvancedSearchModal";
import { Button } from "@/components/ui/button";
import { useSidebar } from "@/components/ui/sidebar";
import { Pencil, Check, X } from "lucide-react";
import { Input } from "@/components/ui/Input";
import { useToast } from "@/hooks/use-toast";
import { getSelectionColumn } from "@/components/tables/selectionColumns";
import { showConfirm } from "@/utils/swal";
import { FieldConfig } from "@/components/forms/DynamicForm";

const registrationsApi = createApiService<UserRegistration>("/registrations");
const formsApi = createApiService<Form>("/forms");

interface Props {
  form: Form;
  onFormUpdate?: (updatedForm: Form) => void;
}

export default function FormRegistrationsTable({ form, onFormUpdate }: Props) {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [advancedFilters, setAdvancedFilters] = useState<Record<string, any>>(
    {}
  );
  const [isAdvancedOpen, setIsAdvancedOpen] = useState(false);
  const { state } = useSidebar();
  const sidebarIsCollapsed = state === "collapsed";
  const [registrations, setRegistrations] = useState<UserRegistration[]>([]);
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [editedTitle, setEditedTitle] = useState(form.title);
  const inputRef = useRef<HTMLInputElement>(null);
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const actions: TableAction<UserRegistration>[] = [
    { label: t("delete"), type: "delete" },
  ];

  useEffect(() => {
    setEditedTitle(form.title);
  }, [form.title]);

  useEffect(() => {
    if (isEditingTitle && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditingTitle]);

  const handleSaveTitle = async () => {
    if (!editedTitle.trim()) {
      toast({
        title: t("error"),
        description: t("form_title_required") || "Form title is required",
        variant: "destructive",
      });
      return;
    }

    if (editedTitle.trim() === form.title) {
      setIsEditingTitle(false);
      return;
    }

    try {
      const updatedForm = { ...form, title: editedTitle.trim() };
      const res = await formsApi.customRequest(
        "put",
        `/forms/${form._id}`,
        {
          data: updatedForm,
        }
      );

      if (res.status === 200) {
        onFormUpdate?.(res.data);
        setIsEditingTitle(false);
        toast({
          title: t("form_saved_success") || t("success"),
          description: t("form_title_updated") || "Form title updated successfully",
          variant: "default",
        });
      } else {
        throw new Error();
      }
    } catch {
      toast({
        title: t("form_save_error") || t("error"),
        description: t("form_save_error_description") || "Failed to update form title",
        variant: "destructive",
      });
      setEditedTitle(form.title);
    }
  };

  const handleCancelEdit = () => {
    setEditedTitle(form.title);
    setIsEditingTitle(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      handleSaveTitle();
    } else if (e.key === "Escape") {
      handleCancelEdit();
    }
  };

  const handleBulkDelete = async (selectedRows: UserRegistration[]) => {
    const selectedIds = selectedRows
      .map((row) => row._id)
      .filter((id): id is string => !!id);

    if (selectedIds.length === 0) return;

    const confirmed = await showConfirm(
      t("confirm_delete") || "Are you sure you want to delete the selected registrations?",
      t("delete") || "Delete"
    );

    if (!confirmed) return;

    try {
      const response = await registrationsApi.deleteMany(selectedIds);
      
      if (response.status >= 200 && response.status < 300) {
        toast({
          title: t("success") || "Success",
          description: t("deleted_successfully") || "Registrations deleted successfully",
          variant: "default",
        });
        
        // Clear selection and refresh data
        setRowSelection({});
        setRefreshTrigger((prev) => prev + 1);
      } else {
        throw new Error("Delete failed");
      }
    } catch (error) {
      console.error("Failed to delete registrations:", error);
      toast({
        title: t("error") || "Error",
        description: t("delete_failed") || "Failed to delete registrations",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="col-span-2">
      
      <div
        className="overflow-x-auto w-full"
        style={{
          maxWidth: `calc(100vw - ${sidebarIsCollapsed ? "100px" : "20rem"})`,
        }}
      >
        <DataTable<UserRegistration>
          data={registrations}
          fetchData={async ({ page = 1, pageSize = 10, sortBy, sortOrder, ...params }) => {
            const allParams = {
              ...params,
              ...advancedFilters,
              formId: form._id,
              page: String(page ?? 1),
              pageSize: String(pageSize ?? 10),
              // Always sort by createdAt in descending order (newest first) by default
              sortBy: sortBy && sortBy.trim() ? sortBy : "createdAt",
              sortOrder: sortOrder && (sortOrder === "asc" || sortOrder === "desc") ? sortOrder : "desc",
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
          rowSelection={rowSelection}
          onRowSelectionChange={setRowSelection}
          onBulkDelete={handleBulkDelete}
          refreshTrigger={refreshTrigger}
        />
      </div>
    </div>
  );
}

function getColumns(
  t: ReturnType<typeof useTranslation>["t"],
  fields: FieldConfig[],
  showPaymentColumns: boolean
): ColumnDef<UserRegistration>[] {
  const selectionColumn = getSelectionColumn<UserRegistration>();
  const baseColumns: ColumnDef<UserRegistration>[] = [
    // { accessorKey: "fullName", header: t("full_name") },
    // { accessorKey: "email", header: t("email") },
    // { accessorKey: "phone", header: t("phone") },
    {
      accessorKey: "createdAt",
      header: t("registered_at"),
      meta: { isDate: true, editable: false },
      cell: ({ row }) =>
        formatDateTimeForDisplay(row.original.createdAt) || "-",
    },
  ];

  const paymentColumns: ColumnDef<UserRegistration>[] = showPaymentColumns
    ? [
        {
          accessorKey: "additionalData.paymentDetails.cardOwnerName",
          header: t("card_owner_name"),
          meta: { editable: false },
          cell: ({ row }) =>
            row.original.additionalData?.paymentDetails?.cardOwnerName || "-",
        },
        {
          accessorKey: "additionalData.paymentDetails.last4Digits",
          header: t("last4digits"),
          meta: { editable: false },
          cell: ({ row }) =>
            row.original.additionalData?.paymentDetails?.last4Digits || "-",
        },
        {
          accessorKey: "additionalData.paymentDetails.amountPaid",
          header: t("amount_paid"),
          meta: { editable: false },
          cell: ({ row }) =>
            row.original.additionalData?.paymentDetails?.amountPaid ?? "-",
        },
        {
          accessorKey: "additionalData.paymentDetails.paymentDate",
          header: t("payment_date"),
          meta: { isDate: true, editable: false },
          cell: ({ row }) =>
            formatDateForDisplay(
              row.original.additionalData?.paymentDetails?.paymentDate
            ) || "-",
        },
        {
          accessorKey: "additionalData.paymentDetails.lowProfileCode",
          header: t("low_profile_code"),
          meta: { editable: false },
          cell: ({ row }) =>
            row.original.additionalData?.paymentDetails?.lowProfileCode || "-",
        },
      ]
    : [];

  const additionalColumns: ColumnDef<UserRegistration>[] = fields
    .filter((f) => !!f.name)
    .map((field) => {
      // Build meta object with field type and options for SELECT/MULTI_SELECT fields
      const meta: any = {
        editable: false,
      };

      // Add date metadata
      if (field.type === "date") {
        meta.isDate = true;
      }

      // Add fieldType and options for SELECT fields
      if (field.type === "select") {
        meta.fieldType = "SELECT";
        meta.options = field.config?.options || [];
      }

      // Add fieldType and options for MULTI_SELECT fields
      if (field.type === "multiselect") {
        meta.fieldType = "MULTI_SELECT";
        meta.options = field.config?.options || [];
      }

      return {
        accessorKey: `additionalData.${field.name}`,
        header: field.label,
        meta,
      cell: ({ row }) => {
        const additionalData = row.original.additionalData || {};
        let val: any;
        
        // Handle terms field - show checkmark if any terms field is checked
        if (field.type === "terms") {
          // For terms fields, check if ANY key starting with "terms" has a truthy value
          // This handles cases where field names might not match exactly
          const allKeys = Object.keys(additionalData);
          const termsKeys = allKeys.filter(key => key.toLowerCase().startsWith('terms'));
          
          // Debug: Log field info
          console.log(`[Terms Debug] Checking terms field: name="${field.name}", type="${field.type}", allKeys=`, allKeys, `termsKeys=`, termsKeys);
          
          // Try exact match first
          let termsValue = additionalData[field.name];
          console.log(`[Terms Debug] Exact match value:`, termsValue, typeof termsValue);
          
          // If not found, try to find matching terms key
          if ((termsValue === undefined || termsValue === null) && termsKeys.length > 0) {
            // Try to match by numeric suffix if field name has one
            const fieldSuffix = field.name.match(/\d+$/)?.[0];
            if (fieldSuffix) {
              const matchingKey = termsKeys.find(key => key.endsWith(fieldSuffix));
              if (matchingKey) {
                termsValue = additionalData[matchingKey];
              }
            }
            
            // If still no match, use first terms key (assume single terms field per form)
            if ((termsValue === undefined || termsValue === null) && termsKeys.length > 0) {
              termsValue = additionalData[termsKeys[0]];
            }
          }
          
          // Check if value indicates terms were accepted
          // Terms are accepted if value is truthy (true, "true", 1, "1", etc.)
          // But exclude false, 0, empty string, null, undefined, "false"
          if (termsValue === true || 
              termsValue === "true" || 
              termsValue === 1 || 
              termsValue === "1") {
            return (
              <div className="flex items-center justify-center">
                <Check className="h-5 w-5 text-green-600" />
              </div>
            );
          }
          
          // Fallback: any other truthy value (but explicitly exclude falsy values)
          if (termsValue !== undefined && 
              termsValue !== null && 
              termsValue !== false && 
              termsValue !== "" && 
              termsValue !== 0 && 
              termsValue !== "false" &&
              termsValue !== "0") {
            // Debug: log unexpected truthy values
            console.log(`[Terms Debug] Field "${field.name}" has unexpected truthy value:`, termsValue, typeof termsValue);
            return (
              <div className="flex items-center justify-center">
                <Check className="h-5 w-5 text-green-600" />
              </div>
            );
          }
          
          // Debug: log when value is not found or falsy
          if (termsValue === undefined || termsValue === null) {
            console.log(`[Terms Debug] Field "${field.name}" value not found. Terms keys:`, termsKeys, `All keys:`, allKeys);
          }
          
          return "-";
        }

        // For signature fields
        if (field.type === "signature" && typeof additionalData[field.name] === "string") {
          const sigVal = additionalData[field.name];
          return (
            <div className="flex items-center justify-center w-full h-full min-h-[60px] py-1">
              <div className="flex items-center justify-center bg-gray-50 border border-gray-200 rounded-md p-1.5 shadow-sm">
                <img
                  src={sigVal}
                  alt="signature"
                  className="max-w-[100px] max-h-[40px] object-contain"
                />
              </div>
            </div>
          );
        }

        // For image fields
        if (field.type === "image" && typeof additionalData[field.name] === "string") {
          const imageVal = additionalData[field.name];
          return (
            <div className="flex items-center justify-center w-full h-full min-h-[60px] py-1">
              <div className="flex items-center justify-center bg-gray-50 border border-gray-200 rounded-md p-1.5 shadow-sm">
                <img
                  src={imageVal}
                  alt={field.label}
                  className="max-w-[100px] max-h-[40px] object-contain"
                />
              </div>
            </div>
          );
        }

        // For file fields
        if (field.type === "file" && typeof additionalData[field.name] === "string") {
          const fileVal = additionalData[field.name];
          return (
            <div className="flex items-center gap-2">
              <a
                href={fileVal}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-primary hover:underline text-sm"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="w-4 h-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"
                  />
                </svg>
                {t("download_file", "הורד קובץ")}
              </a>
            </div>
          );
        }

        // For date fields
        if (field.type === "date") {
          const dateVal = additionalData[field.name];
          return formatDateForDisplay(dateVal) || "-";
        }

        // For all other fields, get the value
        val = additionalData[field.name];

        // If value is an object, return "-"
        if (val && typeof val === "object") {
          return "-";
        }

        // Return the value or "-" if empty
        return val !== undefined && val !== "" ? val : "-";
      },
      };
    });

  return [selectionColumn, ...baseColumns, ...paymentColumns, ...additionalColumns];
}
