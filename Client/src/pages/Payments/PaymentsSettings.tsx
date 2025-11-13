import { useTranslation } from "react-i18next";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useOrganization } from "@/hooks/useOrganization";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { updatePaymentSettings } from "@/api/organizations";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/Input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Lock, Loader2, X } from "lucide-react";
import { useEffect } from "react";

const paymentSettingsSchema = z.object({
  paymentProvider: z.string().optional(),
  terminalNumber: z.string().optional(),
  username: z.string().optional(),
  password: z.string().optional(),
  recurringChargeDay: z.number().min(1).max(31).optional().nullable(),
  invoicingProvider: z.string().optional(),
  invoicingProviderApiKey: z.string().optional(),
});

type PaymentSettingsValues = z.infer<typeof paymentSettingsSchema>;

const PAYMENT_PROVIDERS = [
  { value: "cardcom", label: "קארדקום" },
  { value: "grow", label: "grow" },
  { value: "tranzila", label: "טרנזילה" },
  { value: "placard", label: "פלאקארד" },
  { value: "upay", label: "Upay" },
  { value: "i-credit", label: "i-credit" },
];

const INVOICING_PROVIDERS = [
  { value: "invoice4u", label: "invoice4u" },
  { value: "morning", label: "morning" },
  { value: "icount", label: "icount" },
  { value: "revachit", label: "ריווחית" },
];

const DAYS_OF_MONTH = Array.from({ length: 31 }, (_, i) => i + 1);

export default function PaymentsSettings() {
  const { t } = useTranslation();
  const { organization, isOrganizationFetching } = useOrganization();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<PaymentSettingsValues>({
    resolver: zodResolver(paymentSettingsSchema),
    defaultValues: {
      paymentProvider: "",
      terminalNumber: "",
      username: "",
      password: "",
      recurringChargeDay: null,
      invoicingProvider: "",
      invoicingProviderApiKey: "",
    },
  });

  // Load organization data into form
  useEffect(() => {
    if (organization) {
      form.reset({
        paymentProvider: organization.paymentProvider || "",
        terminalNumber: organization.paymentProviderCredentials?.terminalNumber || "",
        username: organization.paymentProviderCredentials?.username || "",
        password: organization.paymentProviderCredentials?.password || "",
        recurringChargeDay: organization.recurringChargeDay || null,
        invoicingProvider: organization.invoicingProvider || "",
        invoicingProviderApiKey: organization.invoicingProviderApiKey || "",
      });
    }
  }, [organization, form]);

  const paymentProvider = form.watch("paymentProvider");
  const invoicingProvider = form.watch("invoicingProvider");

  const mutation = useMutation({
    mutationFn: (data: PaymentSettingsValues) => {
      if (!organization?._id) {
        throw new Error("נדרש מזהה ארגון");
      }

      const paymentSettings = {
        paymentProvider: data.paymentProvider || undefined,
        paymentProviderCredentials: data.paymentProvider
          ? {
              terminalNumber: data.terminalNumber || undefined,
              username: data.username || undefined,
              password: data.password || undefined,
            }
          : undefined,
        recurringChargeDay: data.recurringChargeDay || undefined,
        invoicingProvider: data.invoicingProvider || undefined,
        invoicingProviderApiKey: data.invoicingProviderApiKey || undefined,
      };

      return updatePaymentSettings(organization._id, paymentSettings);
    },
    onSuccess: () => {
      toast({
        title: t("success") || "הצלחה",
        description: t("payment_settings_saved") || "הגדרות התשלומים נשמרו בהצלחה",
      });
      queryClient.invalidateQueries({ queryKey: ["organization"] });
    },
    onError: (error: any) => {
      toast({
        title: t("error") || "שגיאה",
        description: error?.message || t("payment_settings_save_failed") || "שמירת הגדרות התשלומים נכשלה",
        variant: "destructive",
      });
    },
  });

  const onSubmit = async (data: PaymentSettingsValues) => {
    mutation.mutate(data);
  };

  const handleCancel = () => {
    if (organization) {
      form.reset({
        paymentProvider: organization.paymentProvider || "",
        terminalNumber: organization.paymentProviderCredentials?.terminalNumber || "",
        username: organization.paymentProviderCredentials?.username || "",
        password: organization.paymentProviderCredentials?.password || "",
        recurringChargeDay: organization.recurringChargeDay || null,
        invoicingProvider: organization.invoicingProvider || "",
        invoicingProviderApiKey: organization.invoicingProviderApiKey || "",
      });
    }
  };

  if (isOrganizationFetching) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl">
      <h2 className="text-xl font-semibold text-primary mb-6">
        הגדרות תשלומים
      </h2>

      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {/* Credit Card Clearing Provider Section */}
        <div className="space-y-4">
          <div className="grid grid-cols-12 gap-6 items-center">
            <label className="col-span-4 rtl:order-2 rtl:text-right text-sm font-medium">
              ספק סליקה
            </label>
            <div className="col-span-8">
              <Select
                value={paymentProvider}
                onValueChange={(value) => {
                  form.setValue("paymentProvider", value);
                  if (!value) {
                    form.setValue("terminalNumber", "");
                    form.setValue("username", "");
                    form.setValue("password", "");
                  }
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="בחר ספק סליקת אשראי" />
                </SelectTrigger>
                <SelectContent>
                  {PAYMENT_PROVIDERS.map((provider) => (
                    <SelectItem key={provider.value} value={provider.value}>
                      {provider.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {paymentProvider && (
            <>
              <div className="grid grid-cols-12 gap-6 items-center">
                <label className="col-span-4 rtl:order-2 rtl:text-right text-sm font-medium">
                  מספר מסוף
                </label>
                <div className="col-span-8">
                  <Input
                    {...form.register("terminalNumber")}
                    placeholder="מספר מסוף"
                  />
                  {form.formState.errors.terminalNumber && (
                    <p className="text-sm text-destructive mt-1">
                      {form.formState.errors.terminalNumber.message}
                    </p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-12 gap-6 items-center">
                <label className="col-span-4 rtl:order-2 rtl:text-right text-sm font-medium">
                  שם משתמש
                </label>
                <div className="col-span-8">
                  <Input
                    {...form.register("username")}
                    placeholder="שם משתמש"
                  />
                  {form.formState.errors.username && (
                    <p className="text-sm text-destructive mt-1">
                      {form.formState.errors.username.message}
                    </p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-12 gap-6 items-center">
                <label className="col-span-4 rtl:order-2 rtl:text-right text-sm font-medium">
                  סיסמא
                </label>
                <div className="col-span-8">
                  <Input
                    {...form.register("password")}
                    type="password"
                    placeholder="סיסמא"
                  />
                  {form.formState.errors.password && (
                    <p className="text-sm text-destructive mt-1">
                      {form.formState.errors.password.message}
                    </p>
                  )}
                </div>
              </div>
            </>
          )}

          <div className="grid grid-cols-12 gap-6 items-center">
            <label className="col-span-4 rtl:order-2 rtl:text-right text-sm font-medium">
              יום בחודש לחיוב הוראת קבע
            </label>
            <div className="col-span-8">
              <Select
                value={form.watch("recurringChargeDay")?.toString() || ""}
                onValueChange={(value) => {
                  form.setValue("recurringChargeDay", value ? parseInt(value) : null);
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="בחר יום בחודש" />
                </SelectTrigger>
                <SelectContent>
                  {DAYS_OF_MONTH.map((day) => (
                    <SelectItem key={day} value={day.toString()}>
                      {day}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {form.formState.errors.recurringChargeDay && (
                <p className="text-sm text-destructive mt-1">
                  {form.formState.errors.recurringChargeDay.message}
                </p>
              )}
            </div>
          </div>
        </div>

        <Separator />

        {/* Invoicing Provider Section */}
        <div className="space-y-4">
          <div className="grid grid-cols-12 gap-6 items-center">
            <label className="col-span-4 rtl:order-2 rtl:text-right text-sm font-medium">
              ספק חשבוניות
            </label>
            <div className="col-span-8">
              <Select
                value={invoicingProvider}
                onValueChange={(value) => {
                  form.setValue("invoicingProvider", value);
                  if (!value) {
                    form.setValue("invoicingProviderApiKey", "");
                  }
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="בחר ספק חשבוניות" />
                </SelectTrigger>
                <SelectContent>
                  {INVOICING_PROVIDERS.map((provider) => (
                    <SelectItem key={provider.value} value={provider.value}>
                      {provider.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {invoicingProvider && (
            <div className="grid grid-cols-12 gap-6 items-center">
              <label className="col-span-4 rtl:order-2 rtl:text-right text-sm font-medium">
                מפתח API
              </label>
              <div className="col-span-8">
                <Input
                  {...form.register("invoicingProviderApiKey")}
                  placeholder="מפתח API"
                />
                {form.formState.errors.invoicingProviderApiKey && (
                  <p className="text-sm text-destructive mt-1">
                    {form.formState.errors.invoicingProviderApiKey.message}
                  </p>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Save Button */}
        <div className="flex justify-center pt-4">
          <Button
            type="submit"
            disabled={!form.formState.isDirty || mutation.isPending}
            className="min-w-[120px]"
          >
            {mutation.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <>
                <Lock className="h-4 w-4 mr-2" />
                שמור
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
