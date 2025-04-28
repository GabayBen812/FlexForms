import { useEffect, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { ChevronDown, UploadCloud } from "lucide-react";
import { useTranslation } from "react-i18next";
import { ZodObject } from "zod";
import LanguageInput from "@/components/miscellaneous/LanguageInput";
import { Input } from "@/components/ui/Input";
import { DropdownMenu } from "@/components/ui/dropdown-menu";
import {
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

type LanguageValue = { [lang: string]: string };

type FieldType =
  | "text"
  | "email"
  | "language"
  | "image"
  | "select"
  | "autocomplete"
  | "checkbox"
  | "custom";

export interface FieldConfig {
  name: string;
  label: string;
  type: FieldType;
  options?: { label: string; value: string }[]; // for select
  customRender?: (fieldProps: any) => React.ReactNode;
}

interface DynamicFormProps {
  mode: "create" | "edit";
  fields: FieldConfig[];
  defaultValues?: any;
  validationSchema: ZodObject<any>;
  onSubmit: (data: any) => void;
  headerKey?: string;
  extraButtons?: React.ReactNode;
}

const DynamicForm: React.FC<DynamicFormProps> = ({
  mode,
  fields,
  defaultValues,
  validationSchema,
  onSubmit,
  headerKey = "",
  extraButtons,
}) => {
  const { t } = useTranslation();
  const [preview, setPreview] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    control,
    reset,

    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(validationSchema),
    defaultValues,
  });

  useEffect(() => {
    if (defaultValues) {
      reset(defaultValues);
    }
  }, [defaultValues, reset]);

  const imageField = fields.find((f) => f.type === "image");
  const imageFieldName = imageField?.name;
  const watchedImageFile = watch(imageFieldName || "");
  useEffect(() => {
    if (watchedImageFile instanceof File) {
      setPreview(URL.createObjectURL(watchedImageFile));
    } else if (typeof watchedImageFile === "string") {
      setPreview(watchedImageFile);
    }
  }, [watchedImageFile]);

  const renderField = (field: FieldConfig) => {
    const error = errors[field.name];

    switch (field.type) {
      case "text":
      case "email":
        return (
          <div key={field.name} className="flex flex-col gap-1 ">
            <label>{t(field.label)}</label>
            <Input
              type={field.type}
              {...register(field.name)}
              defaultValue={defaultValues?.[field.name]}
            />
            {error && (
              <span className="text-red-500 text-sm">
                {error.message as string}
              </span>
            )}
          </div>
        );
      case "checkbox":
        return (
          <div key={field.name} className="flex items-center gap-2">
            <input
              type="checkbox"
              {...register(field.name)}
              defaultChecked={defaultValues?.[field.name]}
              className="w-4 h-4"
            />
            <label className="text-sm">{t(field.label)}</label>
            {error && (
              <span className="text-red-500 text-sm">
                {error.message as string}
              </span>
            )}
          </div>
        );

      case "language":
        return (
          <div key={field.name} className="flex flex-col gap-1 ">
            <LanguageInput
              label={field.label}
              defaultValue={defaultValues?.[field.name]} // pass initial value
              onLanguageValuesChange={(val: LanguageValue) => {
                setValue(field.name, val);
              }}
            />
            {error && (
              <span className="text-red-500 text-sm">
                {error.message as string}
              </span>
            )}
          </div>
        );

      case "image":
        return (
          <div
            key={field.name}
            className="flex flex-col items-start gap-2 h-full"
          >
            <label>{t(field.label)}</label>
            <label
              htmlFor="picture-upload"
              className="w-32 h-32 flex items-center justify-center border-2 border-dashed rounded-lg cursor-pointer relative overflow-hidden bg-white"
            >
              {preview ? (
                <img
                  src={preview}
                  alt="Preview"
                  className=" h-full object-cover rounded-lg"
                />
              ) : (
                <UploadCloud className="w-10 h-10 text-gray-500" />
              )}
            </label>
            <input
              id="picture-upload"
              type="file"
              className="hidden"
              onChange={(e) => {
                if (e.target.files?.[0]) {
                  setValue(field.name, e.target.files[0]);
                }
              }}
            />
            {error && (
              <span className="text-red-500 text-sm">
                {error.message as string}
              </span>
            )}
          </div>
        );

      case "autocomplete":
        return (
          <div
            key={field.name}
            className="flex flex-col gap-1 min-w-[200px] relative"
          >
            <Controller
              name={field.name}
              control={control}
              defaultValue=""
              render={({ field: controllerField }) => {
                const selectedOption = field.options?.find(
                  (opt) => opt.value === controllerField.value
                );

                return (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Input
                        className="cursor-pointer"
                        value={
                          selectedOption
                            ? selectedOption.label
                            : t("select_option")
                        }
                        readOnly
                        label={field.label}
                        iconEnd={<ChevronDown className="w-4 h-4" />}
                      />
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="w-[--radix-dropdown-menu-trigger-width]">
                      <DropdownMenuLabel>
                        {t("select_option")}
                      </DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      {field.options?.map((opt) => (
                        <DropdownMenuItem
                          key={opt.value}
                          onSelect={() => controllerField.onChange(opt.value)}
                        >
                          {opt.label}
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>
                );
              }}
            />
            {error && (
              <span className="text-red-500 text-sm">
                {error.message as string}
              </span>
            )}
          </div>
        );

      case "custom":
        return field.customRender ? (
          <div key={field.name} className="">
            {field.customRender({ register, setValue, error })}
          </div>
        ) : null;

      default:
        return null;
    }
  };

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="flex flex-col gap-4 bg-white px-8 py-6 rounded-lg"
    >
      <h2 className="text-base font-semibold text-accent rtl:text-right ltr:text-left">
        {mode === "edit"
          ? t("editing_x", { x: t(headerKey) })
          : t("add_x", { x: t(headerKey) })}
      </h2>

      <div className="flex gap-6 flex-wrap">
        {/* Image Section */}
        <div className="h-full">
          {fields.find((f) => f.type === "image") &&
            renderField(fields.find((f) => f.type === "image")!)}
        </div>
        <div className="h-full">
          {fields.find((f) => f.type === "language") &&
            renderField(fields.find((f) => f.type === "language")!)}
        </div>
        {/* Other Fields */}
        <div className="flex gap-6 flex-wrap flex-1">
          {fields
            .filter((f) => f.type !== "image" && f.type !== "language")
            .map((field) => renderField(field))}
        </div>
      </div>

      <div className="flex gap-4 justify-end mt-4">
        {extraButtons}
        <Button loading={isSubmitting} type="submit">
          {mode === "edit" ? t("save_changes") : t("create")}
        </Button>
      </div>
    </form>
  );
};

export default DynamicForm;
