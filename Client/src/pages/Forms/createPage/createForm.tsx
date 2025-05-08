import { useState, useEffect, useMemo } from "react";
import { useOrganization } from "@/hooks/useOrganization";
import apiClient from "@/api/apiClient";
import { z } from "zod";
import { useTranslation } from "react-i18next";
import FieldPalette from "@/components/forms/FieldPalette";
import DynamicForm, { FieldConfig } from "@/components/forms/DynamicForm";

export default function CreateForm() {
  const { t } = useTranslation();
  const { organization } = useOrganization();
  const [formFields, setFormFields] = useState<FieldConfig[]>([
    { name: "title", label: t("form_title"), type: "text" },
    { name: "description", label: t("form_description"), type: "text" },
  ]);

  useEffect(() => {
    if (organization?._id) {
      // ניתן לשמור כאן את ה־ID אם אתה רוצה להוסיף אותו ל־payload
    }
  }, [organization]);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const dropped = JSON.parse(e.dataTransfer.getData("field")) as {
      type: string;
    };

    const uniqueName = `field_${Date.now()}`;
    setFormFields((prev) => [
      ...prev,
      {
        name: uniqueName,
        label: "",
        type: dropped.type,
        config: {},
      },
    ]);
  };

  const validationSchema = useMemo(() => {
    const dynamicFields = formFields.reduce((acc, field) => {
      if (field.name === "title") {
        acc[field.name] = z.string().min(1, t("required"));
      } else {
        acc[field.name] = z.any();
      }
      return acc;
    }, {} as Record<string, any>);

    return z.object(dynamicFields);
  }, [formFields, t]);

  const handleSubmit = async (data: any) => {
    const { title, description, ...rest } = data;

    const payload = {
      title,
      description,
      isActive: true,
      organizationId: organization?._id,
      fields: formFields
        .filter((f) => f.name !== "title" && f.name !== "description")
        .map((f) => ({
          name: f.name,
          label: f.label,
          type: f.type,
          config: f.config,
        })),
    };

    try {
      const res = await apiClient.post("/forms", payload);
      if (res.status === 200 || res.status === 201) {
        alert(t("form_created_success"));
      } else {
        alert(t("form_created_fail"));
      }
    } catch (err) {
      console.error(err);
      alert(t("error"));
    }
  };

  return (
    <div className="grid grid-cols-3 gap-6 p-6">
      <FieldPalette />
      <div
        className="col-span-2 border-dashed border-2 rounded-lg p-4"
        onDragOver={(e) => e.preventDefault()}
        onDrop={handleDrop}
      >
        <DynamicForm
          mode="create"
          fields={formFields}
          setFields={setFormFields}
          validationSchema={validationSchema}
          onSubmit={handleSubmit}
        />
      </div>
    </div>
  );
}
