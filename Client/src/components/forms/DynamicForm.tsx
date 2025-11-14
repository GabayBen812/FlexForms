import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslation } from "react-i18next";
import { ZodObject } from "zod";
import { Input } from "@/components/ui/Input";
import { DateInput } from "@/components/ui/date-input";
import FieldConfigEditor from "./FieldConfigEditor";
import SignatureCanvas from "react-signature-canvas";
import { useRef, useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { uploadFile } from "@/lib/imageUtils";
import { Send, Eraser, Save, X, Download, File as FileIcon, Image as ImageIcon } from "lucide-react";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { toast } from "@/hooks/use-toast";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

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
  isPreview?: boolean;
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
  isPreview = false,
}: Props) {
  const { t } = useTranslation();
  const sigCanvasRefs = useRef<Record<string, SignatureCanvas | null>>({});
  const [uploadingFields, setUploadingFields] = useState<Record<string, boolean>>({});
  const blobUrlRefs = useRef<Record<string, string>>({});

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    control,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(validationSchema),
    defaultValues,
  });

  // Watch all form values for real-time validation
  const formValues = watch();

  // Cleanup blob URLs on component unmount
  useEffect(() => {
    return () => {
      Object.values(blobUrlRefs.current).forEach((blobUrl) => {
        URL.revokeObjectURL(blobUrl);
      });
      blobUrlRefs.current = {};
    };
  }, []);

  // Function to check if a field value is empty based on field type
  const isFieldEmpty = (field: FieldConfig, value: any): boolean => {
    if (value === null || value === undefined) return true;
    
    switch (field.type) {
      case "text":
      case "date":
      case "email":
      case "select":
      case "signature":
      case "image":
      case "file":
        return value === "";
      case "checkbox":
      case "terms":
        return value === false;
      case "multiselect":
        return !Array.isArray(value) || value.length === 0;
      default:
        return value === "";
    }
  };

  // Get missing required fields
  const getMissingRequiredFields = (): FieldConfig[] => {
    return fields.filter((field) => {
      if (!field.isRequired) return false;
      const value = formValues[field.name];
      return isFieldEmpty(field, value);
    });
  };

  const missingRequiredFields = getMissingRequiredFields();

  const handleSignatureSave = async (fieldName: string) => {
    if (!sigCanvasRefs.current[fieldName]) return;

    // Get the signature as a base64 string
    const dataURL = sigCanvasRefs.current[fieldName]?.toDataURL("image/png");
    if (!dataURL) {
      console.error("No signature data available");
      return;
    }

    setUploadingFields((prev) => ({ ...prev, [fieldName]: true }));

    try {
      // Convert data URL to File/Blob (same pattern as uploadImage)
      const response = await fetch(dataURL);
      const blob = await response.blob();
      const fileFromBlob = new File([blob], "signature.png", { type: "image/png" });

      // Generate unique path (same bucket as files/images: "uploads")
      const timestamp = Date.now();
      const uuid = crypto.randomUUID();
      const fileName = `${timestamp}_${uuid}.png`;
      const path = `uploads/signatures/${fieldName}/${fileName}`;

      // Upload to Supabase
      const signatureUrl = await uploadFile(fileFromBlob, path);
      
      // Only set URL after successful upload
      setValue(fieldName, signatureUrl);
    } catch (error) {
      console.error("Error uploading signature to Supabase:", error);
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error("Signature upload error details:", {
        fieldName,
        error: errorMessage,
        errorType: error instanceof Error ? error.constructor.name : typeof error,
      });
      
      // Show error message
      const displayMessage = t("error_uploading_signature", "שגיאה בהעלאת חתימה");
      
      toast.error(displayMessage);
      // Don't throw - let user try again. Validation in index.tsx will catch base64 on submit.
    } finally {
      setUploadingFields((prev) => ({ ...prev, [fieldName]: false }));
    }
  };

  const processSignatureFields = async (data: any) => {
    const newData = { ...data };
    const signatureFields = fields.filter((f) => f.type === "signature");

    for (const field of signatureFields) {
      const value = newData[field.name];
      if (value && typeof value === "string") {
        // If it's already a Supabase URL, keep it as is
        if (value.includes("supabase.co")) {
          continue;
        }

        // If it's base64, upload it to Supabase (strict mode - no fallback)
        if (value.startsWith("data:image")) {
          try {
            // Convert data URL to File/Blob (same pattern as uploadImage)
            const response = await fetch(value);
            const blob = await response.blob();
            const fileFromBlob = new File([blob], "signature.png", { type: "image/png" });

            // Generate unique path (same bucket as files/images: "uploads")
            const timestamp = Date.now();
            const uuid = crypto.randomUUID();
            const fileName = `${timestamp}_${uuid}.png`;
            const path = `uploads/signatures/${field.name}/${fileName}`;

            // Upload to Supabase
            const url = await uploadFile(fileFromBlob, path);
            newData[field.name] = url;
          } catch (error) {
            console.error(
              `Error processing signature field ${field.name}:`,
              error
            );
            // Strict mode - throw error instead of keeping base64
            throw new Error(
              `Failed to upload signature for field ${field.name}: ${error instanceof Error ? error.message : String(error)}`
            );
          }
        }
      }
    }

    return newData;
  };

  const handleFileUpload = async (fieldName: string, file: File, fieldType: "image" | "file") => {
    if (!file) return;

    // Create blob URL immediately for instant preview
    const blobUrl = URL.createObjectURL(file);
    blobUrlRefs.current[fieldName] = blobUrl;
    
    // Set form value optimistically with blob URL
    setValue(fieldName, blobUrl);
    setUploadingFields((prev) => ({ ...prev, [fieldName]: true }));

    try {
      const timestamp = Date.now();
      const uuid = crypto.randomUUID();
      // Get file extension from original filename
      const fileExtension = file.name.split('.').pop() || '';
      const fileName = `${timestamp}_${uuid}${fileExtension ? '.' + fileExtension : ''}`;
      const path = `uploads/form-fields/${fieldName}/${fileName}`;
      
      // Upload to Supabase in the background
      const fileUrl = await uploadFile(file, path);
      
      // Replace blob URL with Supabase URL
      setValue(fieldName, fileUrl);
      
      // Clean up blob URL
      if (blobUrlRefs.current[fieldName]) {
        URL.revokeObjectURL(blobUrlRefs.current[fieldName]);
        delete blobUrlRefs.current[fieldName];
      }
    } catch (error) {
      console.error(`Error uploading ${fieldType}:`, error);
      
      // Clear the preview on error
      setValue(fieldName, "");
      
      // Clean up blob URL
      if (blobUrlRefs.current[fieldName]) {
        URL.revokeObjectURL(blobUrlRefs.current[fieldName]);
        delete blobUrlRefs.current[fieldName];
      }
      
      toast.error(
        fieldType === "image"
          ? t("error_uploading_image", "שגיאה בהעלאת תמונה")
          : t("error_uploading_file", "שגיאה בהעלאת קובץ")
      );
    } finally {
      setUploadingFields((prev) => ({ ...prev, [fieldName]: false }));
    }
  };

  const handleFormSubmit = async (data: any) => {
    const startTime = Date.now();
    const minLoadingTime = 400; // 0.4 seconds in milliseconds
    
    const processedData = await processSignatureFields(data);
    
    // Ensure all fields are included, especially select fields
    // Convert empty strings to null for optional fields to ensure they're saved
    const cleanedData: Record<string, any> = {};
    fields.forEach((field) => {
      const value = processedData[field.name];
      if (value !== undefined) {
        // For select fields, preserve empty strings as null if not required
        if (field.type === "select" && value === "" && !field.isRequired) {
          cleanedData[field.name] = null;
        } else {
          cleanedData[field.name] = value;
        }
      }
    });
    
    // Include any other fields that might not be in the fields array
    Object.keys(processedData).forEach((key) => {
      if (!cleanedData.hasOwnProperty(key)) {
        cleanedData[key] = processedData[key];
      }
    });
    
    // Ensure minimum loading time of 0.4 seconds for better UX
    const onSubmitPromise = Promise.resolve(onSubmit(cleanedData));
    const elapsedTime = Date.now() - startTime;
    const remainingTime = Math.max(0, minLoadingTime - elapsedTime);
    const minDelayPromise = new Promise(resolve => setTimeout(resolve, remainingTime));
    
    await Promise.all([onSubmitPromise, minDelayPromise]);
  };

  const renderField = (field: FieldConfig) => {
    switch (field.type) {
      case "date":
        return (
          <Controller
            name={field.name}
            control={control}
            render={({ field: formField }) => (
              <DateInput
                value={formField.value || ""}
                onChange={(value) => {
                  formField.onChange(value);
                }}
                onBlur={formField.onBlur}
                disabled={mode !== "registration"}
                required={field.isRequired}
                name={formField.name}
                data-cy={`field-input-${field.name}`}
              />
            )}
          />
        );
      case "text":
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
            {...register(field.name, {
              valueAsNumber: false,
            })}
            className="border px-2 py-1 rounded"
            disabled={mode !== "registration"}
            data-cy={`field-select-${field.name}`}
            defaultValue=""
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
                value={opt.value || opt.label || ""}
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
          <div 
            data-cy={`field-signature-container-${field.name}`}
            className={isPreview ? "flex flex-col items-center" : ""}
          >
            {mode === "create" ? (
              <img
                alt="signature"
                className={`border rounded bg-white object-contain ${
                  isPreview ? "w-[200px] h-[100px]" : "w-[300px] h-[150px]"
                }`}
                data-cy={`field-signature-preview-${field.name}`}
              />
            ) : (
              <>
                <SignatureCanvas
                  penColor="black"
                  canvasProps={{
                    width: isPreview ? 200 : 300,
                    height: isPreview ? 100 : 150,
                    className: `border rounded bg-white ${isPreview ? "mx-auto" : ""}`,
                  }}
                  ref={(ref) => {
                    sigCanvasRefs.current[field.name] = ref;
                  }}
                  onEnd={() => {
                    if (!isPreview) {
                      handleSignatureSave(field.name);
                    }
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
                  className={`mt-2 ${isPreview ? "mx-auto" : ""}`}
                  data-cy={`field-signature-clear-${field.name}`}
                  disabled={isPreview}
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
              {field.type === "text" || field.type === "email" ? (
                <Input
                  type={field.type}
                  {...register(field.name)}
                  disabled={mode !== "registration"}
                  data-cy={`field-input-${field.name}`}
                />
              ) : field.type === "date" ? (
                // <Input
                //   type={field.type}
                //   {...register(field.name)}
                //   disabled={mode !== "registration"}
                //   data-cy={`field-input-${field.name}`}
                // />
                <Controller
                  name={field.name}
                  control={control}
                  render={({ field: formField }) => (
                    <DateInput
                      value={formField.value || ""}
                      onChange={(value) => {
                        formField.onChange(value);
                      }}
                      onBlur={formField.onBlur}
                      disabled={mode !== "registration"}
                      required={field.isRequired}
                      name={formField.name}
                      data-cy={`field-input-${field.name}`}
                    />
                  )}
                />
              ) : field.type === "select" ? (
                <Controller
                  name={field.name}
                  control={control}
                  defaultValue=""
                  render={({ field: controllerField }) => {
                    // Convert empty string to undefined for Radix Select, but keep empty string in form state
                    const selectValue = controllerField.value === "" ? undefined : controllerField.value;
                    return (
                      <Select
                        value={selectValue}
                        onValueChange={(value) => {
                          controllerField.onChange(value === undefined ? "" : value);
                        }}
                        disabled={mode !== "registration"}
                      >
                        <SelectTrigger
                          className="w-full"
                          data-cy={`field-select-${field.name}`}
                        >
                          <SelectValue placeholder={t("select_option")} />
                        </SelectTrigger>
                        <SelectContent>
                          {field.config?.options?.map((opt: any, i: number) => (
                            <SelectItem
                              key={i}
                              value={opt.value || opt.label || ""}
                              data-cy={`field-select-option-${field.name}-${opt.value}`}
                            >
                              {opt.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    );
                  }}
                />
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
                <div 
                  data-cy={`field-signature-container-${field.name}`}
                  className={isPreview ? "flex flex-col items-center" : ""}
                >
                  {mode === "create" ? (
                    <img
                      alt="signature"
                      className={`border rounded bg-white object-contain ${
                        isPreview ? "w-[200px] h-[100px]" : "w-[300px] h-[150px]"
                      }`}
                      data-cy={`field-signature-preview-${field.name}`}
                    />
                  ) : (
                    <>
                      <SignatureCanvas
                        penColor="black"
                        canvasProps={{
                          width: isPreview ? 200 : 300,
                          height: isPreview ? 100 : 150,
                          className: `border rounded bg-white ${isPreview ? "mx-auto" : ""}`,
                        }}
                        ref={(ref) => {
                          sigCanvasRefs.current[field.name] = ref;
                        }}
                        onEnd={() => {
                          if (!isPreview) {
                            handleSignatureSave(field.name);
                          }
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
                        className={`mt-2 ${isPreview ? "mx-auto" : ""}`}
                        data-cy={`field-signature-clear-${field.name}`}
                        disabled={isPreview}
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
              ) : field.type === "image" ? (
                <div data-cy={`field-image-container-${field.name}`} className="space-y-2">
                  <input
                    type="file"
                    accept="image/*"
                    disabled={mode !== "registration" || uploadingFields[field.name]}
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        handleFileUpload(field.name, file, "image");
                      }
                    }}
                    className="hidden"
                    id={`image-input-${field.name}`}
                  />
                  <input
                    type="hidden"
                    {...register(field.name)}
                  />
                  {mode === "registration" && (
                    <>
                      <label
                        htmlFor={`image-input-${field.name}`}
                        className="flex flex-col items-center justify-center border-2 border-dashed rounded-lg p-4 cursor-pointer transition-colors border-gray-300 hover:border-primary hover:bg-primary/5"
                      >
                        <ImageIcon className="w-8 h-8 text-gray-400" />
                        <span className="mt-2 text-sm text-gray-600">
                          {t("click_to_upload_image", "לחץ להעלאת תמונה")}
                        </span>
                      </label>
                      {(() => {
                        const watchValue = watch(field.name);
                        const currentValue = watchValue || defaultValues?.[field.name];
                        const isUploading = uploadingFields[field.name];
                        return currentValue ? (
                          <div className="relative border rounded-lg p-2 bg-white">
                            <img
                              src={currentValue}
                              alt={field.label}
                              className="max-w-full max-h-48 object-contain rounded"
                            />
                            {isUploading && (
                              <div className="absolute inset-0 flex items-center justify-center bg-white/80 rounded-lg">
                                <LoadingSpinner size="md" />
                              </div>
                            )}
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="absolute top-2 right-2 bg-white/80 hover:bg-red-100"
                              disabled={isUploading}
                              onClick={() => {
                                // Clean up blob URL if exists
                                if (blobUrlRefs.current[field.name]) {
                                  URL.revokeObjectURL(blobUrlRefs.current[field.name]);
                                  delete blobUrlRefs.current[field.name];
                                }
                                setValue(field.name, "");
                                const input = document.getElementById(`image-input-${field.name}`) as HTMLInputElement;
                                if (input) input.value = "";
                              }}
                            >
                              <X className="w-4 h-4 text-red-600" />
                            </Button>
                          </div>
                        ) : null;
                      })()}
                    </>
                  )}
                  {mode !== "registration" && (
                    <div className="text-sm text-gray-500 italic">
                      {t("image_field_preview", "תצוגה מקדימה של שדה תמונה")}
                    </div>
                  )}
                  {errors[field.name] && (
                    <p className="text-red-500 text-sm" data-cy={`field-error-${field.name}`}>
                      {errors[field.name]?.message as string}
                    </p>
                  )}
                </div>
              ) : field.type === "file" ? (
                <div data-cy={`field-file-container-${field.name}`} className="space-y-2">
                  <input
                    type="file"
                    accept="*/*"
                    disabled={mode !== "registration" || uploadingFields[field.name]}
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        handleFileUpload(field.name, file, "file");
                      }
                    }}
                    className="hidden"
                    id={`file-input-${field.name}`}
                  />
                  <input
                    type="hidden"
                    {...register(field.name)}
                  />
                  {mode === "registration" && (
                    <>
                      <label
                        htmlFor={`file-input-${field.name}`}
                        className="flex flex-col items-center justify-center border-2 border-dashed rounded-lg p-4 cursor-pointer transition-colors border-gray-300 hover:border-primary hover:bg-primary/5"
                      >
                        <FileIcon className="w-8 h-8 text-gray-400" />
                        <span className="mt-2 text-sm text-gray-600">
                          {t("click_to_upload_file", "לחץ להעלאת קובץ")}
                        </span>
                      </label>
                      {(() => {
                        const watchValue = watch(field.name);
                        const currentValue = watchValue || defaultValues?.[field.name];
                        const isUploading = uploadingFields[field.name];
                        return currentValue ? (
                          <div className="relative flex items-center gap-2 border rounded-lg p-3 bg-white">
                            <FileIcon className="w-5 h-5 text-gray-400" />
                            <a
                              href={currentValue}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex-1 text-sm text-primary hover:underline flex items-center gap-2"
                            >
                              <Download className="w-4 h-4" />
                              {t("download_file", "הורד קובץ")}
                            </a>
                            {isUploading && (
                              <div className="absolute inset-0 flex items-center justify-center bg-white/80 rounded-lg">
                                <LoadingSpinner size="sm" />
                              </div>
                            )}
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="hover:bg-red-100"
                              disabled={isUploading}
                              onClick={() => {
                                // Clean up blob URL if exists
                                if (blobUrlRefs.current[field.name]) {
                                  URL.revokeObjectURL(blobUrlRefs.current[field.name]);
                                  delete blobUrlRefs.current[field.name];
                                }
                                setValue(field.name, "");
                                const input = document.getElementById(`file-input-${field.name}`) as HTMLInputElement;
                                if (input) input.value = "";
                              }}
                            >
                              <X className="w-4 h-4 text-red-600" />
                            </Button>
                          </div>
                        ) : null;
                      })()}
                    </>
                  )}
                  {mode !== "registration" && (
                    <div className="text-sm text-gray-500 italic">
                      {t("file_field_preview", "תצוגה מקדימה של שדה קובץ")}
                    </div>
                  )}
                  {errors[field.name] && (
                    <p className="text-red-500 text-sm" data-cy={`field-error-${field.name}`}>
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
      <div className="flex flex-col items-center mt-6 gap-2" data-cy="form-actions">
        <div className="flex gap-2">
          {extraButtons}
          <Button 
            loading={isSubmitting} 
            type="submit" 
            data-cy="submit-button"
            variant="default"
            size="lg"
            className="text-lg px-8 min-w-[200px]"
            disabled={isPreview || missingRequiredFields.length > 0}
            onClick={isPreview ? (e) => e.preventDefault() : undefined}
            style={isPreview ? { cursor: "not-allowed", opacity: 0.6 } : undefined}
          >
            {!isSubmitting && mode === "registration" && <Send className="!w-5 !h-5 mr-2" />}
            {mode === "registration" ? t("submit_registration") : t("create")}
          </Button>
        </div>
        {missingRequiredFields.length > 0 && mode === "registration" && (
          <p className="text-sm text-red-500 mt-1" data-cy="missing-fields-message">            
            נא למלא: {missingRequiredFields.slice(0, 2).map((field) => t(field.label)).join(", ")}
          </p>
        )}
      </div>
    </form>
  );
}
