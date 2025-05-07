import { Form } from "@/types/forms/Form";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";

interface Props {
  form: Form;
}

export default function FormPreview({ form }: Props) {
  const { t } = useTranslation();
  const navigate = useNavigate();

  return (
    <div className="flex items-center justify-center h-full">
      <div
        className="w-[350px] max-w-full bg-white border rounded-xl p-6 shadow-lg hover:shadow-2xl hover:border-blue-500 transition-transform duration-300 transform hover:scale-105 cursor-pointer group"
        onClick={() => navigate(`/forms/${form.code}/registration`)}
      >
        <h2 className="text-xl font-bold text-center text-primary mb-4 group-hover:text-blue-700 transition-colors">
          {t("form_preview")}
        </h2>

        {form.fields.length > 0 ? (
          <div className="space-y-3">
            {form.fields.slice(0, 3).map((field, idx) => (
              <div
                key={idx}
                className="px-3 py-2 border rounded-md bg-gray-50 text-sm text-gray-700"
              >
                {field.label}
              </div>
            ))}

            {form.fields.length > 3 && (
              <p className="text-xs text-gray-400 text-center">
                + {form.fields.length - 3} {t("more_fields")}
              </p>
            )}
          </div>
        ) : (
          <p className="text-sm text-gray-400 text-center">{t("no_fields")}</p>
        )}
      </div>
    </div>
  );
}
