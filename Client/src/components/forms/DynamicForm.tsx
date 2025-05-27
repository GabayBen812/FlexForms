import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslation } from "react-i18next";
import { ZodObject } from "zod";
import { Input } from "@/components/ui/Input";
import FieldConfigEditor from "./FieldConfigEditor";
import SignatureCanvas from "react-signature-canvas";
import { useRef } from "react";
import { Button } from "@/components/ui/button";
import { handleImageUpload } from "@/lib/imageUtils";
import { Send, Eraser, Save } from "lucide-react";

export interface FieldConfig {
  name: string;
  label: string;
  type: string;
  config?: any;
  isRequired?: boolean;
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
  const sigCanvasRefs = useRef<Record<string, SignatureCanvas | null>>({});

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(validationSchema),
    defaultValues,
  });

  const handleSignatureSave = async (fieldName: string) => {
    if (!sigCanvasRefs.current[fieldName]) return;

    try {
      // Get the signature as a base64 string
      const dataURL = sigCanvasRefs.current[fieldName]?.toDataURL("image/png");
      if (!dataURL) {
        console.error("No signature data available");
        return;
      }

      // Set the base64 data immediately for preview
      setValue(fieldName, dataURL);

      // Try to upload to Firebase
      try {
        const signatureUrl = await handleImageUpload(
          dataURL,
          `signatures/${fieldName}`
        );
        // If upload successful, update the value with the URL
        setValue(fieldName, signatureUrl);
      } catch (error) {
        console.error(
          "Failed to upload signature to Firebase, using base64 data instead:",
          error
        );
        // Keep using the base64 data if upload fails
      }
    } catch (error) {
      console.error("Error saving signature:", error);
    }
  };

  const processSignatureFields = async (data: any) => {
    const newData = { ...data };
    const signatureFields = fields.filter((f) => f.type === "signature");

    for (const field of signatureFields) {
      const value = newData[field.name];
      if (value && typeof value === "string") {
        try {
          // If it's already a Firebase URL, keep it as is
          if (value.startsWith("https://firebasestorage.googleapis.com")) {
            continue;
          }

          // If it's base64, try to upload it
          if (value.startsWith("data:image")) {
            const url = await handleImageUpload(
              value,
              `signatures/${field.name}`
            );
            newData[field.name] = url;
          }
        } catch (error) {
          console.error(
            `Error processing signature field ${field.name}:`,
            error
          );
          // Keep the base64 data if upload fails
        }
      }
    }

    return newData;
  };

  const handleFormSubmit = async (data: any) => {
    console.log("[handleFormSubmit] Raw form data:", data);
    const processedData = await processSignatureFields(data);
    console.log("[handleFormSubmit] Processed form data:", processedData);
    onSubmit(processedData);
  };

  const renderField = (field: FieldConfig) => {
    switch (field.type) {
      case "text":
      case "date":
      case "email":
        return (
          <Input
            type={field.type}
            {...register(field.name)}
            disabled={mode !== "registration"}
            data-cy={`field-input-${field.name}`}
          />
        );
      case "select":
        return (
          <select
            {...register(field.name)}
            className="border px-2 py-1 rounded"
            disabled={mode !== "registration"}
            data-cy={`field-select-${field.name}`}
          >
            <option
              value=""
              data-cy={`field-select-option-${field.name}-empty`}
            >
              {t("select_option")}
            </option>
            {field.config?.options?.map((opt: any, i: number) => (
              <option
                key={i}
                value={opt.value}
                data-cy={`field-select-option-${field.name}-${opt.value}`}
              >
                {opt.label}
              </option>
            ))}
          </select>
        );
      case "checkbox":
        return (
          <label
            className="flex items-center gap-2"
            data-cy={`field-checkbox-label-${field.name}`}
          >
            <input
              type="checkbox"
              disabled={mode !== "registration"}
              {...register(field.name)}
              data-cy={`field-checkbox-${field.name}`}
            />
            {t(field.label)}
          </label>
        );
      case "signature":
        return (
          <div data-cy={`field-signature-container-${field.name}`}>
            {mode === "create" ? (
              <img
                alt="signature"
                className="border rounded bg-white w-[300px] h-[150px] object-contain"
                data-cy={`field-signature-preview-${field.name}`}
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
                    sigCanvasRefs.current[field.name] = ref;
                  }}
                  onEnd={() => {
                    handleSignatureSave(field.name);
                  }}
                  data-cy={`field-signature-canvas-${field.name}`}
                />

                <Button
                  variant="outline"
                  type="button"
                  onClick={() => {
                    sigCanvasRefs.current[field.name]?.clear();
                    setValue(field.name, "");
                  }}
                  className="mt-2"
                  data-cy={`field-signature-clear-${field.name}`}
                >
                  {t("clear_signature")}
                </Button>
              </>
            )}
          </div>
        );
      case "terms":
        return (
          <div data-cy={`field-terms-container-${field.name}`}>
            <div
              className="text-sm bg-gray-100 p-2 rounded whitespace-pre-line"
              data-cy={`field-terms-text-${field.name}`}
            >
              {field.config?.text || ""}
            </div>
            <label
              className="flex items-center gap-2 mt-2"
              data-cy={`field-terms-label-${field.name}`}
            >
              <input
                type="checkbox"
                {...register(field.name)}
                data-cy={`field-terms-checkbox-${field.name}`}
              />
              {t("i_agree")}
            </label>
          </div>
        );
      case "multiselect":
        return (
          <div className="space-y-2">
            <div className="flex flex-wrap gap-2">
              {field.config?.options?.map((opt: any) => (
                <label
                  key={opt.value}
                  className="flex items-center gap-2 bg-gray-100 px-3 py-1.5 rounded-full text-sm hover:bg-gray-200 cursor-pointer group"
                  data-cy={`field-multiselect-option-${field.name}-${opt.value}`}
                >
                  <input
                    type="checkbox"
                    value={opt.value}
                    {...register(field.name)}
                    className="rounded border-gray-300 focus:ring-primary"
                    disabled={mode !== "registration"}
                  />
                  <span className="group-hover:text-primary transition-colors">
                    {opt.label}
                  </span>
                </label>
              ))}
            </div>
            {errors[field.name] && (
              <p
                className="text-red-500 text-sm"
                data-cy={`field-error-${field.name}`}
              >
                {errors[field.name]?.message as string}
              </p>
            )}
          </div>
        );
      default:
        return (
          <Input
            {...register(field.name)}
            data-cy={`field-input-${field.name}`}
          />
        );
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
    <form
      onSubmit={handleSubmit(handleFormSubmit)}
      className="flex flex-col gap-6"
      data-cy="registration-form"
    >
      <h2 className="text-lg font-bold" data-cy="form-title">
        {mode === "registration"
          ? ""
          : mode === "edit"
          ? t("editing_x", { x: t(headerKey) })
          : t("add_x", { x: t(headerKey) })}
      </h2>


      <div
        className="grid grid-cols-2 gap-4 border-b pb-4"
        data-cy="form-header-fields"
      >
        {fields
          .filter((f) => f.name === "title" || f.name === "description" || f.name === "paymentSum")
          .map((field) => (
            <div
              key={field.name}
              className="flex flex-col"
              data-cy={`form-header-field-${field.name}`}
            >
              <label
                className="text-sm font-medium"
                data-cy={`form-header-label-${field.name}`}
              >
                {t(field.label)}
              </label>
              <Input 
                type={field.name === "paymentSum" ? "number" : "text"} 
                {...register(field.name)} 
                data-cy={`form-header-input-${field.name}`}
              />
            </div>
          ))}

      </div>


      {fields.map((field, i) => {
        if (field.name === "title" || field.name === "description" || field.name === "paymentSum") return null;

        return (
          <div
            key={field.name}
            className={`border p-4 rounded bg-gray-50 ${
              errors[field.name] ? "border-red-500" : ""
            }`}
            data-cy={`field-container-${field.name}`}
          >
            {mode !== "registration" ? (
              <div data-cy={`field-editor-${field.name}`}>
                <label
                  className="text-sm font-medium"
                  data-cy={`field-editor-label-${field.name}`}
                >
                  {t("field_label")}
                </label>
                <Input
                  value={field.label}
                  placeholder={`${t("field_label_placeholder")}`}
                  onChange={(e) => handleLabelChange(i, e.target.value)}
                  data-cy={`field-editor-input-${field.name}`}
                />
              </div>
            ) : (
              <div>
                <label
                  className="text-sm font-medium"
                  data-cy={`field-label-${field.name}`}
                >
                  {field.label}{" "}
                  {field.isRequired && <span className="text-red-500">*</span>}
                </label>
              </div>
            )}

            <div
              className="mt-3"
              data-cy={`field-input-container-${field.name}`}
            >
              {field.type === "text" ||
              field.type === "date" ||
              field.type === "email" ? (
                <Input
                  type={field.type}
                  {...register(field.name)}
                  disabled={mode !== "registration"}
                  data-cy={`field-input-${field.name}`}
                />
              ) : field.type === "select" ? (
                <select
                  {...register(field.name)}
                  className="border px-2 py-1 rounded"
                  disabled={mode !== "registration"}
                  data-cy={`field-select-${field.name}`}
                >
                  <option
                    value=""
                    data-cy={`field-select-option-${field.name}-empty`}
                  >
                    {t("select_option")}
                  </option>
                  {field.config?.options?.map((opt: any, i: number) => (
                    <option
                      key={i}
                      value={opt.value}
                      data-cy={`field-select-option-${field.name}-${opt.value}`}
                    >
                      {opt.label}
                    </option>
                  ))}
                </select>
              ) : field.type === "checkbox" ? (
                <label
                  className="flex items-center gap-2"
                  data-cy={`field-checkbox-label-${field.name}`}
                >
                  <input
                    type="checkbox"
                    disabled={mode !== "registration"}
                    {...register(field.name)}
                    data-cy={`field-checkbox-${field.name}`}
                  />
                  {t(field.label)}
                </label>
              ) : field.type === "signature" ? (
                <div data-cy={`field-signature-container-${field.name}`}>
                  {mode === "create" ? (
                    <img
                      alt="signature"
                      className="border rounded bg-white w-[300px] h-[150px] object-contain"
                      data-cy={`field-signature-preview-${field.name}`}
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
                          sigCanvasRefs.current[field.name] = ref;
                        }}
                        onEnd={() => {
                          handleSignatureSave(field.name);
                        }}
                        data-cy={`field-signature-canvas-${field.name}`}
                      />

                      <Button
                        variant="outline"
                        type="button"
                        onClick={() => {
                          sigCanvasRefs.current[field.name]?.clear();
                          setValue(field.name, "");
                        }}
                        className="mt-2"
                        data-cy={`field-signature-clear-${field.name}`}
                      >
                        <div className="flex items-center gap-2">
                          {t("clear_signature")}
                          <Eraser className="w-4 h-4" />
                        </div>
                      </Button>
                    </>
                  )}
                </div>
              ) : field.type === "terms" ? (
                <div data-cy={`field-terms-container-${field.name}`}>
                  <div
                    className="text-sm bg-gray-100 p-2 rounded whitespace-pre-line"
                    data-cy={`field-terms-text-${field.name}`}
                  >
                    {field.config?.text || ""}
                  </div>
                  <label
                    className="flex items-center gap-2 mt-2"
                    data-cy={`field-terms-label-${field.name}`}
                  >
                    <input
                      type="checkbox"
                      {...register(field.name)}
                      data-cy={`field-terms-checkbox-${field.name}`}
                    />
                    {t("i_agree")}
                  </label>
                </div>
              ) : field.type === "multiselect" ? (
                <div className="space-y-2">
                  <div className="flex flex-wrap gap-2">
                    {field.config?.options?.map((opt: any) => (
                      <label
                        key={opt.value}
                        className="flex items-center gap-2 bg-gray-100 px-3 py-1.5 rounded-full text-sm hover:bg-gray-200 cursor-pointer group"
                        data-cy={`field-multiselect-option-${field.name}-${opt.value}`}
                      >
                        <input
                          type="checkbox"
                          value={opt.value}
                          {...register(field.name)}
                          className="rounded border-gray-300 focus:ring-primary"
                          disabled={mode !== "registration"}
                        />
                        <span className="group-hover:text-primary transition-colors">
                          {opt.label}
                        </span>
                      </label>
                    ))}
                  </div>
                  {errors[field.name] && (
                    <p
                      className="text-red-500 text-sm"
                      data-cy={`field-error-${field.name}`}
                    >
                      {errors[field.name]?.message as string}
                    </p>
                  )}
                </div>
              ) : (
                <Input
                  {...register(field.name)}
                  data-cy={`field-input-${field.name}`}
                />
              )}
            </div>
          </div>
        );
      })}
    </form>
  );
}
