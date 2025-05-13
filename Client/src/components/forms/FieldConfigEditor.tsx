import { Input } from "@/components/ui/Input";
import { useTranslation } from "react-i18next";
import { FieldConfig } from "./DynamicForm";

interface Props {
  field: FieldConfig;
  onChange: (updated: FieldConfig) => void;
}

export default function FieldConfigEditor({ field, onChange }: Props) {
  const { t } = useTranslation();

  const slugify = (str: string) =>
    str
      .toLowerCase()
      .replace(/\s+/g, '_')
      .replace(/[^a-z0-9_]/g, '');

  const handleOptionLabelChange = (i: number, value: string) => {
    const newOptions = [...(field.config?.options || [])];
    newOptions[i].label = value;
    newOptions[i].value = slugify(value);
    onChange({ ...field, config: { ...field.config, options: newOptions } });
  };

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
              onChange={(e) => handleOptionLabelChange(i, e.target.value)}
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

  return (
    <div>
      {/* Existing config editors */}
      {/* ... existing code ... */}
      <div className="mt-2">
        <label className="font-semibold flex items-center gap-2">
          <input
            type="checkbox"
            checked={!!field.isRequired}
            onChange={e => onChange({ ...field, isRequired: e.target.checked })}
          />
          {t("required_field")}
        </label>
      </div>
    </div>
  );
}
