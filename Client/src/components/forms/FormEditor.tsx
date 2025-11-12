import React, { useState, useEffect } from "react";
import { FieldConfig } from "@/components/forms/DynamicForm";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/Input";
import { useTranslation } from "react-i18next";
import { toast } from "@/hooks/use-toast";
import {
  Trash2,
  ArrowUp,
  ArrowDown,
  Type,
  Calendar,
  Mail,
  CheckSquare,
  FileText,
  ListFilter,
  List as ListIcon,
  PenLine,
  Save,
  LayoutGrid,
  List,
  Image,
  File,
} from "lucide-react";
import FieldConfigEditor from "./FieldConfigEditor";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface Props {
  initialFields: FieldConfig[];
  onUpdate: (updatedFields: FieldConfig[]) => void;
}

const fieldTypeIcons = {
  text: Type,
  date: Calendar,
  email: Mail,
  checkbox: CheckSquare,
  terms: FileText,
  select: ListFilter,
  multiselect: ListIcon,
  signature: PenLine,
  image: Image,
  file: File,
};

export default function FormEditor({ initialFields, onUpdate }: Props) {
  const { t } = useTranslation();
  const [fields, setFields] = useState<FieldConfig[]>(initialFields);
  const [layoutMode, setLayoutMode] = useState<"grid" | "list">("list");

  // Sync fields when initialFields changes (e.g., when form loads from server)
  // Use a ref to track if this is the initial mount to avoid unnecessary updates
  const isInitialMount = React.useRef(true);
  
  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      // On initial mount, fields are already set from useState(initialFields)
      return;
    }
    // After initial mount, sync when initialFields changes (e.g., after form loads or saves)
    if (initialFields) {
      setFields(initialFields);
    }
  }, [initialFields]);

  const handleAddField = (type: string) => {
    const newField: FieldConfig = {
      name: `${type}_${Date.now()}`,
      label: `${t("new_field")}`,
      type,
      config: {},
    };
    setFields([...fields, newField]);
  };

  const handleUpdateField = (
    index: number,
    key: keyof FieldConfig,
    value: any
  ) => {
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
    [newFields[index], newFields[targetIndex]] = [
      newFields[targetIndex],
      newFields[index],
    ];
    setFields(newFields);
    toast.success(t("field_moved"), {
      description: t(`field_moved_${direction}`),
      duration: 2000,
      className: "bg-blue-100 text-blue-800 text-base",
    });
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:justify-between sm:items-center">
        <div className="flex flex-wrap gap-2">
          {Object.entries(fieldTypeIcons).map(([type, Icon]) => (
            <TooltipProvider key={type}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    onClick={() => handleAddField(type)}
                    className="flex items-center gap-2 hover:bg-primary/10 transition-colors"
                  >
                    <Icon className="w-4 h-4" />
                    <span className="hidden sm:inline">
                      {t(`add_${type}_field`)}
                    </span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{t(`add_${type}_field`)}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          ))}
        </div>
        {/* <Button
          variant="outline"
          size="icon"
          onClick={() => setLayoutMode(layoutMode === "grid" ? "list" : "grid")}
          className="hover:bg-primary/10"
        >
          {layoutMode === "grid" ? <List className="w-4 h-4" /> : <LayoutGrid className="w-4 h-4" />}
        </Button> */}
      </div>

      <div
        className={cn(
          "space-y-4",
          layoutMode === "grid" && "grid grid-cols-1 md:grid-cols-2 gap-4"
        )}
      >
        <AnimatePresence>
          {fields.map((field, index) => (
            <motion.div
              key={field.name}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.2 }}
              className="relative border rounded-lg bg-white shadow-sm hover:shadow-md transition-all group p-6"
            >
              <div className="absolute top-2 left-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => handleMoveField(index, "up")}
                        className="hover:bg-primary/10"
                      >
                        <ArrowUp className="!w-6 !h-6" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>{t("move_up")}</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => handleMoveField(index, "down")}
                        className="hover:bg-primary/10"
                      >
                        <ArrowDown className="!w-6 !h-6" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>{t("move_down")}</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => handleDeleteField(field.name)}
                        className="text-red-500 hover:text-red-600 hover:bg-red-50 transition-colors duration-200"
                      >
                        <Trash2 className="!w-6 !h-6" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>{t("delete_field")}</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">
                    {t("field_label")}
                  </label>
                  <Input
                    value={field.label}
                    onChange={(e) =>
                      handleUpdateField(index, "label", e.target.value)
                    }
                    className="w-full"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">
                    {t("field_type")}
                  </label>
                  <div className="flex items-center gap-2">
                    {React.createElement(
                      fieldTypeIcons[field.type as keyof typeof fieldTypeIcons],
                      {
                        className: "w-4 h-4",
                      }
                    )}
                    <Input value={field.type} disabled className="opacity-70" />
                  </div>
                </div>
              </div>

              <div className="mt-4">
                <FieldConfigEditor
                  field={field}
                  onChange={(updated) =>
                    setFields((prev) => {
                      const copy = [...prev];
                      copy[index] = updated;
                      return copy;
                    })
                  }
                />
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {fields.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-12 border-2 border-dashed rounded-lg bg-gray-50"
          >
            <Type className="w-12 h-12 mx-auto mb-4 text-gray-400" />
            <p className="text-gray-500 text-lg">{t("no_fields_added")}</p>
            <p className="text-sm text-gray-400 mt-2">
              {t("add_fields_instructions")}
            </p>
          </motion.div>
        )}
      </div>

      <div className="sticky bottom-4 right-0 z-50 bg-transparent px-0 py-0 flex justify-end w-full">
        <Button
          onClick={() => onUpdate(fields)}
          className="bg-primary hover:bg-primary/90 shadow-lg text-lg px-8 py-7"
          style={{ alignSelf: "flex-end" }}
        >
          <div className="flex items-center gap-2">
            {t("save_changes")}
            <Save className="!w-6 !h-6 shrink-0" />
          </div>
        </Button>
      </div>
    </div>
  );
}
