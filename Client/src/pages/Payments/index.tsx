import { useTranslation } from "react-i18next";
import { useContext, useState, useMemo, useCallback, memo } from "react";
import { ColumnDef } from "@tanstack/react-table";
import { z } from "zod";
import { Plus, TrendingUp, TrendingDown, Settings, FileText, Loader2, ExternalLink } from "lucide-react";

import DataTable from "@/components/ui/completed/data-table";
import DynamicForm, { FieldConfig } from "@/components/forms/DynamicForm";
import { OrganizationsContext } from "@/contexts/OrganizationsContext";
import { TableAction, ApiQueryParams } from "@/types/ui/data-table-types";
import { createApiService } from "@/api/utils/apiFactory";
import { AdvancedSearchModal } from "@/components/ui/completed/data-table/AdvancedSearchModal";
import { Button } from "@/components/ui/button";
import { FeatureFlag } from "@/types/feature-flags";
import apiClient from "@/api/apiClient";
import { AddRecordDialog } from "@/components/ui/completed/dialogs/AddRecordDialog";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { GetDirection } from "@/lib/i18n";
import Expenses from "./Expenses";
import PaymentsSettings from "./PaymentsSettings";
import { createInvoice, getInvoice } from "@/api/invoices";
import { CreateInvoiceDto, InvoiceDocumentType, InvoicePaymentType, Currency, Language } from "@/types/invoices/invoice";
import { InvoiceModal } from "@/components/invoices/InvoiceModal";
import { formatDateTimeWithSecondsForDisplay } from "@/lib/dateUtils";
import { Badge } from "@/components/ui/badge";
import { useQuery } from "@tanstack/react-query";
import { Contact } from "@/types/contacts/contact";
import { Account } from "@/types/accounts/account";
import { fetchContacts } from "@/api/contacts";
import { fetchAllAccounts } from "@/api/accounts";
import { Form } from "@/types/forms/Form";

export type Payment = {
  id: string;
  amount: number;
  service: string;
  status: string;
  lowProfileCode?: string;
  cardDetails?: {
    cardOwnerName: string;
    cardOwnerEmail: string;
    last4Digits: string;
    expiryMonth: string;
    expiryYear: string;
    token: string;
  };
  invoiceId?: string;
  paymentDate: string; // Required, with time
  paymentMethod?: 'credit_card' | 'check' | 'bank_transfer' | 'cash';
  payerContactId?: string;
  payerAccountId?: string;
  notes?: string;
  metadata?: Record<string, any>;
  formId: string;
  organizationId: string;
  createdAt?: string;
  updatedAt?: string;
};

type InvoiceReference =
  | string
  | {
      _id?: string;
      id?: string;
      invoiceNumber?: string;
      externalInvoiceNumber?: string;
    };

const INVOICE_DOCUMENT_TYPES_REQUIRING_COMPANY_ID = new Set<InvoiceDocumentType>([
  InvoiceDocumentType.INVOICE_RECEIPT,
  InvoiceDocumentType.RECEIPT,
  InvoiceDocumentType.INVOICE,
  InvoiceDocumentType.CREDIT_NOTE,
]);

const paymentsApi = createApiService<Payment>("/payments", {
  includeOrgId: true,
});

// Component to display payer as chip
const PayerChipCell = memo(({ 
  payerContactId, 
  payerAccountId,
  payerOptions 
}: { 
  payerContactId?: string; 
  payerAccountId?: string;
  payerOptions: { value: string; label: string }[];
}) => {
  const payerId = payerContactId || payerAccountId;
  const payerOption = payerId ? payerOptions.find(opt => opt.value === payerId) : null;

  if (!payerOption) {
    return <span className="text-muted-foreground">-</span>;
  }

  return (
    <div className="flex items-center justify-center">
      <Badge 
        variant="secondary" 
        className="bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800 px-2 py-1 rounded-full text-sm font-medium border"
      >
        {payerOption.label}
      </Badge>
    </div>
  );
});

PayerChipCell.displayName = "PayerChipCell";

const InvoiceLinkCell = memo(
  ({
    invoiceId,
    fallbackLabel,
    onOpen,
  }: {
    invoiceId: string;
    fallbackLabel: string;
    onOpen: () => void;
  }) => {
    const { data: invoiceData, isFetching } = useQuery({
      queryKey: ["invoice-details", invoiceId],
      queryFn: () => getInvoice(invoiceId),
      enabled: Boolean(invoiceId),
      staleTime: 5 * 60 * 1000,
    });

    const externalInvoiceNumber =
      invoiceData?.externalInvoiceNumber ||
      invoiceData?.greenInvoice?.id ||
      invoiceData?.icount?.id ||
      invoiceData?.invoiceNumber;

    const label = externalInvoiceNumber || fallbackLabel || invoiceId;

    return (
      <button
        onClick={onOpen}
        className="text-blue-600 hover:text-blue-800 underline flex items-center gap-1 disabled:text-muted-foreground"
        disabled={!invoiceId}
      >
        {label}
        {isFetching && <Loader2 className="w-3 h-3 animate-spin" />}
        <ExternalLink className="w-3 h-3" />
      </button>
    );
  }
);

InvoiceLinkCell.displayName = "InvoiceLinkCell";

export default function Payments() {
  const { t } = useTranslation();
  const { organization } = useContext(OrganizationsContext);
  const { toast } = useToast();
  
  const [currentTab, setCurrentTab] = useState('income');
  const [advancedFilters, setAdvancedFilters] = useState<Record<string, any>>(
    {}
  );
  const [isAdvancedOpen, setIsAdvancedOpen] = useState(false);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isCreatingInvoice, setIsCreatingInvoice] = useState(false);
  const [selectedInvoiceId, setSelectedInvoiceId] = useState<string | null>(null);
  const [isInvoiceModalOpen, setIsInvoiceModalOpen] = useState(false);
  const [tableMethods, setTableMethods] = useState<{
    refresh: () => void;
    addItem: (item: Payment) => void;
    updateItem: (item: Payment) => void;
  } | null>(null);

  const handleRefreshReady = useCallback(
    (methods: { refresh: () => void; addItem: (item: Payment) => void; updateItem: (item: Payment) => void }) => {
      setTableMethods((prev) => {
        // Only update if methods actually changed
        if (prev && 
            prev.refresh === methods.refresh && 
            prev.addItem === methods.addItem && 
            prev.updateItem === methods.updateItem) {
          return prev;
        }
        return methods;
      });
    },
    []
  );

  const handleTabChange = (value: string) => {
    setCurrentTab(value);
  };

  const getPaymentMethodLabel = (method?: string) => {
    switch (method) {
      case "credit_card":
        return t("payment_method_credit_card") || "אשראי";
      case "check":
        return t("payment_method_check") || "צק";
      case "bank_transfer":
        return t("payment_method_bank_transfer") || "העברה בנקאית";
      case "cash":
        return t("payment_method_cash") || "מזומן";
      default:
        return method || "-";
    }
  };

  const { data: contactsData = [] } = useQuery<Contact[]>({
    queryKey: ["payments", "payerContacts", organization?._id],
    queryFn: async () => {
      if (!organization?._id) return [];
      const response = await fetchContacts({
        type: "contact",
        page: 1,
        pageSize: 100,
        organizationId: organization._id,
      });

      if (response.error) {
        throw new Error(response.error);
      }

      return response.data?.data ?? [];
    },
    enabled: !!organization?._id,
  });

  const { data: accountsData = [] } = useQuery<Account[]>({
    queryKey: ["payments", "payerAccounts", organization?._id],
    queryFn: async () => {
      if (!organization?._id) return [];
      const response = await fetchAllAccounts(
        { page: 1, pageSize: 100 },
        organization._id
      );

      const payload = response.data;

      if (Array.isArray(payload)) {
        return payload;
      }

      return payload?.data ?? [];
    },
    enabled: !!organization?._id,
  });

  const { data: formsData = [] } = useQuery<Form[]>({
    queryKey: ["payments", "forms", organization?._id],
    queryFn: async () => {
      if (!organization?._id) return [];
      const res = await apiClient.get("/forms", {
        params: {
          organizationId: organization._id,
        },
      });
      return Array.isArray(res.data) ? res.data : res.data?.data ?? [];
    },
    enabled: !!organization?._id,
  });

  const contactOptions = useMemo(
    () =>
      contactsData.map((contact) => ({
        value: contact._id,
        label: `${contact.firstname || ""} ${contact.lastname || ""}`.trim() ||
          contact.email ||
          contact.phone ||
          contact._id,
      })),
    [contactsData]
  );

  const accountOptions = useMemo(
    () =>
      accountsData.map((account) => ({
        value: (account as any)._id ?? (account as any).id,
        label: account.name || (account as any).displayName || (account as any)._id || (account as any).id,
      })),
    [accountsData]
  );

  const formOptions = useMemo(
    () =>
      formsData.map((form) => ({
        value: form._id,
        label: form.title || form._id,
      })),
    [formsData]
  );

  const paymentMethodOptions = useMemo(
    () => [
      { value: "credit_card", label: getPaymentMethodLabel("credit_card") },
      { value: "check", label: getPaymentMethodLabel("check") },
      { value: "bank_transfer", label: getPaymentMethodLabel("bank_transfer") },
      { value: "cash", label: getPaymentMethodLabel("cash") },
    ],
    [t]
  );

  const payerOptions = useMemo(
    () => [...contactOptions, ...accountOptions],
    [contactOptions, accountOptions]
  );

  const relationshipFieldsConfig = useMemo(
    () => ({
      payerContactId: {
        options: contactOptions,
      },
      payerAccountId: {
        options: accountOptions,
      },
      formId: {
        options: formOptions,
      },
    }),
    [contactOptions, accountOptions, formOptions]
  );

  const defaultPaymentDate = useMemo(
    () => new Date().toISOString().split("T")[0],
    []
  );

  const documentTypeOptions = useMemo(
    () => [
      { value: InvoiceDocumentType.INVOICE_RECEIPT, label: t("invoice_receipt") || "חשבונית מס/קבלה" },
      { value: InvoiceDocumentType.RECEIPT, label: t("receipt") || "קבלה" },
      { value: InvoiceDocumentType.INVOICE, label: t("invoice") || "חשבונית מס" },
      { value: InvoiceDocumentType.CREDIT_NOTE, label: t("credit_note") || "חשבונית זיכוי" },
    ],
    [t]
  );

  const dialogDefaultValues = useMemo(
    () => ({
      organizationId: organization?._id || "",
      paymentDate: defaultPaymentDate,
      documentType: "",
      metadataCompanyId: "",
    }),
    [organization?._id, defaultPaymentDate]
  );


  const columns: ColumnDef<Payment>[] = useMemo(() => [
    {
      accessorKey: "paymentDate",
      header: t("payment_date_time") || "מועד תשלום",
      cell: ({ row }) => {
        const value = row.original.paymentDate;
        return formatDateTimeWithSecondsForDisplay(value);
      },
      meta: { isDate: true, editable: false },
    },
    {
      accessorKey: "amount",
      header: t("amount_paid") || "סכום ששולם",
      cell: ({ row }) => {
        const value = row.original.amount;
        const formattedValue = typeof value === "number" ? value.toFixed(2) : value;
        return (
          <span className="text-xl font-semibold text-amber-600">
            ₪{formattedValue}
          </span>
        );
      },
      meta: { editable: false },
    },
    {
      accessorKey: "paymentMethod",
      header: t("payment_method") || "אמצעי תשלום",
      cell: ({ row }) => {
        const method = row.original.paymentMethod;
        switch (method) {
          case "credit_card":
            return t("payment_method_credit_card") || "אשראי";
          case "check":
            return t("payment_method_check") || "צק";
          case "bank_transfer":
            return t("payment_method_bank_transfer") || "העברה בנקאית";
          case "cash":
            return t("payment_method_cash") || "מזומן";
          default:
            return method || "-";
        }
      },
      meta: { editable: false },
    },
    {
      accessorKey: "invoiceId",
      header: t("invoice") || "חשבונית",
      cell: ({ row }) => {
        const invoiceRef = row.original
          .invoiceId as InvoiceReference | null | undefined;
        if (!invoiceRef) return "-";

        const invoiceId =
          typeof invoiceRef === "string"
            ? invoiceRef
            : invoiceRef._id || invoiceRef.id || "";

        const invoiceLabel =
          typeof invoiceRef === "string"
            ? invoiceRef
            : invoiceRef.externalInvoiceNumber ||
              invoiceRef.invoiceNumber ||
              invoiceRef._id ||
              invoiceRef.id ||
              t("invoice") ||
              "חשבונית";

        if (!invoiceId) {
          return invoiceLabel;
        }

        return (
          <InvoiceLinkCell
            invoiceId={invoiceId}
            fallbackLabel={invoiceLabel}
            onOpen={() => {
              setSelectedInvoiceId(invoiceId);
              setIsInvoiceModalOpen(true);
            }}
          />
        );
      },
      meta: { editable: false },
    },
    {
      accessorKey: "payer",
      header: t("payer") || "מי שילם",
      cell: ({ row }) => {
        const payerContactId = row.original.payerContactId;
        const payerAccountId = row.original.payerAccountId;
        return <PayerChipCell payerContactId={payerContactId} payerAccountId={payerAccountId} payerOptions={payerOptions} />;
      },
      meta: { editable: false },
    },
    {
      accessorKey: "notes",
      header: t("notes") || "הערות",
      cell: ({ row }) => {
        const notes = row.original.notes;
        return notes || "-";
      },
      meta: { editable: false },
    },
    {
      accessorKey: "metadata",
      header: "metadata",
      cell: ({ row }) => {
        const metadata = row.original.metadata;
        if (metadata && Object.keys(metadata).length > 0) {
          return (
            <Badge variant="secondary" className="bg-blue-100 text-blue-800">
              {t("has_metadata") || "יש metadata"}
            </Badge>
          );
        }
        return "-";
      },
      meta: { editable: false },
    },
    {
      accessorKey: "createdAt",
      header: t("created_at"),
      cell: ({ row }) => {
        const value = row.original.createdAt;
        if (!value) {
          return "-";
        }
        return formatDateTimeWithSecondsForDisplay(value);
      },
      meta: { hidden: true, isDate: true, editable: false },
    },
  ], [t, payerOptions]);

  // Create columns for the add dialog - memoized to prevent infinite render loops
  const dialogColumns: ColumnDef<Payment>[] = useMemo(() => [
    {
      accessorKey: "paymentDate",
      header: t("payment_date_time") || "מועד תשלום",
      meta: { isDate: true },
    },
    {
      accessorKey: "amount",
      header: t("amount") || "סכום",
      meta: { fieldType: "MONEY" },
    },
    {
      accessorKey: "service",
      header: t("service") || "שירות",
    },
    {
      accessorKey: "formId",
      header: t("form") || "טופס",
      meta: { singleSelect: true },
    },
    {
      accessorKey: "paymentMethod",
      header: t("payment_method") || "אמצעי תשלום",
      meta: {
        fieldType: "SELECT",
        options: paymentMethodOptions,
      },
    },
    {
      accessorKey: "payerContactId",
      header: t("payer_contact", { defaultValue: "מי שילם - איש קשר" }),
      meta: { singleSelect: true },
    },
    {
      accessorKey: "payerAccountId",
      header: t("payer_account", { defaultValue: "מי שילם - חשבון" }),
      meta: { singleSelect: true },
    },
    {
      accessorKey: "notes",
      header: t("notes") || "הערות",
    },
    {
      accessorKey: "documentType",
      header: t("document_type") || "סוג מסמך חשבונאי",
      meta: {
        fieldType: "SELECT",
        options: documentTypeOptions,
      },
    },
    {
      accessorKey: "metadataCompanyId",
      header: t("company_registration_number") || "ח.פ / מספר עוסק",
    },
  ], [t, paymentMethodOptions, documentTypeOptions]);

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

  // Helper function to map payment method to invoice payment type
  const mapPaymentMethodToInvoiceType = (paymentMethod?: string): InvoicePaymentType => {
    switch (paymentMethod) {
      case "credit_card":
        return InvoicePaymentType.CREDIT_CARD;
      case "check":
        return InvoicePaymentType.CHECK;
      case "bank_transfer":
        return InvoicePaymentType.BANK_TRANSFER;
      case "cash":
        return InvoicePaymentType.CASH;
      default:
        return InvoicePaymentType.CASH;
    }
  };

  // Helper function to get payer client info from contact or account
  const getPayerClientInfo = async (
    payerContactId?: string,
    payerAccountId?: string
  ): Promise<{ name: string; personalId: string; email: string; phone?: string }> => {
    if (payerContactId) {
      const contact = contactsData.find((c) => c._id === payerContactId);
      if (contact) {
        return {
          name: `${contact.firstname || ""} ${contact.lastname || ""}`.trim() || contact.email || contact.phone || contact._id,
          personalId: contact.idNumber || "000000000",
          email: contact.email || "no-email@example.com",
          phone: contact.phone,
        };
      }
    }

    if (payerAccountId) {
      const account = accountsData.find(
        (a) => (a as any)._id === payerAccountId || (a as any).id === payerAccountId
      );
      if (account) {
        // Try to get info from linked contacts
        if (account.linked_contacts && account.linked_contacts.length > 0) {
          const firstLinkedContactId = account.linked_contacts[0];
          const linkedContact = contactsData.find((c) => c._id === firstLinkedContactId);
          if (linkedContact) {
            return {
              name: account.name || (account as any).displayName || "Unknown Account",
              personalId: linkedContact.idNumber || "000000000",
              email: linkedContact.email || "no-email@example.com",
              phone: linkedContact.phone,
            };
          }
        }
        // Fallback to placeholder values
        return {
          name: account.name || (account as any).displayName || "Unknown Account",
          personalId: "000000000",
          email: "no-email@example.com",
        };
      }
    }

    // Fallback if nothing found
    throw new Error("Payer information not found");
  };

  const handleAddPayment = async (data: Record<string, any>) => {
    if (!organization?._id) {
      const errorMessage = t("organization_required") || "נדרש מזהה ארגון";
      toast({
        title: t("error") || "שגיאה",
        description: errorMessage,
        variant: "destructive",
      });
      throw new Error(errorMessage);
    }

    try {
      const paymentDateValue = data.paymentDate
        ? new Date(data.paymentDate).toISOString()
        : new Date().toISOString();

      const hasPayerContact = Boolean(data.payerContactId && data.payerContactId.toString().trim() !== "");
      const hasPayerAccount = Boolean(data.payerAccountId && data.payerAccountId.toString().trim() !== "");

      if (hasPayerContact === hasPayerAccount) {
        // Either both selected or none selected
        let errorMessage: string;
        if (!hasPayerContact && !hasPayerAccount) {
          errorMessage = "יש לבחור מי שילם - איש קשר או חשבון";
        } else {
          errorMessage = "ניתן לבחור רק אחד - איש קשר או חשבון, לא שניהם";
        }
        toast({
          title: "שגיאה",
          description: errorMessage,
          variant: "destructive",
        });
        throw new Error(errorMessage);
      }

      if (!data.formId) {
        throw new Error(t("form_required") || "נדרש לבחור טופס");
      }

      if (!data.service || data.service.trim() === "") {
        throw new Error(t("service_required") || "נדרש להזין שירות");
      }

      const documentType = data.documentType;
      const hasDocumentType =
        documentType !== undefined &&
        documentType !== null &&
        documentType !== "" &&
        (typeof documentType === "string" ? documentType.trim() !== "" : true);
      const companyIdRaw = data.metadataCompanyId ? String(data.metadataCompanyId).trim() : "";
      const requiresCompanyId = hasDocumentType
        ? INVOICE_DOCUMENT_TYPES_REQUIRING_COMPANY_ID.has(documentType as InvoiceDocumentType)
        : false;

      if (requiresCompanyId && !companyIdRaw) {
        const errorMessage =
          t("company_id_required_for_invoice") || "נדרש להזין ח.פ / מספר עוסק כדי ליצור חשבונית";
        toast({
          title: t("error") || "שגיאה",
          description: errorMessage,
          variant: "destructive",
        });
        throw new Error(errorMessage);
      }

      const newPayment: Partial<Payment> = {
        amount: data.amount ? Number(data.amount) : 0,
        paymentMethod: data.paymentMethod || "cash",
        paymentDate: paymentDateValue,
        notes: data.notes,
        payerContactId: hasPayerContact ? data.payerContactId : undefined,
        payerAccountId: hasPayerAccount ? data.payerAccountId : undefined,
        organizationId: organization._id,
        formId: data.formId,
        service: data.service.trim(),
        status: "paid", // Manual payments are already paid
        metadata: companyIdRaw ? { companyId: companyIdRaw } : undefined,
      };

      const res = await paymentsApi.create(newPayment);

      if (res.error) {
        throw new Error(res.error);
      }

      if ((res.status === 200 || res.status === 201) && res.data) {
        const createdPayment = {
          ...res.data,
          id: (res.data as any)._id ?? (res.data as any).id,
        } as Payment;
          createdPayment.createdAt =
            createdPayment.createdAt ??
            createdPayment.paymentDate ??
            new Date().toISOString();

        // Create invoice if documentType is selected
        if (hasDocumentType) {
          try {
            const payerClientInfo = await getPayerClientInfo(
              hasPayerContact ? data.payerContactId : undefined,
              hasPayerAccount ? data.payerAccountId : undefined
            );

            const clientPersonalId = companyIdRaw || payerClientInfo.personalId || "000000000";

            const invoiceData: CreateInvoiceDto = {
              organizationId: organization._id,
              documentType: documentType as InvoiceDocumentType,
              client: {
                ...payerClientInfo,
                personalId: clientPersonalId,
              },
              items: [
                {
                  name: data.service.trim(),
                  quantity: 1,
                  price: data.amount ? Number(data.amount) : 0,
                  description: data.notes || undefined,
                },
              ],
              payment: {
                type: mapPaymentMethodToInvoiceType(data.paymentMethod),
                date: paymentDateValue.split("T")[0], // Extract date part only
                amount: data.amount ? Number(data.amount) : 0,
              },
              subject: data.service.trim(),
              description: data.notes || undefined,
              language: Language.HEBREW,
              currency: Currency.ILS,
            };

            const invoiceResult = await createInvoice(invoiceData);

            if (invoiceResult.success && invoiceResult.data) {
              // Update payment with invoiceId
              const paymentId = createdPayment.id;
              try {
                const updateRes = await paymentsApi.update({
                  id: paymentId,
                  invoiceId: invoiceResult.data.id,
                } as Partial<Payment> & { id: string });

                if (updateRes.data) {
                  const updatedPayment = {
                    ...updateRes.data,
                    id: (updateRes.data as any)._id ?? (updateRes.data as any).id,
                    invoiceId: invoiceResult.data.id,
                  } as Payment;
                  updatedPayment.createdAt =
                    updatedPayment.createdAt ??
                    updatedPayment.paymentDate ??
                    createdPayment.createdAt;

                  toast({
                    title: "הצלחה",
                    description: "התשלום והחשבונית נוצרו בהצלחה",
                  });

                  setIsAddDialogOpen(false);
                  tableMethods?.addItem(updatedPayment);
                  return;
                }
              } catch (updateError) {
                console.error("Error updating payment with invoiceId:", updateError);
                // Continue with original payment even if update fails
              }

              // If update failed, still show success but with warning
              toast({
                title: "הצלחה",
                description: "התשלום נוצר בהצלחה. החשבונית נוצרה אך לא נקשרה לתשלום",
              });

              setIsAddDialogOpen(false);
              tableMethods?.addItem(createdPayment);
              return;
            }
          } catch (invoiceError: any) {
            console.error("Error creating invoice:", invoiceError);
            
            // Extract error message
            let errorMessage = "יצירת החשבונית נכשלה";
            if (invoiceError?.response?.data?.message) {
              if (Array.isArray(invoiceError.response.data.message)) {
                errorMessage = invoiceError.response.data.message.join(", ");
              } else {
                errorMessage = invoiceError.response.data.message;
              }
            } else if (invoiceError?.message) {
              errorMessage = invoiceError.message;
            }

            // Translate common error messages to Hebrew
            if (errorMessage.includes("Invoice service credentials are not configured")) {
              errorMessage = "אישורי שירות החשבוניות לא מוגדרים לארגון זה. אנא הגדר את ספק החשבוניות בהגדרות הארגון.";
            } else if (errorMessage.includes("credentials are not configured")) {
              errorMessage = "אישורי שירות החשבוניות לא מוגדרים לארגון זה. אנא הגדר את ספק החשבוניות בהגדרות הארגון.";
            }

            // Show error toast but payment was already created
            toast({
              title: "התשלום נוצר בהצלחה",
              description: `אך יצירת החשבונית נכשלה: ${errorMessage}`,
              variant: "default",
            });

            setIsAddDialogOpen(false);
            tableMethods?.addItem(createdPayment);
            return;
          }
        }

        // No invoice creation requested
        toast({
          title: "הצלחה",
          description: "התשלום נוצר בהצלחה",
        });

        setIsAddDialogOpen(false);
        tableMethods?.addItem(createdPayment);
      } else {
        tableMethods?.refresh();
      }
    } catch (error: any) {
      console.error("Error creating payment:", error);
      
      // Extract detailed error message
      let errorMessage = "אירעה שגיאה בעת יצירת תשלום";
      
      if (error instanceof Error) {
        errorMessage = error.message;
      } else if (error?.response?.data?.message) {
        // Handle validation errors from server
        if (Array.isArray(error.response.data.message)) {
          errorMessage = error.response.data.message.join(", ");
        } else {
          errorMessage = error.response.data.message;
        }
      } else if (error?.response?.data?.error) {
        errorMessage = error.response.data.error;
      } else if (error?.message) {
        errorMessage = error.message;
      }
      
      toast({
        title: "שגיאה",
        description: errorMessage,
        variant: "destructive",
      });
      throw error;
    }
  };

  const handleTestInvoice = async () => {
    if (!organization?._id) {
      toast({
        title: "שגיאה",
        description: "נדרש מזהה ארגון",
        variant: "destructive",
      });
      return;
    }

    setIsCreatingInvoice(true);
    try {
      const testInvoiceData: CreateInvoiceDto = {
        organizationId: organization._id,
        documentType: InvoiceDocumentType.RECEIPT,
        client: {
          name: "לקוח בדיקה",
          personalId: "123456782", // Valid Israeli ID (passes Luhn algorithm)
          email: "test@example.com",
          phone: "050-1234567",
        },
        items: [
          {
            name: "שירות בדיקה",
            quantity: 1,
            price: 5,
            description: "זהו חשבונית בדיקה",
          },
        ],
        payment: {
          type: InvoicePaymentType.CREDIT_CARD,
          date: new Date().toISOString().split('T')[0],
          amount: 5,
        },
        subject: "חשבונית בדיקה",
        description: "זהו חשבונית בדיקה שנוצרה על מנת לבדוק את האינטגרציה עם GreenInvoice",
        language: Language.HEBREW,
        currency: Currency.ILS,
      };

      console.log("Sending invoice data:", JSON.stringify(testInvoiceData, null, 2));
      const result = await createInvoice(testInvoiceData);
      
      if (result.success && result.data) {
        toast({
          title: "הצלחה!",
          description: `החשבונית נוצרה בהצלחה. מזהה: ${result.data.id}`,
        });
        
        // Open invoice URL in new tab
        if (result.data.documentUrl) {
          window.open(result.data.documentUrl, "_blank");
        }
      } else {
        toast({
          title: "שגיאה",
          description: "יצירת החשבונית נכשלה",
          variant: "destructive",
        });
      }
    } catch (error: any) {
      console.error("Error creating test invoice:", error);
      console.error("Error response:", error?.response?.data);
      console.error("Error status:", error?.response?.status);
      
      // Extract error message
      let errorMessage = "יצירת החשבונית נכשלה";
      if (error?.response?.data?.message) {
        if (Array.isArray(error.response.data.message)) {
          errorMessage = error.response.data.message.join(", ");
        } else {
          errorMessage = error.response.data.message;
        }
      } else if (error?.message) {
        errorMessage = error.message;
      }
      
      toast({
        title: "שגיאה",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsCreatingInvoice(false);
    }
  };

  return (
    <div className="mx-auto">
      <h1 className="text-2xl font-semibold text-primary mb-6">
        {t("payments")}
      </h1>

      <Tabs
        value={currentTab}
        onValueChange={handleTabChange}
        className="w-full"
        dir={GetDirection() ? "rtl" : "ltr"}
      >
        <div className="flex justify-center mb-8">
          <TabsList className="bg-muted rounded-lg p-1 shadow border w-fit">
            <TabsTrigger
              value="income"
              className="text-base px-5 py-2 font-medium data-[state=active]:bg-white data-[state=active]:shadow-sm"
            >
              <div className="flex items-center gap-2">
                הכנסות
                <TrendingUp className="w-5 h-5" />
              </div>
            </TabsTrigger>
            <TabsTrigger
              value="expenses"
              className="text-base px-5 py-2 font-medium data-[state=active]:bg-white data-[state=active]:shadow-sm"
            >
              <div className="flex items-center gap-2">
                הוצאות
                <TrendingDown className="w-5 h-5" />
              </div>
            </TabsTrigger>
            <TabsTrigger
              value="settings"
              className="text-base px-5 py-2 font-medium data-[state=active]:bg-white data-[state=active]:shadow-sm"
            >
              <div className="flex items-center gap-2">
                הגדרות
                <Settings className="w-5 h-5" />
              </div>
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="income">
          <DataTable<Payment>
        data={[]}
        updateData={async () => Promise.resolve({} as any)}
        fetchData={async (params) => {
          const enhancedParams = {
            ...params,
            sortBy: params.sortBy ?? "createdAt",
            sortOrder: params.sortOrder ?? "desc",
          };
          const res = await paymentsApi.fetchAll(enhancedParams);
          if (Array.isArray(res.data)) {
            return {
              ...res,
              data: [...res.data]
                .sort((a, b) => {
                  const dateA = new Date(a.createdAt ?? a.paymentDate ?? 0).getTime();
                  const dateB = new Date(b.createdAt ?? b.paymentDate ?? 0).getTime();
                  return dateB - dateA;
                })
                .map((item: any) => ({
                ...item,
                id: item._id,
                cardDetails: item.cardDetails || {},
                payerContactId: item.payerContactId,
                payerAccountId: item.payerAccountId,
              })),
            };
          }
          return res;
        }}
        addData={paymentsApi.create}
        deleteData={paymentsApi.delete}
        columns={columns}
        actions={actions}
        searchable
        showAdvancedSearch
        onAdvancedSearchChange={setAdvancedFilters}
        initialAdvancedFilters={advancedFilters}
        isPagination={false}
        defaultPageSize={10}
        idField="id"
        extraFilters={advancedFilters}
        customLeftButtons={
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              onClick={() => setIsAddDialogOpen(true)}
              className="bg-blue-500 hover:bg-blue-600 text-white border-blue-500 hover:border-blue-600 shadow-md hover:shadow-lg transition-all duration-200 font-medium"
            >
              <Plus className="w-4 h-4 mr-2" /> הוסף תשלום ידני
            </Button>
            <Button 
              variant="outline" 
              onClick={handleTestInvoice}
              disabled={isCreatingInvoice}
              className="bg-green-500 hover:bg-green-600 text-white border-green-500 hover:border-green-600 shadow-md hover:shadow-lg transition-all duration-200 font-medium"
            >
              {isCreatingInvoice ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" /> יוצר חשבונית...
                </>
              ) : (
                <>
                  <FileText className="w-4 h-4 mr-2" /> צור חשבונית בדיקה
                </>
              )}
            </Button>
          </div>
        }
        renderExpandedContent={({ handleSave }) => (
          <DynamicForm
            mode="create"
            headerKey="payment"
            fields={paymentFormFields}
            validationSchema={paymentSchema}
            onSubmit={async (data) => {
              const newPayment = {
                ...data,
                organizationId: organization?._id,
              };
              const res = await paymentsApi.create(newPayment);
              if (res.status === 200 && res.data) {
                handleSave?.(res.data);
              }
            }}
          />
        )}
        onRefreshReady={handleRefreshReady}
        prependNewItems
      />
      <AddRecordDialog
        open={isAddDialogOpen}
        onOpenChange={setIsAddDialogOpen}
        columns={dialogColumns}
        onAdd={handleAddPayment}
        excludeFields={["organizationId", "createdAt"]}
        relationshipFields={relationshipFieldsConfig}
        defaultValues={dialogDefaultValues}
      />
      <InvoiceModal
        open={isInvoiceModalOpen}
        onOpenChange={setIsInvoiceModalOpen}
        invoiceId={selectedInvoiceId}
      />
        </TabsContent>

        <TabsContent value="expenses">
          <Expenses />
        </TabsContent>

        <TabsContent value="settings">
          <PaymentsSettings />
        </TabsContent>
      </Tabs>
    </div>
  );
}

export async function fetchAllFeatureFlags(params: ApiQueryParams) {
  const res = await apiClient.get("/feature-flags", { params });
  if (Array.isArray(res.data)) {
    return {
      data: res.data,
      totalCount: res.data.length,
      totalPages: 1,
    };
  }
  return res.data;
}

export async function updateFeatureFlag(
  id: string,
  data: Partial<FeatureFlag>
) {
  const res = await apiClient.put(`/feature-flags/${id}`, data);
  return res.data;
}

export async function deleteFeatureFlag(id: string) {
  const res = await apiClient.delete(`/feature-flags/${id}`);
  return res.data;
}
