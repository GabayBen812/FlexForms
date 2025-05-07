import { useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import { createApiService } from "@/api/utils/apiFactory";
import { Form } from "@/types/forms/Form";
import { useTranslation } from "react-i18next";
import FormHeader from "@/components/forms/FormHeader";
import FormRegistrationsTable from "@/components/forms/FormRegistrationsTable";
import FormPreview from "@/components/forms/FormPreview";

const formsApi = createApiService<Form>("/forms", {
  customRoutes: {
    fetch: (code: string) => ({
      url: "/forms/find-by-code",
      params: { code },
    }),
  },
});

export default function FormDetails() {
  const { t } = useTranslation();
  const { code } = useParams<{ code: string }>();

  const [form, setForm] = useState<Form | null>(null);

  useEffect(() => {
    if (!code) return;

    formsApi.fetch(code).then((res) => {
      if (res.data) {
        setForm(res.data);
      }
    });
  }, [code]);

  if (!form) return <div className="p-6">{t("loading_form")}...</div>;

  return (
    <div className="p-6 space-y-6">
      <FormHeader form={form} />

      <div className="grid grid-cols-3 gap-6">
        <FormRegistrationsTable form={form} />

        <div className="col-span-1">
          <FormPreview form={form} />
        </div>
      </div>
    </div>
  );
}