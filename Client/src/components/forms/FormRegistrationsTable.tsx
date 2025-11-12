import { UserRegistration } from "@/types/forms/UserRegistration";
import { ColumnDef } from "@tanstack/react-table";
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

  return (
    <div className="col-span-2">
      {isEditingTitle ? (
        <div className="flex items-center gap-2 mb-4">
          <Input
            ref={inputRef}
            value={editedTitle}
            onChange={(e) => setEditedTitle(e.target.value)}
            onKeyDown={handleKeyDown}
            className="text-xl font-semibold"
          />
          <Button
            size="icon"
            variant="ghost"
            onClick={handleSaveTitle}
            className="h-8 w-8 text-green-600 hover:text-green-700 hover:bg-green-50"
          >
            <Check className="h-4 w-4" />
          </Button>
          <Button
            size="icon"
            variant="ghost"
            onClick={handleCancelEdit}
            className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      ) : (
        <div
          className="group flex items-center gap-2 mb-4 cursor-pointer hover:bg-gray-50 rounded-md px-2 py-1 -ml-2 transition-colors"
          onClick={() => setIsEditingTitle(true)}
        >
          <h2 className="text-xl font-semibold">{form.title}</h2>
          <Pencil className="h-4 w-4 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" />
        </div>
      )}
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
    .map((field) => ({
      accessorKey: `additionalData.${field.name}`,
      header: field.label,
      meta: field.type === "date" ? { isDate: true, editable: false } : { editable: false },
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

        if (field.type === "date") {
          return formatDateForDisplay(val) || "-";
        }

        if (val && typeof val === "object") {
          return "-";
        }

        return val !== undefined && val !== "" ? val : "-";
      },
    }));

  return [...baseColumns, ...paymentColumns, ...additionalColumns];
}
