import { useParams, useNavigate, useLocation } from "react-router-dom";
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
import { List, ScanEye, Pencil } from "lucide-react";

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
  const navigate = useNavigate();
  const location = useLocation();

  const { code } = useParams<{ code: string }>();
  const [form, setForm] = useState<Form | null>(null);

  // Get the current tab from the URL path
  const currentTab = location.pathname.split('/').pop() || 'dashboard';

  useEffect(() => {
    if (!code) return;

    formsApi.fetch(code).then((res) => {
      if (res.data) {
        setForm(res.data);
      }
    });
  }, [code]);

  if (!form) return <div className="p-6">{t("loading_form")}...</div>;

  const handleTabChange = (value: string) => {
    navigate(`/forms/${code}/${value}`);
  };

  return (
    <div className="p-6 space-y-6">
      <Tabs
        value={currentTab}
        onValueChange={handleTabChange}
        className={`w-full space-y-4 ${isRTL ? "text-right" : "text-left"}`}
        dir={direction}
      >
        <div className="flex justify-center">
        <TabsList className="bg-muted rounded-lg p-1 shadow border w-fit mx-auto sm:mx-0">
          <TabsTrigger
            value="dashboard"
            className="text-base px-5 py-2 font-medium data-[state=active]:bg-white data-[state=active]:shadow-sm"
          >
             <div className="flex items-center gap-2">
            {t("registrations_list")}
            <List className="w-5 h-5" />
            </div>
          </TabsTrigger>
          <TabsTrigger
            value="preview"
            className="text-base px-5 py-2 font-medium data-[state=active]:bg-white data-[state=active]:shadow-sm"
          >
          <div className="flex items-center gap-2">
          {t("form_preview")}
          <ScanEye className="w-5 h-5"/>
          </div>
          </TabsTrigger>
          <TabsTrigger
            value="edit"
            className="text-base px-5 py-2 font-medium data-[state=active]:bg-white data-[state=active]:shadow-sm"
          >
            <div className="flex items-center gap-2">
            {t("edit_form")}
            <Pencil className="w-5 h-5"/>
            </div>
          </TabsTrigger>
        </TabsList>
  </div>
        <TabsContent value="dashboard">
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
