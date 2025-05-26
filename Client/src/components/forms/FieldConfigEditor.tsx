import { Input } from "@/components/ui/Input";
import { useTranslation } from "react-i18next";
import { FieldConfig } from "./DynamicForm";
import { X } from "lucide-react";

interface Props {
  field: FieldConfig;
  onChange: (updated: FieldConfig) => void;
}

export default function FieldConfigEditor({ field, onChange }: Props) {
  const { t } = useTranslation();

  const slugify = (str: string) =>
    str
      .toLowerCase()
      .replace(/\s+/g, "_")
      .replace(/[^a-z0-9_]/g, "");

  const handleOptionInput = (value: string) => {
    // If the input ends with a comma, create a new option
    if (value.endsWith(",")) {
      const optionLabel = value.slice(0, -1).trim();
      if (optionLabel) {
        const newOption = {
          label: optionLabel,
          value: slugify(optionLabel),
        };
        const newOptions = [...(field.config?.options || []), newOption];
        onChange({
          ...field,
          config: { ...field.config, options: newOptions },
        });
      }
      return ""; // Clear the input after creating an option
    }
    return value;
  };

  const removeOption = (indexToRemove: number) => {
    const newOptions = (field.config?.options || []).filter(
      (_, i) => i !== indexToRemove
    );
    onChange({ ...field, config: { ...field.config, options: newOptions } });
  };

  if (field.type === "select" || field.type === "multiselect") {
    return (
      <div className="mt-2 space-y-2">
        <label className="font-semibold">
          {t("select_options")}:
          {field.type === "multiselect" && (
            <span className="text-sm text-gray-500 ml-2">
              ({t("multiple_selection_enabled")})
            </span>
          )}
        </label>
        <div className="flex flex-wrap gap-2 mb-2">
          {field.config?.options?.map((opt: any, i: number) => (
            <div
              key={i}
              className="flex items-center gap-1 bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-sm"
            >
              {opt.label}
              <button
                type="button"
                onClick={() => removeOption(i)}
                className="hover:text-blue-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
        <Input
          placeholder={t("type_and_comma")}
          onChange={(e) => {
            const newValue = handleOptionInput(e.target.value);
            if (newValue !== e.target.value) {
              e.target.value = newValue;
            }
          }}
          className="mt-2"
        />
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
          onChange={(e) =>
            onChange({ ...field, config: { text: e.target.value } })
          }
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
            onChange={(e) =>
              onChange({ ...field, isRequired: e.target.checked })
            }
          />
          {t("required_field")}
        </label>
      </div>
    </div>
  );
}
