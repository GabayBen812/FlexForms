import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslation } from "react-i18next";
import { ZodObject } from "zod";
import { Input } from "@/components/ui/Input";
import FieldConfigEditor from "./FieldConfigEditor";
import SignatureCanvas from "react-signature-canvas";
import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { handleImageUpload, uploadFile } from "@/lib/imageUtils";
import { Send, Eraser, Save, Upload, X, Download, File as FileIcon, Image as ImageIcon } from "lucide-react";
import { toast } from "@/hooks/use-toast";

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
  const [uploadingFields, setUploadingFields] = useState<Record<string, boolean>>({});

  const {
    register,
    handleSubmit,
    setValue,
    watch,
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

  const handleFileUpload = async (fieldName: string, file: File, fieldType: "image" | "file") => {
    if (!file) return;

    setUploadingFields((prev) => ({ ...prev, [fieldName]: true }));

    try {
      const timestamp = Date.now();
      const uuid = crypto.randomUUID();
      // Get file extension from original filename
      const fileExtension = file.name.split('.').pop() || '';
      const fileName = `${timestamp}_${uuid}${fileExtension ? '.' + fileExtension : ''}`;
      const path = `uploads/form-fields/${fieldName}/${fileName}`;
      
      const fileUrl = await uploadFile(file, path);
      setValue(fieldName, fileUrl);
      
      toast.success(
        fieldType === "image" 
          ? t("image_uploaded_successfully", "תמונה הועלתה בהצלחה")
          : t("file_uploaded_successfully", "קובץ הועלה בהצלחה")
      );
    } catch (error) {
      console.error(`Error uploading ${fieldType}:`, error);
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
    console.log("[handleFormSubmit] Raw form data:", data);
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
    
    console.log("[handleFormSubmit] Processed form data:", cleanedData);
    onSubmit(cleanedData);
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
                        className={`flex flex-col items-center justify-center border-2 border-dashed rounded-lg p-4 cursor-pointer transition-colors ${
                          uploadingFields[field.name]
                            ? "border-gray-300 bg-gray-50 opacity-50"
                            : "border-gray-300 hover:border-primary hover:bg-primary/5"
                        }`}
                      >
                        {uploadingFields[field.name] ? (
                          <>
                            <Upload className="w-8 h-8 text-gray-400 animate-pulse" />
                            <span className="mt-2 text-sm text-gray-500">
                              {t("uploading", "מעלה...")}
                            </span>
                          </>
                        ) : (
                          <>
                            <ImageIcon className="w-8 h-8 text-gray-400" />
                            <span className="mt-2 text-sm text-gray-600">
                              {t("click_to_upload_image", "לחץ להעלאת תמונה")}
                            </span>
                          </>
                        )}
                      </label>
                      {(() => {
                        const watchValue = watch(field.name);
                        const currentValue = watchValue || defaultValues?.[field.name];
                        return currentValue ? (
                          <div className="relative border rounded-lg p-2 bg-white">
                            <img
                              src={currentValue}
                              alt={field.label}
                              className="max-w-full max-h-48 object-contain rounded"
                            />
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="absolute top-2 right-2 bg-white/80 hover:bg-red-100"
                              onClick={() => {
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
                        className={`flex flex-col items-center justify-center border-2 border-dashed rounded-lg p-4 cursor-pointer transition-colors ${
                          uploadingFields[field.name]
                            ? "border-gray-300 bg-gray-50 opacity-50"
                            : "border-gray-300 hover:border-primary hover:bg-primary/5"
                        }`}
                      >
                        {uploadingFields[field.name] ? (
                          <>
                            <Upload className="w-8 h-8 text-gray-400 animate-pulse" />
                            <span className="mt-2 text-sm text-gray-500">
                              {t("uploading", "מעלה...")}
                            </span>
                          </>
                        ) : (
                          <>
                            <FileIcon className="w-8 h-8 text-gray-400" />
                            <span className="mt-2 text-sm text-gray-600">
                              {t("click_to_upload_file", "לחץ להעלאת קובץ")}
                            </span>
                          </>
                        )}
                      </label>
                      {(() => {
                        const watchValue = watch(field.name);
                        const currentValue = watchValue || defaultValues?.[field.name];
                        return currentValue ? (
                          <div className="flex items-center gap-2 border rounded-lg p-3 bg-white">
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
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="hover:bg-red-100"
                              onClick={() => {
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
            <div className="flex justify-end mt-4 gap-2" data-cy="form-actions">
        {extraButtons}
       
       <Button 
        loading={isSubmitting} 
        type="submit" 
        data-cy="submit-button"
        variant="default"
        size="lg"
        className="text-lg px-6"
       >
        {mode === "registration" && <Send className="!w-5 !h-5 mr-2" />}
        {mode === "registration" ? t("submit_registration") : t("create")}
      </Button>
      </div>
    </form>
  );
}
