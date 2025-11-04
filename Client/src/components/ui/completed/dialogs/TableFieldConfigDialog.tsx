import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Plus, Save, Trash } from "lucide-react";
import { useTranslation } from "react-i18next";
import { DynamicFieldDefinition } from "@/utils/tableFieldUtils";
import { fetchTableFieldDefinitions, updateTableFieldDefinitions } from "@/api/organizations";
import { toast } from "sonner";

interface TableFieldConfigDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  entityType: string; // "kids", "parents", etc.
  organizationId: string;
  onSave?: () => void;
}

interface FieldInput {
  name: string;
  label: string;
  type: "TEXT" | "SELECT" | "DATE" | "NUMBER" | "EMAIL" | "PHONE";
  required: boolean;
  choices?: string[];
  rawChoices?: string;
}

export function TableFieldConfigDialog({
  open,
  onOpenChange,
  entityType,
  organizationId,
  onSave,
}: TableFieldConfigDialogProps) {
  const { t } = useTranslation();
  const [fields, setFields] = useState<FieldInput[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open || !organizationId) return;

    const fetchDefinitions = async () => {
      try {
        setLoading(true);
        const res = await fetchTableFieldDefinitions(organizationId);
        if (res.data?.[entityType]?.fields) {
          const fieldDefs = res.data[entityType].fields;
          const fieldInputs: FieldInput[] = Object.entries(fieldDefs).map(([name, def]: [string, any]) => ({
            name,
            label: def.label || name,
            type: def.type || "TEXT",
            required: def.required || false,
            choices: def.choices || [],
            rawChoices: def.choices?.join("\n") || "",
          }));
          setFields(fieldInputs);
        } else {
          setFields([]);
        }
      } catch (error) {
        console.error("Error fetching table field definitions:", error);
        toast.error(t("error") || "Failed to load field definitions");
      } finally {
        setLoading(false);
      }
    };

    fetchDefinitions();
  }, [open, entityType, organizationId]);

  const handleAddField = () => {
    setFields([
      ...fields,
      {
        name: "",
        label: "",
        type: "TEXT",
        required: false,
        rawChoices: "",
      },
    ]);
  };

  const handleRemoveField = (index: number) => {
    setFields(fields.filter((_, i) => i !== index));
  };

  const handleFieldChange = (index: number, updates: Partial<FieldInput>) => {
    const newFields = [...fields];
    newFields[index] = { ...newFields[index], ...updates };
    
    // Handle SELECT type changes
    if (updates.type === "SELECT" && !newFields[index].choices) {
      newFields[index].choices = [];
      newFields[index].rawChoices = "";
    }
    if (updates.type !== "SELECT") {
      newFields[index].choices = undefined;
      newFields[index].rawChoices = undefined;
    }
    
    setFields(newFields);
  };

  const handleChoicesChange = (index: number, rawChoices: string) => {
    const newFields = [...fields];
    newFields[index].rawChoices = rawChoices;
    newFields[index].choices = rawChoices
      .split("\n")
      .map((opt) => opt.trim())
      .filter(Boolean);
    setFields(newFields);
  };

  const handleSubmit = async () => {
    if (!organizationId) return;

    // Validate fields
    const invalidFields = fields.filter(
      (f) => !f.name.trim() || !f.label.trim() || (f.type === "SELECT" && (!f.choices || f.choices.length === 0))
    );

    if (invalidFields.length > 0) {
      toast.error(t("invalid_fields") || "Please fill in all required fields");
      return;
    }

    try {
      setLoading(true);
      
      // Fetch current definitions
      const res = await fetchTableFieldDefinitions(organizationId);
      const currentDefinitions = res.data || {};
      
      // Build field definitions object
      const fieldDefinitions: Record<string, DynamicFieldDefinition> = {};
      fields.forEach((field) => {
        const fieldDef: DynamicFieldDefinition = {
          type: field.type,
          label: field.label,
          required: field.required,
        };
        
        if (field.type === "SELECT" && field.choices) {
          fieldDef.choices = field.choices;
        }
        
        fieldDefinitions[field.name] = fieldDef;
      });

      // Update definitions for this entity type
      const updatedDefinitions = {
        ...currentDefinitions,
        [entityType]: {
          fields: fieldDefinitions,
        },
      };

      await updateTableFieldDefinitions(organizationId, updatedDefinitions);
      toast.success(t("saved_successfully") || "Field definitions saved successfully");
      onSave?.();
      onOpenChange(false);
    } catch (error) {
      console.error("Error saving table field definitions:", error);
      toast.error(t("error") || "Failed to save field definitions");
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFields([]);
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(value) => {
        if (!value) {
          resetForm();
          onOpenChange(false);
        }
      }}
    >
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto p-6">
        <DialogHeader>
          <DialogTitle className="text-center text-2xl">
            {t("configure_dynamic_fields", "Configure Dynamic Fields")} - {entityType}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 mt-4">
          {loading && fields.length === 0 ? (
            <div className="text-center py-4">{t("loading") || "Loading..."}</div>
          ) : (
            <>
              {fields.map((field, index) => (
                <div key={index} className="flex flex-col gap-2 border rounded p-4">
                  <div className="flex items-center gap-2">
                    <div className="flex-1 space-y-2">
                      <input
                        type="text"
                        value={field.name}
                        onChange={(e) =>
                          handleFieldChange(index, { name: e.target.value })
                        }
                        placeholder={t("field_name", "Field Name")}
                        className="w-full border rounded px-3 py-2"
                      />
                      <input
                        type="text"
                        value={field.label}
                        onChange={(e) =>
                          handleFieldChange(index, { label: e.target.value })
                        }
                        placeholder={t("field_label", "Field Label")}
                        className="w-full border rounded px-3 py-2"
                      />
                    </div>
                    <select
                      value={field.type}
                      onChange={(e) =>
                        handleFieldChange(index, {
                          type: e.target.value as FieldInput["type"],
                        })
                      }
                      className="w-40 border rounded px-3 py-2"
                    >
                      <option value="TEXT">{t("text", "Text")}</option>
                      <option value="NUMBER">{t("number", "Number")}</option>
                      <option value="DATE">{t("date", "Date")}</option>
                      <option value="EMAIL">{t("email", "Email")}</option>
                      <option value="PHONE">{t("phone", "Phone")}</option>
                      <option value="SELECT">{t("select", "Select")}</option>
                    </select>
                    <div className="flex items-center gap-2">
                      <label className="text-sm whitespace-nowrap">
                        <input
                          type="checkbox"
                          checked={field.required}
                          onChange={(e) =>
                            handleFieldChange(index, { required: e.target.checked })
                          }
                          className="mr-1"
                        />
                        {t("required", "Required")}
                      </label>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => handleRemoveField(index)}
                        className="h-8 w-8"
                      >
                        <Trash className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  {field.type === "SELECT" && (
                    <textarea
                      value={field.rawChoices || ""}
                      onChange={(e) => handleChoicesChange(index, e.target.value)}
                      placeholder={t("field_choices_placeholder", "Enter one option per line")}
                      className="w-full border rounded px-3 py-2 resize-y"
                      rows={3}
                    />
                  )}
                </div>
              ))}

              <Button
                type="button"
                variant="outline"
                onClick={handleAddField}
                className="flex items-center gap-2 mx-auto"
              >
                <Plus className="w-4 h-4" />
                {t("add_field", "Add Field")}
              </Button>
            </>
          )}
        </div>

        <DialogFooter className="mt-6 flex justify-center">
          <Button onClick={handleSubmit} disabled={loading} className="flex gap-2">
            <Save className="w-4 h-4" />
            {t("save", "Save")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

