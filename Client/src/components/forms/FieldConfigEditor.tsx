import { Input } from "@/components/ui/Input";
import { useTranslation } from "react-i18next";
import { FieldConfig } from "./DynamicForm";

interface Props {
  field: FieldConfig;
  onChange: (updated: FieldConfig) => void;
}

export default function FieldConfigEditor({ field, onChange }: Props) {
  const { t } = useTranslation();

  const handleOptionChange = (i: number, key: "label" | "value", value: string) => {
    const newOptions = [...(field.config?.options || [])];
    newOptions[i][key] = value;
    onChange({ ...field, config: { ...field.config, options: newOptions } });
  };

  const addOption = () => {
    const newOptions = [...(field.config?.options || []), { label: "", value: "" }];
    onChange({ ...field, config: { ...field.config, options: newOptions } });
  };

  if (field.type === "select") {
    return (
      <div className="mt-2 space-y-2">
        <label className="font-semibold">{t("select_options")}:</label>
        {field.config?.options?.map((opt: any, i: number) => (
          <div key={i} className="flex gap-2">
            <Input
              placeholder="Label"
              value={opt.label}
              onChange={(e) => handleOptionChange(i, "label", e.target.value)}
            />
            <Input
              placeholder="Value"
              value={opt.value}
              onChange={(e) => handleOptionChange(i, "value", e.target.value)}
            />
          </div>
        ))}
        <button
          type="button"
          onClick={addOption}
          className="text-blue-600 text-sm"
        >
          {t("add_option")}
        </button>
      </div>
    );
  }

  if (field.type === "terms") {
    return (
      <div className="mt-2 space-y-2">
        <label className="font-semibold">{t("terms_text")}</label>
        <textarea
          className="border rounded w-full p-2"
          rows={4}
          value={field.config?.text || ""}
          onChange={(e) => onChange({ ...field, config: { text: e.target.value } })}
        />
      </div>
    );
  }

  return null;
}
