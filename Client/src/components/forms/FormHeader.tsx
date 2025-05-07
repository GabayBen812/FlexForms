import { useEffect, useState } from "react";
import { Form } from "@/types/forms/Form";
import { useTranslation } from "react-i18next";
import dayjs from "dayjs";
import { createApiService } from "@/api/utils/apiFactory";

interface Props {
  form: Form;
}

const organizationsApi = createApiService<{ name: string }>("/organizations");

export default function FormHeader({ form }: Props) {
  const { t } = useTranslation();
  const [orgName, setOrgName] = useState<string>("");

  useEffect(() => {
    if (!form.organizationId) return;

    organizationsApi.fetch(form.organizationId).then((res) => {
      if (res?.data?.name) {
        setOrgName(res.data.name);
      }
    });
  }, [form.organizationId]);

  return (
    <div className="bg-blue-100 rounded-xl p-6 shadow">
      <h1 className="text-3xl font-bold text-primary mb-2">{form.title}</h1>
      <p className="text-gray-700 mb-4">
        {form.description || t("no_description")}
      </p>
      <div className="text-sm text-gray-600 space-y-1">
        <div>
          <strong>{t("organization")}:</strong> {orgName || t("loading")}
        </div>
        <div>
          <strong>{t("created_by")}:</strong>{" "}
          {form.createdBy || t("unknown")}
        </div>
        <div>
          <strong>{t("created_at")}:</strong>{" "}
          {dayjs(form.createdAt).format("DD/MM/YYYY HH:mm")}
        </div>
        <div>
          <strong>{t("updated_at")}:</strong>{" "}
          {dayjs(form.updatedAt).format("DD/MM/YYYY HH:mm")}
        </div>
      </div>
    </div>
  );
}
