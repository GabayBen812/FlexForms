import { useParams, useNavigate, useLocation } from "react-router-dom";
import { useEffect, useState, useRef } from "react";
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
import { Copy, ExternalLink, List, ScanEye, Pencil, Settings, Check, X } from "lucide-react";
import { Input } from "@/components/ui/Input";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

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
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [editedTitle, setEditedTitle] = useState(form?.title || "");
  const inputRef = useRef<HTMLInputElement>(null);

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

  useEffect(() => {
    if (form?.title) {
      setEditedTitle(form.title);
    }
  }, [form?.title]);

  useEffect(() => {
    if (isEditingTitle && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditingTitle]);

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

  const handleSaveTitle = async () => {
    if (!form) return;
    
    if (!editedTitle.trim()) {
      toast({
        title: t("error"),
        description: t("form_title_required") || "Form title is required",
        variant: "destructive",
      });
      return;
    }

    if (editedTitle.trim() === form.title) {
      setIsEditingTitle(false);
      return;
    }

    try {
      const updatedForm = { ...form, title: editedTitle.trim() };
      const res = await formsApi.customRequest(
        "put",
        `/forms/${form._id}`,
        {
          data: updatedForm,
        }
      );

      if (res.status === 200) {
        setForm(res.data);
        setIsEditingTitle(false);
        toast({
          title: t("form_saved_success") || t("success"),
          description: t("form_title_updated") || "Form title updated successfully",
          variant: "default",
        });
      } else {
        throw new Error();
      }
    } catch {
      toast({
        title: t("form_save_error") || t("error"),
        description: t("form_save_error_description") || "Failed to update form title",
        variant: "destructive",
      });
      setEditedTitle(form.title);
    }
  };

  const handleCancelEdit = () => {
    if (!form) return;
    setEditedTitle(form.title);
    setIsEditingTitle(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      handleSaveTitle();
    } else if (e.key === "Escape") {
      handleCancelEdit();
    }
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
        {isEditingTitle ? (
          <div className="flex items-center gap-2 w-full max-w-2xl">
            <Input
              ref={inputRef}
              value={editedTitle}
              onChange={(e) => setEditedTitle(e.target.value)}
              onKeyDown={handleKeyDown}
              className="text-xl font-semibold"
            />
            <Button
              size="icon"
              variant="ghost"
              onClick={handleSaveTitle}
              className="h-8 w-8 text-green-600 hover:text-green-700 hover:bg-green-50"
            >
              <Check className="h-4 w-4" />
            </Button>
            <Button
              size="icon"
              variant="ghost"
              onClick={handleCancelEdit}
              className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        ) : (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div
                  className="group flex items-center gap-2 cursor-pointer hover:bg-gray-50 rounded-md px-3 py-2 border border-transparent hover:border-gray-200 transition-all w-full max-w-2xl justify-center"
                  onClick={() => setIsEditingTitle(true)}
                >
                  <h1 className="text-2xl font-semibold">{form.title}</h1>
                  <Pencil className="h-4 w-4 text-gray-500 opacity-60 group-hover:opacity-100 group-hover:text-blue-600 transition-all" />
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p>{t("click_to_edit") || "Click to edit form title"}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}
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
          <FormRegistrationsTable 
            form={form} 
            onFormUpdate={(updatedForm) => setForm(updatedForm)}
          />
        </TabsContent>
        <TabsContent value="edit">
          <FormEditor
            initialFields={form.fields || []}
            formTitle={form.title}
            formDescription={form.description}
            formBackgroundColor={form.backgroundColor}
            onBackgroundColorChange={async (color: string) => {
              try {
                const updatedForm = { ...form, backgroundColor: color };
                const res = await formsApi.customRequest(
                  "put",
                  `/forms/${form._id}`,
                  {
                    data: updatedForm,
                  }
                );
                if (res.status === 200) {
                  setForm(res.data);
                } else {
                  throw new Error();
                }
              } catch (error) {
                throw error;
              }
            }}
            onDescriptionChange={async (description: string) => {
              try {
                const updatedForm = { ...form, description };
                const res = await formsApi.customRequest(
                  "put",
                  `/forms/${form._id}`,
                  {
                    data: updatedForm,
                  }
                );
                if (res.status === 200) {
                  setForm(res.data);
                } else {
                  throw new Error();
                }
              } catch (error) {
                throw error;
              }
            }}
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
