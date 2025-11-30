import React, { useState, useEffect } from "react";
import { FieldConfig } from "@/components/forms/DynamicForm";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/textarea";
import { useTranslation } from "react-i18next";
import { toast } from "@/hooks/use-toast";
import { useDebounce } from "@/hooks/useDebounce";
import {
  Trash2,
  Type,
  Calendar,
  Mail,
  CheckSquare,
  FileText,
  ListFilter,
  List as ListIcon,
  PenLine,
  Save,
  Image,
  File,
  GripVertical,
  Plus,
  ChevronDown,
  ArrowUp,
  ArrowDown,
  Minus,
  Phone,
  IdCard,
  CircleDot,
} from "lucide-react";
import FieldConfigEditor from "./FieldConfigEditor";
import MobilePreview from "./MobilePreview";
import FormBackgroundColorPicker from "./FormBackgroundColorPicker";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface Props {
  initialFields: FieldConfig[];
  onUpdate: (updatedFields: FieldConfig[]) => void | Promise<void>;
  formTitle?: string;
  formDescription?: string;
  formBackgroundColor?: string;
  onBackgroundColorChange?: (color: string) => Promise<void>;
  onDescriptionChange?: (description: string) => Promise<void>;
}

const fieldTypeIcons = {
  text: Type,
  date: Calendar,
  email: Mail,
  phone: Phone,
  idNumber: IdCard,
  checkbox: CheckSquare,
  terms: FileText,
  freeText: FileText,
  select: ListFilter,
  radio: CircleDot,
  multiselect: ListIcon,
  signature: PenLine,
  image: Image,
  file: File,
  separator: Minus,
};

type FieldType = keyof typeof fieldTypeIcons;

// Group field types by category
const fieldTypeCategories = {
  text: {
    label: "Text Fields",
    types: ["text", "email", "phone", "idNumber", "date", "freeText"] as const,
  },
  selection: {
    label: "Selection Fields",
    types: ["select", "radio", "multiselect", "checkbox"] as const,
  },
  media: {
    label: "Media & Files",
    types: ["image", "file", "signature"] as const,
  },
  other: {
    label: "Other",
    types: ["terms", "separator"] as const,
  },
};

type TranslateFn = (key: string, options?: { defaultValue?: string }) => string;

const categoryTranslationKeys: Record<
  keyof typeof fieldTypeCategories,
  string
> = {
  text: "text_fields",
  selection: "selection_fields",
  media: "media_files",
  other: "other",
};

const getCategoryLabel = (
  categoryKey: keyof typeof fieldTypeCategories,
  t: TranslateFn
) =>
  t(categoryTranslationKeys[categoryKey], {
    defaultValue: fieldTypeCategories[categoryKey].label,
  });

const getFieldTypeLabel = (type: string, t: TranslateFn) =>
  t(`field_type_${type}`, {
    defaultValue: t(`add_${type}_field`, { defaultValue: type }),
  });

const fieldTypesWithoutRequired: FieldType[] = ["separator", "freeText"];

const typeAllowsRequired = (type: FieldType) =>
  !fieldTypesWithoutRequired.includes(type);

const configCompatibilityKeys: Partial<
  Record<FieldType, "options" | "text">
> = {
  select: "options",
  radio: "options",
  multiselect: "options",
  terms: "text",
  freeText: "text",
};

const getConfigCompatibilityKey = (type: string) =>
  configCompatibilityKeys[type as FieldType];

const getDefaultConfigForType = (
  type: FieldType
): FieldConfig["config"] | undefined => {
  switch (type) {
    case "select":
    case "radio":
    case "multiselect":
      return { options: [] };
    case "terms":
    case "freeText":
      return { text: "" };
    default:
      return undefined;
  }
};

const sanitizeFieldForType = (
  field: FieldConfig,
  nextType: FieldType
): FieldConfig => {
  const currentCompatKey = getConfigCompatibilityKey(field.type);
  const nextCompatKey = getConfigCompatibilityKey(nextType);
  const shouldPreserveConfig =
    currentCompatKey && nextCompatKey && currentCompatKey === nextCompatKey;

  const nextConfig = shouldPreserveConfig
    ? field.config
    : getDefaultConfigForType(nextType);

  const updatedField: FieldConfig = {
    ...field,
    type: nextType,
    config: nextConfig,
  };

  if (!typeAllowsRequired(nextType)) {
    updatedField.isRequired = false;
  }

  return updatedField;
};

// Sortable Field Card Component
function SortableFieldCard({
  field,
  index,
  totalFields,
  onUpdate,
  onDelete,
  onMoveUp,
  onMoveDown,
  onFieldChange,
  onTypeChange,
}: {
  field: FieldConfig;
  index: number;
  totalFields: number;
  onUpdate: (index: number, key: keyof FieldConfig, value: any) => void;
  onDelete: (name: string) => void;
  onMoveUp: (index: number) => void;
  onMoveDown: (index: number) => void;
  onFieldChange: (updated: FieldConfig) => void;
  onTypeChange: (index: number, type: FieldType) => void;
}) {
  const { t } = useTranslation();
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: field.name });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const FieldIcon = fieldTypeIcons[field.type as keyof typeof fieldTypeIcons];

  return (
    <div ref={setNodeRef} style={style}>
      <Card
        className={cn(
          "relative transition-all duration-200 hover:shadow-lg",
          isDragging && "border-primary/40 shadow-xl ring-2 ring-primary/20"
        )}
      >
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <div
                {...attributes}
                {...listeners}
                className="cursor-grab active:cursor-grabbing p-1.5 hover:bg-accent/50 rounded-md transition-colors -ml-2"
              >
                <GripVertical className="w-5 h-5 text-muted-foreground" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-2">
                  <Badge variant="outline" className="gap-1.5">
                    {FieldIcon && <FieldIcon className="w-3.5 h-3.5" />}
                    <span className="capitalize">{field.type}</span>
                  </Badge>
                  {field.isRequired && (
                    <Badge variant="destructive" className="text-xs font-semibold">
                      {t("required")}
                    </Badge>
                  )}
                </div>
                <CardTitle className="text-lg font-semibold truncate">
                  {field.label || t("untitled_field")}
                </CardTitle>
              </div>
            </div>
            <div className="flex items-center gap-1">
              {/* Move Up/Down Buttons */}
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => onMoveUp(index)}
                      disabled={index === 0}
                      className="hover:bg-accent/50 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                    >
                      <ArrowUp className="w-4 h-4" />
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
                      onClick={() => onMoveDown(index)}
                      disabled={index === totalFields - 1}
                      className="hover:bg-accent/50 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                    >
                      <ArrowDown className="w-4 h-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>{t("move_down")}</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
              {/* Delete Button */}
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => onDelete(field.name)}
                      className="text-destructive hover:text-destructive hover:bg-destructive/10 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>{t("delete_field")}</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-3 sm:space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                {t("field_label")}
              </label>
              <Input
                value={field.label}
                onChange={(e) => onUpdate(index, "label", e.target.value)}
                className="w-full h-9 text-sm"
                placeholder={t("field_label_placeholder") || "Enter field label"}
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                {t("field_type")}
              </label>
              <Select
                value={field.type}
                onValueChange={(value) => onTypeChange(index, value as FieldType)}
              >
                <SelectTrigger className="h-9 text-sm bg-muted/70 focus:ring-offset-0">
                  <div className="flex items-center gap-2 w-full">
                    {FieldIcon && (
                      <FieldIcon className="w-3.5 h-3.5 text-muted-foreground" />
                    )}
                    <SelectValue placeholder={t("field_type")} />
                  </div>
                </SelectTrigger>
                <SelectContent className="max-h-[320px]">
                  {Object.entries(fieldTypeCategories).map(
                    ([categoryKey, category]) => (
                      <SelectGroup key={categoryKey}>
                        <SelectLabel className="text-xs uppercase text-muted-foreground">
                          {getCategoryLabel(
                            categoryKey as keyof typeof fieldTypeCategories,
                            t
                          )}
                        </SelectLabel>
                        {category.types.map((type) => {
                          const Icon = fieldTypeIcons[type];
                          return (
                            <SelectItem key={type} value={type} className="capitalize">
                              <div className="flex items-center gap-2">
                                {Icon && (
                                  <Icon className="w-3.5 h-3.5 text-muted-foreground" />
                                )}
                                <span>{getFieldTypeLabel(type, t)}</span>
                              </div>
                            </SelectItem>
                          );
                        })}
                      </SelectGroup>
                    )
                  )}
                </SelectContent>
              </Select>
            </div>
          </div>
          <Separator className="my-1.5 sm:my-2" />
          <FieldConfigEditor
            field={field}
            onChange={onFieldChange}
          />
        </CardContent>
      </Card>
    </div>
  );
}

export default function FormEditor({ 
  initialFields, 
  onUpdate, 
  formTitle, 
  formDescription,
  formBackgroundColor,
  onBackgroundColorChange,
  onDescriptionChange,
}: Props) {
  const { t } = useTranslation();
  const [fields, setFields] = useState<FieldConfig[]>(initialFields);
  const [addFieldOpen, setAddFieldOpen] = useState(false);
  const [description, setDescription] = useState<string>(formDescription || "");
  const [isSavingDescription, setIsSavingDescription] = useState(false);
  
  // Debounce description changes for auto-save
  const debouncedDescription = useDebounce(description, 1000);

  // Sync fields when initialFields changes (e.g., when form loads from server)
  const isInitialMount = React.useRef(true);
  const isDescriptionInitialMount = React.useRef(true);
  
  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }
    if (initialFields) {
      setFields(initialFields);
    }
  }, [initialFields]);

  // Sync description when formDescription prop changes (only if it matches the debounced value, meaning save was successful)
  useEffect(() => {
    if (formDescription !== undefined && formDescription === debouncedDescription) {
      setDescription(formDescription);
    }
  }, [formDescription, debouncedDescription]);

  // Auto-save description when debounced value changes
  useEffect(() => {
    // Skip on initial mount
    if (isDescriptionInitialMount.current) {
      isDescriptionInitialMount.current = false;
      return;
    }

    // Only save if description actually changed from the prop value and callback is provided
    if (onDescriptionChange && debouncedDescription !== formDescription) {
      setIsSavingDescription(true);
      onDescriptionChange(debouncedDescription)
        .then(() => {
          toast({
            title: t("description_saved") || "Description saved",
            variant: "default",
          });
        })
        .catch(() => {
          toast({
            title: t("error_saving_description") || "Error saving description",
            variant: "destructive",
          });
        })
        .finally(() => {
          setIsSavingDescription(false);
        });
    }
  }, [debouncedDescription, onDescriptionChange, formDescription, t]);

  // Drag and drop sensors
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleAddField = (type: string) => {
    const typedFieldType = type as FieldType;
    const defaultConfig = getDefaultConfigForType(typedFieldType);
    const newField: FieldConfig = {
      name: `${type}_${Date.now()}`,
      label: `${t("new_field")}`,
      type,
      config: defaultConfig,
    };
    if (!typeAllowsRequired(typedFieldType)) {
      newField.isRequired = false;
    }
    // Add field at the bottom (end) of the array
    setFields([...fields, newField]);
    setAddFieldOpen(false);
    
    // Show success toast
    const fieldLabel = t(`add_${type}_field`) || type;
    toast.success(
      t("field_added_successfully") || "Field added successfully",
      {
        description: `${fieldLabel} ${t("added_to_form") || "added to form"}`,
      }
    );
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

  const handleDeleteField = async (name: string) => {
    const previousFields = [...fields];
    const updatedFields = fields.filter((f) => f.name !== name);
    
    // Optimistically update UI
    setFields(updatedFields);
    
    // Auto-save after deleting field
    try {
      await onUpdate(updatedFields);
    } catch (error) {
      // Revert on error
      setFields(previousFields);
      toast({
        title: t("error_deleting_field") || "Error deleting field",
        variant: "destructive",
      });
    }
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
  };

  const handleMoveUp = (index: number) => {
    handleMoveField(index, "up");
  };

  const handleMoveDown = (index: number) => {
    handleMoveField(index, "down");
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      setFields((items) => {
        const oldIndex = items.findIndex((item) => item.name === active.id);
        const newIndex = items.findIndex((item) => item.name === over.id);
        return arrayMove(items, oldIndex, newIndex);
      });
    }
  };

  const handleChangeFieldType = (index: number, nextType: FieldType) => {
    setFields((prev) => {
      const updated = [...prev];
      const currentField = updated[index];
      if (!currentField) {
        return prev;
      }
      updated[index] = sanitizeFieldForType(currentField, nextType);
      return updated;
    });
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Left Column - Form Editor (2/3) */}
      <div className="lg:col-span-2 space-y-6 order-2 lg:order-1">
        {/* Description Editor and Background Color Picker */}
        <div className="flex flex-col sm:flex-row gap-6 items-start sm:items-center justify-center w-full">
          {/* Description Editor */}
          <div className="flex-1 w-full sm:max-w-2xl">
            <label className="text-base font-semibold text-foreground mb-3 block">
              {t("form_description") || "Form Description"}
            </label>
            <div className="relative">
              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder={t("form_description_placeholder") || "Enter form description..."}
                className="min-h-[120px] text-base leading-relaxed resize-y pr-12 py-3 px-4"
                disabled={isSavingDescription}
              />
              {isSavingDescription && (
                <div className="absolute top-3 right-3">
                  <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                </div>
              )}
            </div>
          </div>
          
          {/* Background Color Picker */}
          {onBackgroundColorChange && (
            <div className="flex items-end">
              <FormBackgroundColorPicker
                currentColor={formBackgroundColor}
                onColorChange={onBackgroundColorChange}
              />
            </div>
          )}
        </div>
        
        {/* Field Type Selection - Combobox Style */}
        <div className="flex justify-center w-full">
        <Popover open={addFieldOpen} onOpenChange={setAddFieldOpen}>
          <PopoverTrigger asChild>
            <Button
              size="lg"
              variant="outline"
              role="combobox"
              aria-expanded={addFieldOpen}
              className="w-full max-w-2xl h-14 text-base font-medium shadow-sm hover:shadow-md hover:bg-accent/50 transition-all border-2 justify-between"
            >
              <div className="flex items-center gap-2">
                <Plus className="w-5 h-5" />
                <span>{t("add_field") || "Add Field"}</span>
              </div>
              <ChevronDown className="w-5 h-5 opacity-50 shrink-0" />
            </Button>
          </PopoverTrigger>
          <PopoverContent
            className="w-[var(--radix-popover-trigger-width)] max-w-2xl p-0"
            align="center"
            sideOffset={8}
          >
            <Command className="rounded-lg">
              <CommandInput
                placeholder={t("search_field_types") || "Search field types..."}
                className="h-14 text-base"
              />
              <CommandList className="max-h-[500px]">
                <CommandEmpty className="py-8 text-center text-muted-foreground">
                  {t("no_field_types_found") || "No field types found."}
                </CommandEmpty>
                {Object.entries(fieldTypeCategories).map(
                  ([categoryKey, category], catIndex) => {
                    const translatedLabel = getCategoryLabel(
                      categoryKey as keyof typeof fieldTypeCategories,
                      t
                    );
                    return (
                      <React.Fragment key={categoryKey}>
                        {catIndex > 0 && <CommandSeparator />}
                        <CommandGroup heading={translatedLabel}>
                          {category.types.map((type) => {
                            const Icon = fieldTypeIcons[type];
                            const label = getFieldTypeLabel(type, t);
                            return (
                              <CommandItem
                                key={type}
                                value={`${translatedLabel} ${label} ${type}`}
                                onSelect={() => handleAddField(type)}
                                className="cursor-pointer py-3.5 px-4 text-base hover:bg-accent/50"
                              >
                                <div className="flex items-center gap-3 w-full">
                                  {Icon && (
                                    <Icon className="w-5 h-5 text-primary shrink-0" />
                                  )}
                                  <span className="flex-1 font-medium">
                                    {label}
                                  </span>
                                </div>
                              </CommandItem>
                            );
                          })}
                        </CommandGroup>
                      </React.Fragment>
                    );
                  }
                )}
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>
      </div>

      {/* Fields List */}
      <div className="space-y-4">
        {fields.length > 0 ? (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={fields.map((f) => f.name)}
              strategy={verticalListSortingStrategy}
            >
              <AnimatePresence>
                {fields.map((field, index) => (
                  <motion.div
                    key={field.name}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.2 }}
                  >
                    <SortableFieldCard
                      field={field}
                      index={index}
                      totalFields={fields.length}
                      onUpdate={handleUpdateField}
                      onDelete={handleDeleteField}
                      onMoveUp={handleMoveUp}
                      onMoveDown={handleMoveDown}
                      onFieldChange={(updated) => {
                        setFields((prev) => {
                          const copy = [...prev];
                          copy[index] = updated;
                          return copy;
                        });
                      }}
                      onTypeChange={handleChangeFieldType}
                    />
                  </motion.div>
                ))}
              </AnimatePresence>
            </SortableContext>
          </DndContext>
        ) : (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-16">
              <div className="rounded-full bg-muted p-4 mb-4">
                <Type className="w-8 h-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-semibold mb-2">
                {t("no_fields_added") || "No fields added yet"}
              </h3>
              <p className="text-sm text-muted-foreground text-center max-w-md">
                {t("add_fields_instructions") ||
                  "Click on the field types above to start building your form"}
              </p>
            </CardContent>
          </Card>
        )}
      </div>

        {/* Save Button */}
        {fields.length > 0 && (
          <div className="sticky bottom-6 z-50 flex justify-center">
            <Button
              onClick={() => onUpdate(fields)}
              size="lg"
              className="w-full max-w-md shadow-lg hover:shadow-xl transition-shadow"
            >
              <Save className="w-5 h-5 mr-2" />
              {t("save_changes") || "Save Changes"}
            </Button>
          </div>
        )}
      </div>

      {/* Right Column - Mobile Preview (1/3) */}
      <div className="lg:col-span-1 order-1 lg:order-2">
        <MobilePreview
          fields={fields}
          formTitle={formTitle}
          formDescription={formDescription}
          backgroundColor={formBackgroundColor}
        />
      </div>
    </div>
  );
}
