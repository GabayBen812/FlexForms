import { useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import { createApiService } from "@/api/utils/apiFactory";
import { Form } from "@/types/forms/Form";
import { UserRegistration } from "@/types/forms/UserRegistration";
import { useTranslation } from "react-i18next";
import { z } from "zod";
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
  const [form, setForm] = useState<Form | null>(null);
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle");

  useEffect(() => {
    if (code) {
      formsApi.fetch(code).then((res) => {
        if (res.data) setForm(res.data);
      });
    }
  }, [code]);

  if (!form) return <div className="p-6">{t("loading_form")}</div>;

  const dynamicFields: FieldConfig[] = [
    { name: "fullName", label: t("full_name"), type: "text" },
    { name: "email", label: t("email"), type: "email" },
    { name: "phone", label: t("phone"), type: "text" },
    ...(form.fields || [])
      .filter((f): f is FieldConfig => !!f.name && !!f.label)
      .map((f) => ({
        name: f.name,
        label: f.label,
        type: f.type || "text",
      })),
  ];
  
  const getFieldValidation = (field: FieldConfig) => {
    switch (field.type) {
      case "email":
        return z.string().email({ message: t("invalid_email") });
      case "text":
        return z.string().min(1, { message: t("required_field") });
      case "checkbox":
        return z.boolean().optional();
      default:
        return z.any();
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

      <DynamicForm
        mode="registration"
        fields={dynamicFields}
        validationSchema={validationSchema}
        onSubmit={async (data) => {
          try {
            const { fullName, email, phone, ...rest } = data;
            await registrationApi.create({
              formId: form._id,
              organizationId: form.organizationId,
              fullName,
              email,
              phone,
              additionalData: rest,
            });
            setStatus("success");
          } catch (err) {
            console.error("❌ Error submitting form:", err);
            setStatus("error");
          }
        }}
      />

      {status === "success" && (
        <p className="text-green-600">{t("registration_success")}</p>
      )}
      {status === "error" && (
        <p className="text-red-600">{t("registration_fail")}</p>
      )}
    </div>
  );
}
