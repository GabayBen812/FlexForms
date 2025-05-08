import { useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import { createApiService } from "@/api/utils/apiFactory";
import { Form } from "@/types/forms/Form";
import { useTranslation } from "react-i18next";
import FormHeader from "@/components/forms/FormHeader";
import FormRegistrationsTable from "@/components/forms/FormRegistrationsTable";
import FormPreview from "@/components/forms/FormPreview";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import FormEditor from "@/components/forms/FormEditor";
import { useToast } from "@/hooks/use-toast";

const formsApi = createApiService<Form>("/forms", {
  customRoutes: {
    fetch: (code: string) => ({
      url: "/forms/find-by-code",
      params: { code },
    }),
    update: (form: Form) => ({
      url: `/forms/${form._id}`,
      method: "put",
      data: form,
    }),
  },
});

export default function FormDetails() {
  const { t, i18n } = useTranslation();
  const direction = i18n.dir();
  const isRTL = direction === "rtl";
  const { toast } = useToast();

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

      <Tabs
        defaultValue="table"
        className={`w-full space-y-4 ${isRTL ? "text-right" : "text-left"}`}
        dir={direction}
      >
        <TabsList className="bg-muted rounded-lg p-1 shadow border w-fit mx-auto sm:mx-0">
          <TabsTrigger
            value="table"
            className="text-base px-5 py-2 font-medium data-[state=active]:bg-white data-[state=active]:shadow-sm"
          >
            {t("registrations_list")}
          </TabsTrigger>
          <TabsTrigger
            value="preview"
            className="text-base px-5 py-2 font-medium data-[state=active]:bg-white data-[state=active]:shadow-sm"
          >
            {t("form_preview")}
          </TabsTrigger>
          <TabsTrigger
            value="edit"
            className="text-base px-5 py-2 font-medium data-[state=active]:bg-white data-[state=active]:shadow-sm"
          >
            {t("edit_form")}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="table">
          <FormRegistrationsTable form={form} />
        </TabsContent>

        <TabsContent value="preview">
          <FormPreview form={form} />
        </TabsContent>

        <TabsContent value="edit">
          <FormEditor
            initialFields={form.fields || []}
            onUpdate={async (updatedFields) => {
              try {
                const updatedForm = { ...form, fields: updatedFields };
                const res = await formsApi.customRequest(
                  "put",
                  `/forms/${form._id}`,
                  {
                    data: updatedForm,
                  }
                );
                if (res.status === 200) {
                  setForm(res.data);
                  toast({
                    title: t("form_saved_success"),
                    description: t("form_saved_success_description"),
                    variant: "default",
                  });
                } else {
                  throw new Error();
                }
              } catch {
                toast({
                  title: t("form_save_error"),
                  description: t("form_save_error_description"),
                  variant: "destructive",
                });
              }
            }}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
