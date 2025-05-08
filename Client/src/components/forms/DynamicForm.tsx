import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslation } from "react-i18next";
import { ZodObject } from "zod";
import { Input } from "@/components/ui/Input";
import FieldConfigEditor from "./FieldConfigEditor";
import SignatureCanvas from "react-signature-canvas";
import { useRef } from "react";
import { Button } from "@/components/ui/button";

export interface FieldConfig {
  name: string;
  label: string;
  type: string;
  config?: any;
}

interface Props {
  mode: "create" | "edit" | "registration";
  headerKey?: string;
  fields: FieldConfig[];
  setFields?: React.Dispatch<React.SetStateAction<FieldConfig[]>>;
  validationSchema: ZodObject<any>;
  defaultValues?: any;
  onSubmit: (data: any) => void;
  extraButtons?: React.ReactNode;
}

export default function DynamicForm({
  mode,
  headerKey = "",
  fields,
  setFields,
  validationSchema,
  defaultValues,
  onSubmit,
  extraButtons,
}: Props) {
  const { t } = useTranslation();
  const sigCanvasRef = useRef<SignatureCanvas | null>(null);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(validationSchema),
    defaultValues,
  });

  const renderField = (field: FieldConfig) => {
    switch (field.type) {
      case "text":
      case "date":
      case "email":
        return <Input type={field.type} {...register(field.name)} disabled={mode !== "registration"} />;
      case "select":
        return (
          <select
            {...register(field.name)}
            className="border px-2 py-1 rounded"
            disabled={mode !== "registration"}
          >
            <option value="">{t("select_option")}</option>
            {field.config?.options?.map((opt: any, i: number) => (
              <option key={i} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        );
      case "checkbox":
        return (
          <label className="flex items-center gap-2">
            <input type="checkbox" disabled={mode !== "registration"} {...register(field.name)} />
            {t(field.label)}
          </label>
        );
      case "signature":
        return (
          <div>
            {mode === "create" ? (
              <img
                alt="signature"
                className="border rounded bg-white w-[300px] h-[150px] object-contain"
              />
            ) : (
              <>
                <SignatureCanvas
                  penColor="black"
                  canvasProps={{
                    width: 300,
                    height: 150,
                    className: "border rounded bg-white",
                  }}
                  ref={(ref) => {
                    sigCanvasRef.current = ref;
                    setValue(field.name, ref?.toDataURL() || "");
                  }}
                  onEnd={() => {
                    if (sigCanvasRef.current) {
                      setValue(field.name, sigCanvasRef.current.toDataURL());
                    }
                  }}
                />

                <Button
                  variant="outline"
                  type="button"
                  onClick={() => {
                    sigCanvasRef.current?.clear();
                    setValue(field.name, "");
                  }}
                  className="mt-2"
                >
                  {t("clear_signature")}
                </Button>
              </>
            )}
          </div>
        );
      case "terms":
        return (
          <div>
            <div className="text-sm bg-gray-100 p-2 rounded whitespace-pre-line">
              {field.config?.text || ""}
            </div>
            <label className="flex items-center gap-2 mt-2">
              <input type="checkbox" {...register(field.name)} />
              {t("i_agree")}
            </label>
          </div>
        );
      default:
        return <Input {...register(field.name)} />;
    }
  };

  const handleLabelChange = (index: number, value: string) => {
    if (!setFields) return;
    setFields((prev: FieldConfig[]) => {
      const copy = [...prev];
      copy[index] = { ...copy[index], label: value };
      return copy;
    });
  };

  const handleFieldConfigChange = (
    index: number,
    updatedField: FieldConfig
  ) => {
    if (!setFields) return;
    setFields((prev: FieldConfig[]) => {
      const copy = [...prev];
      copy[index] = updatedField;
      return copy;
    });
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-6">
      <h2 className="text-lg font-bold">
        {mode === "registration"
          ? t("form_registration")
          : mode === "edit"
          ? t("editing_x", { x: t(headerKey) })
          : t("add_x", { x: t(headerKey) })}
      </h2>

      <div className="grid grid-cols-2 gap-4 border-b pb-4">
        {fields
          .filter((f) => f.name === "title" || f.name === "description")
          .map((field) => (
            <div key={field.name} className="flex flex-col">
              <label className="text-sm font-medium">{t(field.label)}</label>
              <Input type="text" {...register(field.name)} />
            </div>
          ))}
      </div>

      {fields.map((field, i) => {
        if (field.name === "title" || field.name === "description") return null;

        return (
          <div key={field.name} className="border p-4 rounded bg-gray-50">
            {mode !== "registration" ? (
              <div>
                <label className="text-sm font-medium">
                  {t("field_label")}
                </label>
                <Input
                  value={field.label}
                  placeholder={`${t("field_label_placeholder")}`}
                  onChange={(e) => handleLabelChange(i, e.target.value)}
                />
              </div>
            ) : (
              <div>
              <label className="text-sm font-medium">
                {field.label}
              </label>
              </div>
            )}

            <div className="mt-3">{renderField(field)}</div>

            {mode === "create" &&
            (field.type === "checkbox" ||
              field.type === "terms" ||
              field.type === "select") ? (
              <details className="mt-3">
                <summary className="text-blue-600 cursor-pointer text-sm">
                  {t("field_settings")}
                </summary>
                <FieldConfigEditor
                  field={field}
                  onChange={(updatedField) =>
                    handleFieldConfigChange(i, updatedField)
                  }
                />
              </details>
            ) : null}
          </div>
        );
      })}

      <div className="flex justify-end mt-4 gap-2">
        {extraButtons}
        <Button loading={isSubmitting} type="submit">
          {mode === "registration" ? t("submit_registration") : t("create")}
        </Button>
      </div>
    </form>
  );
}
