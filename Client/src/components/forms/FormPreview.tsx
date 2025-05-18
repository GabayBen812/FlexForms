import { Form } from "@/types/forms/Form";
import { useTranslation } from "react-i18next";
import { useState } from "react";
import { Copy, ExternalLink, Type, Calendar, Mail, CheckSquare, FileText, ListFilter, PenLine } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

interface Props {
  form: Form;
}

const fieldTypeIcons = {
  text: Type,
  date: Calendar,
  email: Mail,
  checkbox: CheckSquare,
  terms: FileText,
  select: ListFilter,
  signature: PenLine,
};

export default function FormPreview({ form }: Props) {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);
  const registrationUrl = `${window.location.origin}/forms/${form.code}/registration`;

  const fieldTypeLabels = {
    text: t('field_type_text', 'Text'),
    date: t('field_type_date', 'Date'),
    email: t('field_type_email', 'Email'),
    checkbox: t('field_type_checkbox', 'Checkbox'),
    terms: t('field_type_terms', 'Terms'),
    select: t('field_type_select', 'Select'),
    signature: t('field_type_signature', 'Signature'),
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
    <div className="flex flex-col items-center justify-center min-h-[70vh] w-full px-2">
      {/* External Registration Link Section */}
      {/* <div className="w-full max-w-xl mb-8 flex flex-col sm:flex-row items-center gap-5">
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
      </div> */}

      {/* Modern, Large Preview Card */}
      <div
        className="w-full max-w-xl bg-white border rounded-2xl p-8 shadow-2xl hover:shadow-blue-200 transition-shadow duration-300 cursor-pointer group relative"
        onClick={openInNewTab}
        title={t("open_registration")}
      >
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-2xl font-bold text-primary group-hover:text-blue-700 transition-colors">
            {form.title || t("form_preview")}
          </h2>
          <ExternalLink className="w-5 h-5 text-blue-500 opacity-70 group-hover:opacity-100" />
        </div>
        {form.fields.length > 0 ? (
          <div className="space-y-6">
            {form.fields.map((field, idx) => {
              const Icon = fieldTypeIcons[field.type as keyof typeof fieldTypeIcons] || Type;
              return (
                <div
                  key={idx}
                  className="flex items-center gap-4 px-4 py-3 border rounded-lg bg-gray-50 text-base text-gray-700"
                >
                  <Icon className="w-5 h-5 text-blue-400" />
                  <span className="font-medium">{field.label}</span>
                  <span className="ml-auto text-xs text-gray-400">{fieldTypeLabels[field.type as keyof typeof fieldTypeLabels] || field.type}</span>
                </div>
              );
            })}
          </div>
        ) : (
          <p className="text-base text-gray-400 text-center">{t("no_fields")}</p>
        )}
        <div className="absolute top-4 right-4">
          <span className="text-xs text-gray-400">{t("click_to_open_registration")}</span>
        </div>
      </div>
    </div>
  );
}
