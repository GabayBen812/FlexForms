import { useTranslation } from "react-i18next";
import { useContext } from "react";
import { ColumnDef } from "@tanstack/react-table";
import { z } from "zod";
import { useState } from "react";
import { Plus, TrendingUp, TrendingDown, Settings, FileText, Loader2 } from "lucide-react";

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
import { createInvoice } from "@/api/invoices";
import { CreateInvoiceDto, InvoiceDocumentType, InvoicePaymentType, Currency, Language } from "@/types/invoices/invoice";

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
  invoice?: {
    id: string;
    originalDocumentUrl: string;
  };
  formId: string;
  organizationId: string;
  createdAt?: string;
  updatedAt?: string;
};

const paymentsApi = createApiService<Payment>("/payments", {
  includeOrgId: true,
});

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

  const handleTabChange = (value: string) => {
    setCurrentTab(value);
  };

  const columns: ColumnDef<Payment>[] = [
    { accessorKey: "cardDetails.cardOwnerName", header: t("card_owner_name") },
    {
      accessorKey: "cardDetails.cardOwnerEmail",
      header: t("card_owner_email"),
    },
    { accessorKey: "amount", header: t("amount") },
    { accessorKey: "status", header: t("status") },
    { accessorKey: "service", header: t("service") },
    { accessorKey: "createdAt", header: t("created_at"), meta: { hidden: true } },
    { accessorKey: "organizationId", header: "", meta: { hidden: true } },
  ];

  // Create simplified columns for the dialog (without nested paths)
  const dialogColumns: ColumnDef<Payment>[] = [
    { accessorKey: "cardOwnerName", header: t("card_owner_name") },
    { accessorKey: "cardOwnerEmail", header: t("card_owner_email") },
    { accessorKey: "amount", header: t("amount") },
    { accessorKey: "status", header: t("status") },
    { accessorKey: "service", header: t("service") },
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

  const handleAddPayment = async (data: any) => {
    try {
      const newPayment: Partial<Payment> = {
        cardDetails: {
          cardOwnerName: data.cardOwnerName || "",
          cardOwnerEmail: data.cardOwnerEmail || "",
          last4Digits: "",
          expiryMonth: "",
          expiryYear: "",
          token: "",
        },
        amount: parseFloat(data.amount) || 0,
        status: data.status || "",
        service: data.service || "",
        organizationId: organization?._id || "",
      };
      const res = await paymentsApi.create(newPayment);
      if (res.status === 200 || res.data) {
        toast({
          title: t("success") || "הצלחה",
          description: t("form_created_success") || "הטופס נוצר בהצלחה",
        });
        // Table will refresh automatically via fetchData
      }
    } catch (error) {
      console.error("Error creating payment:", error);
      toast({
        title: t("error") || "שגיאה",
        description: t("error") || "אירעה שגיאה",
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
          const res = await paymentsApi.fetchAll(params);
          if (Array.isArray(res.data)) {
            return {
              ...res,
              data: res.data.map((item: any) => ({
                ...item,
                id: item._id,
                cardDetails: item.cardDetails || {},
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
              <Plus className="w-4 h-4 mr-2" /> {t("add")}
            </Button>
            {/* <Button 
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
            </Button> */}
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
      />
      <AddRecordDialog
        open={isAddDialogOpen}
        onOpenChange={setIsAddDialogOpen}
        columns={dialogColumns}
        onAdd={handleAddPayment}
        excludeFields={["organizationId", "createdAt"]}
        defaultValues={{
          organizationId: organization?._id || "",
        }}
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
