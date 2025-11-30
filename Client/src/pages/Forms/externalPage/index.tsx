import { useParams, useNavigate } from "react-router-dom";
import { useEffect, useState, useMemo } from "react";
import { Helmet } from "react-helmet-async";
import { createApiService } from "@/api/utils/apiFactory";
import { Form } from "@/types/forms/Form";
import { UserRegistration } from "@/types/forms/UserRegistration";
import { useTranslation } from "react-i18next";
import { z } from "zod";
import axios from "axios";
import { createPaymentSession } from '@/api/services/paymentService';
import DynamicForm, { FieldConfig } from "@/components/forms/DynamicForm";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { PageLoader } from "@/components/ui/page-loader";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { Separator } from "@/components/ui/separator";
import { AlertCircle, CheckCircle2 } from "lucide-react";
import { isValidIsraeliID } from "@/lib/israeliIdValidator";
import { isValidIsraeliPhone, unformatPhoneNumber } from "@/lib/phoneUtils";

const formsApi = createApiService<Form>("/forms", {
  customRoutes: {
    fetch: (code: string) => ({
      url: "/forms/find-by-code",
      params: { code },
    }),
  },
});

const registrationApi = createApiService<UserRegistration>("/registrations");

export default function FormRegistration() {
  const { t } = useTranslation();
  const { code } = useParams<{ code: string }>();
  const navigate = useNavigate();
  const [form, setForm] = useState<Form | null>(null);
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle");
  const [showPayment, setShowPayment] = useState(false);
  const [iframeUrl, setIframeUrl] = useState<string | undefined | null>('');


  useEffect(() => {
    if (code) {
      formsApi.fetch(code).then((res) => {
        if (res.data) setForm(res.data);
      });
    }
  }, [code]);

  const dynamicFields: FieldConfig[] = useMemo(() => {
    if (!form) {
      return [];
    }

    return [
      ...(form.fields || [])
        .filter((f): f is FieldConfig => !!f.name && !!f.label)
        .map((f) => ({
          name: f.name,
          label: f.label,
          type: f.type || "text",
          config: f.config,
          isRequired: f.isRequired ?? false,
        })),
    ];
  }, [form]);

  const fieldDefinitionsByName = useMemo(
    () =>
      dynamicFields.reduce<Record<string, FieldConfig>>((acc, field) => {
        acc[field.name] = field;
        return acc;
      }, {}),
    [dynamicFields]
  );

  const normalizeFieldValue = (
    field: FieldConfig | undefined,
    value: any
  ): any => {
    if (!field) {
      return value;
    }

    if (typeof value === "string") {
      if (field.type === "phone") {
        return unformatPhoneNumber(value);
      }
      if (field.type === "idNumber") {
        return value.trim();
      }
    }

    return value;
  };

  const invalidPhoneMessage =
    t("invalid_phone") || "Invalid phone number. Please enter a valid Israeli phone number.";
  const invalidIdMessage =
    t("invalid_israeli_id") || "Invalid Israeli ID number.";

  const getFieldValidation = (field: FieldConfig) => {
    if (field.isRequired) {
      switch (field.type) {
        case "email":
          return z.string().email({ message: t("invalid_email") });
        case "phone":
          return z
            .string()
            .min(1, { message: t("required_field") })
            .refine((value) => isValidIsraeliPhone(value), {
              message: invalidPhoneMessage,
            });
        case "idNumber":
          return z
            .string()
            .min(1, { message: t("required_field") })
            .refine((value) => isValidIsraeliID(value), {
              message: invalidIdMessage,
            });
        case "text":
        case "date":
        case "image":
        case "file":
          return z.string().min(1, { message: t("required_field") });
        case "checkbox":
          return z
            .boolean()
            .refine((val) => val === true, { message: t("required_field") });
        case "select":
        case "radio":
          return z.string().min(1, { message: t("required_field") });
        case "multiselect":
          return z.array(z.string()).min(1, { message: t("required_field") });
        default:
          return z.any();
      }
    } else {
      switch (field.type) {
        case "phone":
          return z
            .string()
            .optional()
            .refine(
              (value) => !value || isValidIsraeliPhone(value),
              { message: invalidPhoneMessage }
            );
        case "idNumber":
          return z
            .string()
            .optional()
            .refine(
              (value) => !value || isValidIsraeliID(value),
              { message: invalidIdMessage }
            );
        case "multiselect":
          return z.array(z.string()).optional();
        case "image":
        case "file":
          return z.string().optional();
        default:
          return z.any().optional();
      }
    }
  };

  const validationSchema = useMemo(
    () =>
      z.object(
        Object.fromEntries(
          dynamicFields
            .filter((field) => field.type !== "separator" && field.type !== "freeText")
            .map((field) => [field.name, getFieldValidation(field)])
        )
      ),
    [dynamicFields, invalidIdMessage, invalidPhoneMessage, t]
  );

  if (!form) {
    return <PageLoader />;
  }

  const pageUrl = typeof window !== "undefined" ? window.location.href : "";
  
  // Handle organizationId - can be string or populated object
  const organization = typeof form.organizationId === 'object' 
    ? form.organizationId 
    : null;
  const organizationIdString = typeof form.organizationId === 'string' 
    ? form.organizationId 
    : (organization?._id || '');
  
  // Get logo URL - ensure it's absolute for social media crawlers
  const logoUrl = organization?.logo 
    ? (organization.logo.startsWith('http') 
        ? organization.logo 
        : (typeof window !== 'undefined' 
            ? `${window.location.origin}${organization.logo.startsWith('/') ? '' : '/'}${organization.logo}`
            : organization.logo))
    : null;

  return (
    <>
      <Helmet>
        <title>{form.title}</title>
        {form.description && <meta name="description" content={form.description} />}
        <meta property="og:title" content={form.title} />
        {form.description && <meta property="og:description" content={form.description} />}
        <meta property="og:url" content={pageUrl} />
        <meta property="og:type" content="website" />
        {logoUrl && (
          <>
            <meta property="og:image" content={logoUrl} />
            <meta property="og:image:width" content="1200" />
            <meta property="og:image:height" content="630" />
            <meta property="og:image:type" content="image/png" />
          </>
        )}
        <meta name="twitter:card" content={logoUrl ? "summary_large_image" : "summary"} />
        <meta name="twitter:title" content={form.title} />
        {form.description && <meta name="twitter:description" content={form.description} />}
        {logoUrl && <meta name="twitter:image" content={logoUrl} />}
      </Helmet>
      <div 
        className="min-h-screen py-6 sm:py-8 px-4 sm:px-6 lg:px-8"
        style={{
          backgroundColor: form.backgroundColor || "#FFFFFF",
        }}
      >
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Organization Logo */}
        {logoUrl && (
          <div className="flex justify-center mb-6 sm:mb-8">
            <div className="relative bg-white rounded-2xl shadow-lg p-4 sm:p-6 border border-gray-100">
              <img 
                src={logoUrl} 
                alt={organization?.name || 'Organization logo'}
                className="w-48 h-48 sm:w-40 sm:h-40 md:w-48 md:h-48 object-contain"
              />
            </div>
          </div>
        )}
        
        {/* Form Header Card */}
        <Card className="shadow-lg border-0">
          <CardHeader className="pb-4">
            <CardTitle className="text-2xl sm:text-3xl font-bold text-primary leading-tight">
              {form.title}
            </CardTitle>
            {form.description && (
              <>
                <Separator className="my-4" />
                <CardDescription className="text-base text-muted-foreground leading-relaxed">
                  {form.description}
                </CardDescription>
              </>
            )}
          </CardHeader>
        </Card>

        {/* Form Content Card */}
        {!showPayment ? (
          <Card className="shadow-lg border-0">
            <CardContent className="pt-6">
              <DynamicForm
                mode="registration"
                fields={dynamicFields}
                validationSchema={validationSchema}
                onSubmit={async (data) => {
                  try {
                    // Build additionalData with ALL dynamic fields
                    // This ensures select fields and all other dynamic fields are included
                    const additionalData: Record<string, any> = {};
                    
                    // Get all dynamic field names (excluding title, description, paymentSum)
                    const dynamicFieldNames = dynamicFields
                      .filter(f => f.name !== "title" && f.name !== "description" && f.name !== "paymentSum")
                      .map(f => f.name);
                    
                    // Validate signature fields are URLs (not base64) before submission
                    const signatureFields = dynamicFields.filter(f => f.type === "signature");
                    for (const field of signatureFields) {
                      const value = data[field.name];
                      if (value && typeof value === "string") {
                        // If it's base64, reject submission (signatures should already be uploaded to Supabase)
                        if (value.startsWith("data:image")) {
                          throw new Error(
                            t("signature_not_uploaded", "חתימה לא הועלתה. אנא נסה שוב.")
                          );
                        }
                        // Ensure it's a valid URL (should be Supabase URL or any valid http/https URL)
                        if (!value.startsWith("http://") && !value.startsWith("https://")) {
                          throw new Error(
                            t("invalid_signature_url", "כתובת חתימה לא תקינה. אנא נסה שוב.")
                          );
                        }
                      }
                    }
                    
                    // Add all dynamic fields to additionalData
                    dynamicFieldNames.forEach((fieldName) => {
                      const value = data[fieldName];
                      if (value !== undefined) {
                        const fieldDefinition = fieldDefinitionsByName[fieldName];
                        const normalizedValue = normalizeFieldValue(fieldDefinition, value);
                        // Convert empty strings to null for optional fields, but keep actual values
                        additionalData[fieldName] =
                          normalizedValue === "" ? null : normalizedValue;
                      }
                    });
                    
                    // Build formData - extract fullName, email, phone only if they exist
                    // and are NOT in the dynamic fields list
                    const formData: any = {
                      formId: form._id,
                      organizationId: organizationIdString,
                      additionalData,
                    };
                    
                    // Only add fullName, email, phone as top-level fields if they're NOT dynamic fields
                    if (!dynamicFieldNames.includes("fullName") && data.fullName !== undefined) {
                      formData.fullName = data.fullName || undefined;
                    }
                    
                    if (!dynamicFieldNames.includes("email") && data.email !== undefined) {
                      formData.email = data.email || undefined;
                    }
                    
                    if (!dynamicFieldNames.includes("phone") && data.phone !== undefined) {
                      const normalizedPhone = unformatPhoneNumber(data.phone);
                      formData.phone = normalizedPhone ? normalizedPhone : undefined;
                    }
                    
                    if (form.paymentSum) {
                      const paymentData = await createPaymentSession({ 
                        amount: form.paymentSum, 
                        description: form.title, 
                        dataString: JSON.stringify(formData) 
                      });
                      const urlData = (await axios.post(paymentData.iframeUrl)).data;
                      const params = new URLSearchParams(urlData);
                      const url = params.get("url");
                      setIframeUrl(url);
                      setShowPayment(true);
                    } else {
                      await registrationApi.create(formData);
                      setStatus("success");
                      setTimeout(() => {
                        navigate(`/activity/${code}/registration/success`);
                      }, 1500);
                    }
                  } catch (err) {
                    setStatus("error");
                  }
                }}
              />
            </CardContent>
          </Card>
        ) : (
          <Card className="shadow-lg border-0">
            <CardHeader>
              <CardTitle className="text-xl sm:text-2xl font-semibold">
                {t("payment_required")}
              </CardTitle>
              <CardDescription>
                {t("complete_payment_to_finish", "אנא השלם את התשלום כדי לסיים את הרישום")}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {iframeUrl ? (
                <div className="w-full rounded-lg overflow-hidden border bg-white">
                  <iframe
                    src={iframeUrl}
                    className="w-full h-[500px] sm:h-[600px] border-0"
                    frameBorder="0"
                    allowTransparency={true}
                    title={t("payment_iframe", "תשלום")}
                  />
                </div>
              ) : (
                <div className="flex items-center justify-center h-[400px]">
                  <LoadingSpinner size="lg" />
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Status Messages */}
        {status === "success" && (
          <Card className="shadow-lg border-green-200 bg-green-50">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3 text-green-700">
                <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
                <p className="font-medium">{t("registration_success")}</p>
              </div>
            </CardContent>
          </Card>
        )}
        {status === "error" && (
          <Card className="shadow-lg border-red-200 bg-red-50">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3 text-red-700">
                <AlertCircle className="w-5 h-5 flex-shrink-0" />
                <p className="font-medium">{t("registration_fail")}</p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
      </div>
    </>
  );
}
