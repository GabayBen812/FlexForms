import { useState } from "react";
import { FieldConfig } from "@/components/forms/DynamicForm";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/Input";
import { useTranslation } from "react-i18next";
import { Trash2, ArrowUp, ArrowDown } from "lucide-react";
import FieldConfigEditor from "./FieldConfigEditor";

interface Props {
  initialFields: FieldConfig[];
  onUpdate: (updatedFields: FieldConfig[]) => void;
}

export default function FormEditor({ initialFields, onUpdate }: Props) {
  const { t } = useTranslation();
  const [fields, setFields] = useState<FieldConfig[]>(initialFields);

  const handleAddField = (type: string) => {
    const newField: FieldConfig = {
      name: `${type}_${Date.now()}`,
      label: `${t("new_field")}`,
      type,
      config: {},
    };
    setFields([...fields, newField]);
  };

  const handleUpdateField = (index: number, key: keyof FieldConfig, value: any) => {
    setFields((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [key]: value };
      return updated;
    });
  };

  const handleDeleteField = (name: string) => {
    setFields(fields.filter((f) => f.name !== name));
  };

  const handleMoveField = (index: number, direction: "up" | "down") => {
    const newFields = [...fields];
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= newFields.length) return;
    [newFields[index], newFields[targetIndex]] = [newFields[targetIndex], newFields[index]];
    setFields(newFields);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-2">
        {["text", "date", "email", "checkbox", "terms", "select", "signature"].map((type) => (
          <Button key={type} variant="outline" onClick={() => handleAddField(type)}>
            {t(`add_${type}_field`)}
          </Button>
        ))}
      </div>

      {fields.map((field, index) => (
        <div
          key={field.name}
          className="relative border p-4 rounded-md bg-muted space-y-3"
        >
          <div className="absolute top-2 left-2 flex gap-1">
            <Button size="icon" variant="outline" onClick={() => handleMoveField(index, "up")}>
              <ArrowUp className="w-4 h-4" />
            </Button>
            <Button size="icon" variant="outline" onClick={() => handleMoveField(index, "down")}>
              <ArrowDown className="w-4 h-4" />
            </Button>
            <Button size="icon" variant="destructive" onClick={() => handleDeleteField(field.name)}>
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium">{t("field_label")}</label>
              <Input
                value={field.label}
                onChange={(e) => handleUpdateField(index, "label", e.target.value)}
              />
            </div>

            <div>
              <label className="text-sm font-medium">{t("field_type")}</label>
              <Input value={field.type} disabled className="opacity-70" />
            </div>
          </div>

          <FieldConfigEditor field={field} onChange={updated => handleUpdateField(index, "isRequired", updated.isRequired)} />
        </div>
      ))}

      <div className="flex justify-end">
        <Button onClick={() => onUpdate(fields)}>{t("save_changes")}</Button>
      </div>
    </div>
  );
}
