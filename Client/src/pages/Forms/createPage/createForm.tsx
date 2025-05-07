import { useState } from "react";
import { useOrganization } from "@/hooks/useOrganization";
import { useEffect } from "react";
import apiClient from "@/api/apiClient";
import DynamicForm, { FieldConfig } from "@/components/forms/DynamicForm";
import { z } from "zod";
import { useTranslation } from "react-i18next";

function CreateForm() {
  const { organization } = useOrganization();
  const { t } = useTranslation();
  const [organizationId, setOrganizationId] = useState<string>();

  useEffect(() => {
    if (organization?._id) {
      setOrganizationId(organization._id);
    }
  }, [organization]);

  const handleSubmit = async (data: any) => {
    console.log("Submitted data:", data);

    if (!data.title || !organizationId) {
      alert(`{t("alert_organization_name")}`);
      return;
    }

    const formPayload = {
      ...data,
      organizationId,
      isActive: true,
    };

    try {
      const response = await apiClient.post("/forms", formPayload);

      if (response.status === 200 || response.status === 201) {
        alert(`${t("form_created_success")}`);
      } else {
        alert(`${t("form_created_fail")}`);
      }
    } catch (error) {
      alert(`${t("error")}`);
    }
  };
  const FormFields: FieldConfig[] = [
    { name: "title", label: t("form_title"), type: "text" },
    {
      name: "description",
      label: t("form_description") + " (אופציונלי)",
      type: "text",
    },
    { name: "fields", label: t("form_fields"), type: "custom" },
  ];
  const formSchema = z.object({
    title: z.string().min(1),
    description: z.string(),
  });

  return (
    <div>
      <DynamicForm
        mode="create"
        headerKey="form"
        fields={FormFields}
        validationSchema={formSchema}
        onSubmit={handleSubmit}
      />
    </div>
  );
}

export default CreateForm;
