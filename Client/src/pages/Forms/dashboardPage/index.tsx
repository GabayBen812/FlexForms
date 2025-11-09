import { useParams, useNavigate, useLocation } from "react-router-dom";
import { useEffect, useState } from "react";
import { createApiService } from "@/api/utils/apiFactory";
import { Form } from "@/types/forms/Form";
import { useTranslation } from "react-i18next";
import FormRegistrationsTable from "@/components/forms/FormRegistrationsTable";
import FormPreview from "@/components/forms/FormPreview";
import FormSettings from "@/components/forms/FormSettings";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import FormEditor from "@/components/forms/FormEditor";
import { useToast } from "@/hooks/use-toast";
import { Copy, ExternalLink, List, ScanEye, Pencil, Settings } from "lucide-react";

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
  const [copied, setCopied] = useState(false);
  const { code } = useParams<{ code: string }>();
  const [form, setForm] = useState<Form | null>(null);
  const registrationUrl = `${window.location.origin}/activity/${form?.code}/registration`;

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
    navigate(`/activity/${code}/${value}`);
  };

const handleCopy = () => {
    navigator.clipboard.writeText(registrationUrl);
    setCopied(true);
    toast({
      title: t("link_copied"),
      description: registrationUrl,
      variant: "default",
    });
    setTimeout(() => setCopied(false), 1500);
  };


  const openInNewTab = () => {
    window.open(registrationUrl, "_blank", "noopener,noreferrer");
  };

  return (
    <div className="p-6 space-y-6">
      <Tabs
        value={currentTab}
        onValueChange={handleTabChange}
         className={`w-full space-y-4 ${isRTL ? "text-right" : "text-left"}`}
        dir={direction}
      >
       <div className="flex flex-col items-center gap-4">
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
            value="edit"
            className="text-base px-5 py-2 font-medium data-[state=active]:bg-white data-[state=active]:shadow-sm"
          >
            <div className="flex items-center gap-2">
            {t("edit_form")}
            <Pencil className="w-5 h-5"/>
            </div>
          </TabsTrigger>
          <TabsTrigger
            value="settings"
            className="text-base px-5 py-2 font-medium data-[state=active]:bg-white data-[state=active]:shadow-sm"
            >
              <div className="flex items-center gap-2">
            {t("form_settings")}
            <Settings className="w-5 h-5"/>
            </div>
          </TabsTrigger>
        </TabsList>
        <div className="w-full max-w-xl mb-0 flex flex-col sm:flex-row items-center gap-5">
        <div
          className="flex-1 flex items-center bg-gray-50 border rounded-lg px-4 py-2 text-sm font-mono cursor-pointer hover:bg-gray-100 transition gap-4"
          onClick={openInNewTab}
          title={registrationUrl}
        >
          <ExternalLink className="w-4 h-4 text-blue-500 mr-4" />
          <span className="truncate text-blue-700 underline">{registrationUrl}</span>
        </div>
        <Button
          variant="outline"
          size="icon"
          onClick={handleCopy}
          className="ml-4"
          aria-label={t("copy_link")}
        >
          <Copy className="w-4 h-4" />
        </Button>
      </div>
      </div>
        <TabsContent value="dashboard">
          <FormRegistrationsTable form={form} />
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
        <TabsContent value="settings">
          <FormSettings form={form} />
        </TabsContent>
      </Tabs>
      </div>
    );
}
