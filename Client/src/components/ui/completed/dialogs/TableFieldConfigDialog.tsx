import { useEffect, useState, useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Plus, Save, Trash, X } from "lucide-react";
import { useTranslation } from "react-i18next";
import { DynamicFieldDefinition } from "@/utils/tableFieldUtils";
import { fetchTableFieldDefinitions, updateTableFieldDefinitions } from "@/api/organizations";
import { toast } from "sonner";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { cn } from "@/lib/utils";

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
  type: "TEXT" | "SELECT" | "DATE" | "NUMBER" | "EMAIL" | "PHONE" | "MULTI_SELECT" | "TIME" | "CHECKBOX" | "ADDRESS" | "MONEY";
  required: boolean;
  choices?: string[];
  rawChoices?: string;
}

// Colors for chips display
const chipColors = [
  "bg-pink-100 text-pink-800 border-pink-200 dark:bg-pink-900/30 dark:text-pink-300 dark:border-pink-800",
  "bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800",
  "bg-green-100 text-green-800 border-green-200 dark:bg-green-900/30 dark:text-green-300 dark:border-green-800",
  "bg-orange-100 text-orange-800 border-orange-200 dark:bg-orange-900/30 dark:text-orange-300 dark:border-orange-800",
  "bg-purple-100 text-purple-800 border-purple-200 dark:bg-purple-900/30 dark:text-purple-300 dark:border-purple-800",
  "bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-300 dark:border-yellow-800",
  "bg-indigo-100 text-indigo-800 border-indigo-200 dark:bg-indigo-900/30 dark:text-indigo-300 dark:border-indigo-800",
  "bg-cyan-100 text-cyan-800 border-cyan-200 dark:bg-cyan-900/30 dark:text-cyan-300 dark:border-cyan-800",
];

// Component for adding new choices
interface ChoiceInputProps {
  onAddChoice: (value: string) => void;
  placeholder?: string;
  existingChoices: string[];
}

function ChoiceInput({ onAddChoice, placeholder, existingChoices }: ChoiceInputProps) {
  const [inputValue, setInputValue] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && inputValue.trim()) {
      e.preventDefault();
      if (!existingChoices.includes(inputValue.trim())) {
        onAddChoice(inputValue.trim());
        setInputValue("");
      }
    }
  };

  const handleAddClick = () => {
    if (inputValue.trim() && !existingChoices.includes(inputValue.trim())) {
      onAddChoice(inputValue.trim());
      setInputValue("");
      inputRef.current?.focus();
    }
  };

  return (
    <div className="flex items-center gap-2">
      <input
        ref={inputRef}
        type="text"
        value={inputValue}
        onChange={(e) => setInputValue(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        className="flex-1 border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:border-gray-600 dark:text-white"
      />
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={handleAddClick}
        disabled={!inputValue.trim() || existingChoices.includes(inputValue.trim())}
        className="shrink-0"
      >
        <Plus className="w-4 h-4" />
      </Button>
    </div>
  );
}

export function TableFieldConfigDialog({
  open,
  onOpenChange,
  entityType,
  organizationId,
  onSave,
}: TableFieldConfigDialogProps) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [fields, setFields] = useState<FieldInput[]>([]);
  const [loading, setLoading] = useState(false);

  // React Query mutation with automatic cache invalidation
  const updateMutation = useMutation({
    mutationFn: async (updatedDefinitions: Record<string, any>) => {
      return await updateTableFieldDefinitions(organizationId, updatedDefinitions);
    },
    onSuccess: () => {
      // Automatically invalidate and refetch organization data
      // This will trigger a refetch of the organization query, which will update mergedColumns
      queryClient.invalidateQueries({ queryKey: ["organization"] });
      toast.success(t("saved_successfully") || "Field definitions saved successfully");
      onSave?.();
      onOpenChange(false);
    },
    onError: (error) => {
      console.error("Error saving table field definitions:", error);
      toast.error(t("error") || "Failed to save field definitions");
    },
  });

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
    
    // Handle SELECT/MULTI_SELECT type changes
    if ((updates.type === "SELECT" || updates.type === "MULTI_SELECT") && !newFields[index].choices) {
      newFields[index].choices = [];
      newFields[index].rawChoices = "";
    }
    if (updates.type !== "SELECT" && updates.type !== "MULTI_SELECT") {
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

  const handleAddChoice = (index: number, choiceValue: string) => {
    if (!choiceValue.trim()) return;
    
    const newFields = [...fields];
    const currentChoices = newFields[index].choices || [];
    
    // Check if choice already exists
    if (currentChoices.includes(choiceValue.trim())) {
      toast.error(t("choice_already_exists", "This option already exists"));
      return;
    }
    
    newFields[index].choices = [...currentChoices, choiceValue.trim()];
    newFields[index].rawChoices = newFields[index].choices.join("\n");
    setFields(newFields);
  };

  const handleRemoveChoice = (index: number, choiceIndex: number) => {
    const newFields = [...fields];
    const currentChoices = newFields[index].choices || [];
    currentChoices.splice(choiceIndex, 1);
    newFields[index].choices = currentChoices;
    newFields[index].rawChoices = currentChoices.join("\n");
    setFields(newFields);
  };

  const handleSubmit = async () => {
    if (!organizationId) return;

    // Validate fields
    const invalidFields = fields.filter(
      (f) => !f.name.trim() || !f.label.trim() || ((f.type === "SELECT" || f.type === "MULTI_SELECT") && (!f.choices || f.choices.length === 0))
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
        
        if ((field.type === "SELECT" || field.type === "MULTI_SELECT") && field.choices) {
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

      // Use mutation instead of direct API call
      // This will automatically invalidate the organization query and refetch it
      await updateMutation.mutateAsync(updatedDefinitions);
    } catch (error) {
      // Error is handled by mutation's onError callback
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
                      <option value="TIME">{t("time", "Time")}</option>
                      <option value="EMAIL">{t("email", "Email")}</option>
                      <option value="PHONE">{t("phone", "Phone")}</option>
                      <option value="SELECT">{t("select", "Select")}</option>
                      <option value="MULTI_SELECT">{t("multi_select", "Multiple Choice")}</option>
                      <option value="CHECKBOX">{t("checkbox", "Checkbox")}</option>
                      <option value="ADDRESS">{t("address", "Address")}</option>
                      <option value="MONEY">{t("money", "Money")}</option>
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

                  {(field.type === "SELECT" || field.type === "MULTI_SELECT") && (
                    <div className="mt-3 space-y-3">
                      <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        {t("select_options", "Select Options")}
                      </label>
                      
                      {/* Display existing choices as chips */}
                      {field.choices && field.choices.length > 0 && (
                        <div className="flex flex-wrap gap-2 p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-200 dark:border-gray-700 min-h-[60px]">
                          {field.choices.map((choice, choiceIndex) => (
                            <div
                              key={choiceIndex}
                              className={cn(
                                "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium border transition-all hover:shadow-sm",
                                chipColors[choiceIndex % chipColors.length]
                              )}
                            >
                              <span>{choice}</span>
                              <button
                                type="button"
                                onClick={() => handleRemoveChoice(index, choiceIndex)}
                                className="ml-1 hover:bg-black/10 dark:hover:bg-white/10 rounded-full p-0.5 transition-colors"
                                aria-label={t("remove_option", "Remove option")}
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                      
                      {/* Input for adding new choices */}
                      <ChoiceInput
                        onAddChoice={(value) => handleAddChoice(index, value)}
                        placeholder={t("add_option_placeholder", "Type an option and press Enter")}
                        existingChoices={field.choices || []}
                      />
                    </div>
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
          <Button 
            onClick={handleSubmit} 
            disabled={loading || updateMutation.isPending} 
            className="flex gap-2"
          >
            <Save className="w-4 h-4" />
            {t("save", "Save")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

