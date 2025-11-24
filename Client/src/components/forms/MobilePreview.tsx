import React, { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { z } from "zod";
import DynamicForm, { FieldConfig } from "@/components/forms/DynamicForm";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Smartphone } from "lucide-react";
import { isValidIsraeliID } from "@/lib/israeliIdValidator";
import { isValidIsraeliPhone } from "@/lib/phoneUtils";

interface MobilePreviewProps {
  fields: FieldConfig[];
  formTitle?: string;
  formDescription?: string;
  backgroundColor?: string;
}

export default function MobilePreview({
  fields,
  formTitle,
  formDescription,
  backgroundColor,
}: MobilePreviewProps) {
  const { t } = useTranslation();

  // Filter out title, description, paymentSum from fields for display
  const displayFields = useMemo(() => {
    return fields.filter(
      (f) => f.name !== "title" && f.name !== "description" && f.name !== "paymentSum"
    );
  }, [fields]);

  // Create validation schema similar to external page
  const invalidPhoneMessage =
    t("invalid_phone") || "Invalid phone number. Please enter a valid Israeli phone number.";
  const invalidIdMessage =
    t("invalid_israeli_id") || "Invalid Israeli ID number.";

  const getFieldValidation = (field: FieldConfig) => {
    if (field.isRequired) {
      switch (field.type) {
        case "email":
          return z.string().email({ message: t("invalid_email") });
        case "phone":
          return z
            .string()
            .min(1, { message: t("required_field") })
            .refine((value) => isValidIsraeliPhone(value), {
              message: invalidPhoneMessage,
            });
        case "idNumber":
          return z
            .string()
            .min(1, { message: t("required_field") })
            .refine((value) => isValidIsraeliID(value), {
              message: invalidIdMessage,
            });
        case "text":
        case "date":
        case "image":
        case "file":
          return z.string().min(1, { message: t("required_field") });
        case "checkbox":
          return z
            .boolean()
            .refine((val) => val === true, { message: t("required_field") });
        case "select":
          return z.string().min(1, { message: t("required_field") });
        case "multiselect":
          return z.array(z.string()).min(1, { message: t("required_field") });
        default:
          return z.any();
      }
    } else {
      switch (field.type) {
        case "phone":
          return z
            .string()
            .optional()
            .refine(
              (value) => !value || isValidIsraeliPhone(value),
              { message: invalidPhoneMessage }
            );
        case "idNumber":
          return z
            .string()
            .optional()
            .refine(
              (value) => !value || isValidIsraeliID(value),
              { message: invalidIdMessage }
            );
        case "multiselect":
          return z.array(z.string()).optional();
        case "image":
        case "file":
          return z.string().optional();
        default:
          return z.any().optional();
      }
    }
  };

  const validationSchema = useMemo(() => {
    // Exclude visual-only fields from validation schema
    const fieldsToValidate = displayFields.filter(
      (field) => field.type !== "separator" && field.type !== "freeText"
    );
    return z.object(
      Object.fromEntries(
        fieldsToValidate.map((field) => [field.name, getFieldValidation(field)])
      )
    );
  }, [displayFields, t]);

  const handlePreviewSubmit = (data: any) => {
    // Preview mode - just show a message or do nothing
    console.log("Preview form submitted:", data);
  };

  return (
    <div className="sticky top-6 h-fit">
      <div className="relative">
        {/* Preview Badge */}
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-10">
          <Badge variant="secondary" className="gap-1.5 px-3 py-1 shadow-md">
            <Smartphone className="w-3.5 h-3.5" />
            <span className="text-xs font-medium">{t("mobile_preview") || "Mobile Preview"}</span>
          </Badge>
        </div>

        {/* iPhone Frame */}
        <div className="relative mx-auto" style={{ width: "100%", maxWidth: "375px" }}>
          {/* Outer Bezel with depth */}
          <div className="relative bg-gradient-to-b from-gray-900 via-black to-gray-900 rounded-[3rem] p-2.5 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.5)]">
            {/* Inner bezel highlight */}
            <div className="absolute inset-0.5 bg-gradient-to-b from-gray-800 to-black rounded-[2.8rem] opacity-50" />
            
            {/* Screen */}
            <div className="relative bg-white rounded-[2.5rem] overflow-hidden shadow-inner">
              {/* Notch/Dynamic Island - more realistic */}
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-7 bg-black rounded-b-3xl z-20 shadow-lg">
                {/* Speaker grille */}
                <div className="absolute top-2 left-1/2 -translate-x-1/2 w-16 h-1 bg-gray-800 rounded-full" />
              </div>
              
              {/* Screen Content */}
              <div 
                className="pt-10 pb-6 px-4 min-h-[600px] max-h-[800px] overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent"
                style={{
                  backgroundColor: backgroundColor || "#FFFFFF",
                }}
              >
                {/* Form Header Card */}
                <Card className="shadow-md border-0 mb-4 bg-white">
                  <CardHeader className="pb-4">
                    <CardTitle className="text-xl sm:text-2xl font-bold text-primary leading-tight">
                      {formTitle || t("form_title") || "Form Title"}
                    </CardTitle>
                    {formDescription && (
                      <>
                        <Separator className="my-3" />
                        <CardDescription className="text-sm text-muted-foreground leading-relaxed">
                          {formDescription}
                        </CardDescription>
                      </>
                    )}
                  </CardHeader>
                </Card>

                {/* Form Content Card */}
                {displayFields.length > 0 ? (
                  <Card className="shadow-md border-0 bg-white">
                    <CardContent className="pt-6">
                      <DynamicForm
                        mode="registration"
                        fields={displayFields}
                        validationSchema={validationSchema}
                        onSubmit={handlePreviewSubmit}
                        isPreview={true}
                      />
                    </CardContent>
                  </Card>
                ) : (
                  <Card className="shadow-md border-0 bg-white">
                    <CardContent className="pt-6">
                      <div className="text-center py-12 text-muted-foreground text-sm">
                        <div className="mb-2 opacity-50">
                          <Smartphone className="w-8 h-8 mx-auto" />
                        </div>
                        {t("no_fields_preview") || "Add fields to see preview"}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

