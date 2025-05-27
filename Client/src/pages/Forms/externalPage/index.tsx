import { useParams, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { createApiService } from "@/api/utils/apiFactory";
import { Form } from "@/types/forms/Form";
import { UserRegistration } from "@/types/forms/UserRegistration";
import { useTranslation } from "react-i18next";
import { z } from "zod";
import axios from "axios";
import { createPaymentSession } from '@/api/services/paymentService';
import DynamicForm, { FieldConfig } from "@/components/forms/DynamicForm";

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

  if (!form) return <div className="p-6">{t("loading_form")}</div>;

  const dynamicFields: FieldConfig[] = [
    // { name: "fullName", label: t("full_name"), type: "text", isRequired: true },
    // { name: "email", label: t("email"), type: "email", isRequired: true },
    // { name: "phone", label: t("phone"), type: "text", isRequired: true },
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

  const getFieldValidation = (field: FieldConfig) => {
    if (field.isRequired) {
      switch (field.type) {
        case "email":
          return z.string().email({ message: t("invalid_email") });
        case "text":
        case "date":
          return z.string().min(1, { message: t("required_field") });
        case "checkbox":
          return z
            .boolean()
            .refine((val) => val === true, { message: t("required_field") });
        case "select":
          return z.string().min(1, { message: t("required_field") });
        case "multiselect":
          return z.array(z.string()).min(1, { message: t("required_field") });
        default:
          return z.any();
      }
    } else {
      switch (field.type) {
        case "multiselect":
          return z.array(z.string()).optional();
        default:
          return z.any().optional();
      }
    }
  };

  const validationSchema = z.object(
    Object.fromEntries(
      dynamicFields.map((field) => [field.name, getFieldValidation(field)])
    )
  );

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-6">
      <h1 className="text-3xl font-bold text-primary">{form.title}</h1>
      <p className="text-gray-600">{form.description || t("no_description")}</p>

      {!showPayment ? (
        <DynamicForm
          mode="registration"
          fields={dynamicFields}
          validationSchema={validationSchema}
          onSubmit={async (data) => {
            try {
              const { fullName, email, phone, ...rest } = data;
              const formData = {
                formId: form._id,
                organizationId: form.organizationId,
                fullName,
                email,
                phone,
                additionalData: rest,
              };

              
              if (form.paymentSum) {
                const paymentData = await createPaymentSession({ amount: form.paymentSum, description: form.title, dataString: JSON.stringify(formData) });
                const urlData = (await axios.post(paymentData.iframeUrl)).data
                console.log(paymentData.iframeUrl)
                console.log(urlData)
                const params = new URLSearchParams(urlData);
                const url = params.get("url");
                console.log(url, "url")
                setIframeUrl(url);
                setShowPayment(true);
              } else {
                await registrationApi.create(formData);
                navigate(`/forms/${code}/registration/success`);
              }
            } catch (err) {
              console.error("❌ Error submitting form:", err);
              setStatus("error");
            }
          }}
        />
      ) : (
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">{t("payment_required")}</h2>
          {iframeUrl && (
            <iframe
              src={iframeUrl}
              className="w-full max-w-3xl h-[600px]"
              frameBorder="0"
              allowTransparency={true}
            />
          )}
        </div>
      )}

      {status === "success" && (
        <p className="text-green-600">{t("registration_success")}</p>
      )}
      {status === "error" && (
        <p className="text-red-600">{t("registration_fail")}</p>
      )}
    </div>
  );
}
