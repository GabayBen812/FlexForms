import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useOrganization } from "@/hooks/useOrganization";
import apiClient from "@/api/apiClient";
import { string, z } from "zod";
import { useTranslation } from "react-i18next";
import FieldPalette from "@/components/forms/FieldPalette";
import DynamicForm, { FieldConfig } from "@/components/forms/DynamicForm";
import { showError } from "@/utils/swal";

export default function CreateForm() {
  const { t } = useTranslation();
  const { organization } = useOrganization();
  const navigate = useNavigate();
  const [organization_id, setOrganizationId] = useState<string | null>(null);
  const [formFields, setFormFields] = useState<FieldConfig[]>([
    { name: "title", label: t("form_title"), type: "text", isRequired: true },
    { name: "description", label: t("form_description"), type: "text", isRequired: false },
    { name: "paymentSum", label: t("payment_sum"), type: "number", isRequired: false },
  ]);

   useEffect(() => {
    if (organization?._id) {
      setOrganizationId(organization._id);
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
        isRequired: false,
      },
    ]);
  };

  const validationSchema = useMemo(() => {
    const dynamicFields = formFields.reduce((acc, field) => {
      if (field.isRequired) {
        if (field.type === "email") {
          acc[field.name] = z.string().email(t("invalid_email"));
        } else if (field.type === "text" || field.type === "date") {
          acc[field.name] = z.string().min(1, t("required_field"));
        } else if (field.type === "checkbox") {
          acc[field.name] = z.boolean().refine(val => val === true, t("required_field"));
        } else {
          acc[field.name] = z.any();
        }
      } else {
        acc[field.name] = z.any().optional();
      }
      return acc;
    }, {} as Record<string, any>);
    return z.object(dynamicFields);
  }, [formFields, t]);

  const handleSubmit = async (data: any) => {
    console.log(data)
    const { title, description, paymentSum, ...rest } = data;

    const payload = {
      title,
      description,
      paymentSum,
      isActive: true,
      organizationId: organization_id,
      fields: formFields
        .filter((f) => f.name !== "title" && f.name !== "description" && f.name !== "paymentSum")
        .map((f) => ({
          name: f.name,
          label: f.label,
          type: f.type,
          config: f.config,
          isRequired: f.isRequired,
        })),
    };

    try {
      const res = await apiClient.post("/forms", payload);
      if (res.status === 200 || res.status === 201) {
        navigate(`/activity/${res.data.code}/edit`);
      } else {
        showError(t("form_created_fail"));
      }
    } catch (err) {
      console.error(err);
      showError(t("error"));
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
