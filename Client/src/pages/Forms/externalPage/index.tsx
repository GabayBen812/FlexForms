import { useParams, useNavigate } from "react-router-dom";
import { useEffect, useState, useMemo } from "react";
import { Helmet } from "react-helmet-async";
import { createApiService } from "@/api/utils/apiFactory";
import { Form } from "@/types/forms/Form";
import { Kid } from "@/types/kids/kid";
import { UserRegistration } from "@/types/forms/UserRegistration";
import { useTranslation } from "react-i18next";
import { z } from "zod";
import axios from "axios";
import { createPaymentSession } from '@/api/services/paymentService';
import { findKidByIdNumber, createKidPublic } from "@/api/kids";
import DynamicForm, { FieldConfig } from "@/components/forms/DynamicForm";
import KidDetailsForm from "@/components/forms/KidDetailsForm";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { IdNumberInput } from "@/components/ui/id-number-input";
import { PageLoader } from "@/components/ui/page-loader";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { Separator } from "@/components/ui/separator";
import { AlertCircle, CheckCircle2, ArrowRight, CheckCircle } from "lucide-react";
import { isValidIsraeliID } from "@/lib/israeliIdValidator";
import { isValidIsraeliPhone, unformatPhoneNumber } from "@/lib/phoneUtils";

const formsApi = createApiService<Form>("/forms", {
  customRoutes: {
    fetch: (code: string) => ({
      url: "/forms/find-by-code",
      params: { code },
    }),
  },
});

const registrationApi = createApiService<UserRegistration>("/registrations");

type Step = 1 | 2 | 3;

export default function FormRegistration() {
  const { t } = useTranslation();
  const { code } = useParams<{ code: string }>();
  const navigate = useNavigate();
  
  // Form and status state
  const [form, setForm] = useState<Form | null>(null);
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle");
  const [showPayment, setShowPayment] = useState(false);
  const [iframeUrl, setIframeUrl] = useState<string | undefined | null>('');
  
  // Multi-step state
  const [step, setStep] = useState<Step>(1);
  const [kidIdNumber, setKidIdNumber] = useState('');
  const [searchingKid, setSearchingKid] = useState(false);
  const [existingKid, setExistingKid] = useState<Kid | null>(null);
  const [createdKidId, setCreatedKidId] = useState<string | null>(null);
  const [idError, setIdError] = useState('');

  useEffect(() => {
    if (code) {
      formsApi.fetch(code).then((res) => {
        if (res.data) {
          setForm(res.data);
          // If saveContactsToDatabase is false, skip kid identification
          if (res.data.saveContactsToDatabase === false) {
            setStep(3);
          }
        }
      });
    }
  }, [code]);

  const dynamicFields: FieldConfig[] = useMemo(() => {
    if (!form) {
      return [];
    }

    return [
      ...(form.fields || [])
        .filter((f): f is FieldConfig => !!f.name && !!f.label)
        .map((f) => ({
          name: f.name,
          label: f.label,
          type: f.type || "text",
          config: f.config,
          isRequired: f.isRequired ?? false,
        })),
    ];
  }, [form]);

  const fieldDefinitionsByName = useMemo(
    () =>
      dynamicFields.reduce<Record<string, FieldConfig>>((acc, field) => {
        acc[field.name] = field;
        return acc;
      }, {}),
    [dynamicFields]
  );

  const normalizeFieldValue = (
    field: FieldConfig | undefined,
    value: any
  ): any => {
    if (!field) {
      return value;
    }

    if (typeof value === "string") {
      if (field.type === "phone") {
        return unformatPhoneNumber(value);
      }
      if (field.type === "idNumber") {
        return value.trim();
      }
    }

    return value;
  };

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
        case "radio":
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

  const validationSchema = useMemo(
    () =>
      z.object(
        Object.fromEntries(
          dynamicFields
            .filter((field) => field.type !== "separator" && field.type !== "freeText")
            .map((field) => [field.name, getFieldValidation(field)])
        )
      ),
    [dynamicFields, invalidIdMessage, invalidPhoneMessage, t]
  );

  // Handle organization details
  const organization = typeof form?.organizationId === 'object' 
    ? form.organizationId 
    : null;
  const organizationIdString = typeof form?.organizationId === 'string' 
    ? form.organizationId 
    : (organization?._id || '');
  
  const logoUrl = organization?.logo 
    ? (organization.logo.startsWith('http') 
        ? organization.logo 
        : (typeof window !== 'undefined' 
            ? `${window.location.origin}${organization.logo.startsWith('/') ? '' : '/'}${organization.logo}`
            : organization.logo))
    : null;

  // Step 1: ID Entry
  const isIdValid = kidIdNumber.trim() && isValidIsraeliID(kidIdNumber);
  
  const handleIdSubmit = async () => {
    setIdError('');
    
    if (!kidIdNumber.trim()) {
      setIdError('אנא הכנס מספר תעודת זהות');
      return;
    }

    if (!isValidIsraeliID(kidIdNumber)) {
      setIdError('מספר תעודת זהות לא תקין');
      return;
    }

    setSearchingKid(true);
    try {
      const result = await findKidByIdNumber(kidIdNumber, organizationIdString);
      if (result.data) {
        setExistingKid(result.data);
      } else {
        setExistingKid(null);
      }
      setStep(2);
    } catch (error) {
      console.error('Error searching for kid:', error);
      setIdError('שגיאה בחיפוש הילד. אנא נסה שוב.');
    } finally {
      setSearchingKid(false);
    }
  };

  // Step 2: Kid Details or Recognition
  const handleKidFormSubmit = async (kidData: any) => {
    try {
      // Check if kid exists before creating (duplicate prevention)
      const existingCheck = await findKidByIdNumber(kidData.idNumber, organizationIdString);
      
      if (existingCheck.data) {
        // Kid was created in the meantime, use existing
        const kidId = existingCheck.data._id || existingCheck.data.id || '';
        setCreatedKidId(kidId);
      } else {
        // Create new kid
        const newKid = await createKidPublic({
          ...kidData,
          organizationId: organizationIdString,
        });
        const kidId = newKid._id || newKid.id || '';
        setCreatedKidId(kidId);
      }
      
      setStep(3);
    } catch (error) {
      console.error('Error creating kid:', error);
      alert('שגיאה ביצירת פרטי הילד. אנא נסה שוב.');
    }
  };

  const handleExistingKidContinue = () => {
    const kidId = existingKid?._id || existingKid?.id || '';
    setCreatedKidId(kidId);
    setStep(3);
  };

  // Step 3: Form Registration
  const handleFormSubmit = async (data: any) => {
    try {
      // Build additionalData with ALL dynamic fields
      const additionalData: Record<string, any> = {};
      
      const dynamicFieldNames = dynamicFields
        .filter(f => f.name !== "title" && f.name !== "description" && f.name !== "paymentSum")
        .map(f => f.name);
      
      // Validate signature fields
      const signatureFields = dynamicFields.filter(f => f.type === "signature");
      for (const field of signatureFields) {
        const value = data[field.name];
        if (value && typeof value === "string") {
          if (value.startsWith("data:image")) {
            throw new Error(
              t("signature_not_uploaded", "חתימה לא הועלתה. אנא נסה שוב.")
            );
          }
          if (!value.startsWith("http://") && !value.startsWith("https://")) {
            throw new Error(
              t("invalid_signature_url", "כתובת חתימה לא תקינה. אנא נסה שוב.")
            );
          }
        }
      }
      
      // Add all dynamic fields to additionalData
      dynamicFieldNames.forEach((fieldName) => {
        const value = data[fieldName];
        if (value !== undefined) {
          const fieldDefinition = fieldDefinitionsByName[fieldName];
          const normalizedValue = normalizeFieldValue(fieldDefinition, value);
          additionalData[fieldName] =
            normalizedValue === "" ? null : normalizedValue;
        }
      });
      
      // Build formData
      const formData: any = {
        formId: form!._id,
        organizationId: organizationIdString,
        additionalData,
      };

      // Add kidId if we have one
      if (createdKidId) {
        formData.kidId = createdKidId;
      }
      
      // Only add fullName, email, phone as top-level fields if they're NOT dynamic fields
      if (!dynamicFieldNames.includes("fullName") && data.fullName !== undefined) {
        formData.fullName = data.fullName || undefined;
      }
      
      if (!dynamicFieldNames.includes("email") && data.email !== undefined) {
        formData.email = data.email || undefined;
      }
      
      if (!dynamicFieldNames.includes("phone") && data.phone !== undefined) {
        const normalizedPhone = unformatPhoneNumber(data.phone);
        formData.phone = normalizedPhone ? normalizedPhone : undefined;
      }
      
      if (form!.paymentSum) {
        const paymentData = await createPaymentSession({ 
          amount: form!.paymentSum, 
          description: form!.title, 
          dataString: JSON.stringify(formData) 
        });
        const urlData = (await axios.post(paymentData.iframeUrl)).data;
        const params = new URLSearchParams(urlData);
        const url = params.get("url");
        setIframeUrl(url);
        setShowPayment(true);
      } else {
        await registrationApi.create(formData);
        setStatus("success");
        setTimeout(() => {
          navigate(`/activity/${code}/registration/success`);
        }, 1500);
      }
    } catch (err) {
      console.error('Registration error:', err);
      setStatus("error");
    }
  };

  if (!form) {
    return <PageLoader />;
  }

  const pageUrl = typeof window !== "undefined" ? window.location.href : "";

  return (
    <>
      <Helmet>
        <title>{form.title}</title>
        {form.description && <meta name="description" content={form.description} />}
        <meta property="og:title" content={form.title} />
        {form.description && <meta property="og:description" content={form.description} />}
        <meta property="og:url" content={pageUrl} />
        <meta property="og:type" content="website" />
        {logoUrl && (
          <>
            <meta property="og:image" content={logoUrl} />
            <meta property="og:image:width" content="1200" />
            <meta property="og:image:height" content="630" />
            <meta property="og:image:type" content="image/png" />
          </>
        )}
        <meta name="twitter:card" content={logoUrl ? "summary_large_image" : "summary"} />
        <meta name="twitter:title" content={form.title} />
        {form.description && <meta name="twitter:description" content={form.description} />}
        {logoUrl && <meta name="twitter:image" content={logoUrl} />}
      </Helmet>
      <div 
        className="min-h-screen py-6 sm:py-8 px-4 sm:px-6 lg:px-8"
        style={{
          backgroundColor: form.backgroundColor || "#FFFFFF",
        }}
      >
        <div className="max-w-3xl mx-auto space-y-6">
          {/* Organization Logo */}
          {logoUrl && (
            <div className="flex justify-center mb-6 sm:mb-8">
              <div className="relative bg-white rounded-2xl shadow-lg p-4 sm:p-6 border border-gray-100">
                <img 
                  src={logoUrl} 
                  alt={organization?.name || 'Organization logo'}
                  className="w-48 h-48 sm:w-40 sm:h-40 md:w-48 md:h-48 object-contain"
                />
              </div>
            </div>
          )}
          
          {/* Form Header Card */}
          <Card className="shadow-lg border-0">
            <CardHeader className="pb-4">
              <CardTitle className="text-2xl sm:text-3xl font-bold text-primary leading-tight">
                {form.title}
              </CardTitle>
              {form.description && (
                <>
                  <Separator className="my-4" />
                  <CardDescription className="text-base text-muted-foreground leading-relaxed">
                    {form.description}
                  </CardDescription>
                </>
              )}
            </CardHeader>
          </Card>

          {/* Multi-Step Content */}
          {!showPayment && form.saveContactsToDatabase !== false ? (
            <>
              {/* Step 1: ID Entry */}
              {step === 1 && (
                <Card className="shadow-lg border-0">
                  <CardContent className="pt-6 space-y-6">
                    <div className="text-center space-y-2">
                      <h3 className="text-xl font-semibold">זיהוי הילד</h3>
                      <p className="text-sm text-muted-foreground">
                        אנא הכנס את מספר תעודת הזהות של הילד
                      </p>
                    </div>

                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="kid-id" className="text-center block">ת"ז של הילד</Label>
                        <div onKeyDown={(e) => {
                          if (e.key === 'Enter' && !searchingKid) {
                            e.preventDefault();
                            handleIdSubmit();
                          }
                        }}>
                          <IdNumberInput
                            value={kidIdNumber}
                            onChange={setKidIdNumber}
                            name="kid-id"
                            required
                          />
                        </div>
                        {idError && (
                          <p className="text-sm text-red-500 text-center">{idError}</p>
                        )}
                      </div>

                      <Button
                        onClick={handleIdSubmit}
                        disabled={searchingKid || !isIdValid}
                        className="w-full"
                        size="lg"
                      >
                        {searchingKid ? (
                          <>
                            <LoadingSpinner size="sm" className="ml-2" />
                            מחפש...
                          </>
                        ) : (
                          <>
                            המשך
                            <ArrowRight className="w-4 h-4 mr-2" />
                          </>
                        )}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Step 2a: Existing Kid Recognition */}
              {step === 2 && existingKid && (
                <Card className="shadow-lg border-0">
                  <CardContent className="pt-6 space-y-6">
                    <div className="flex items-center justify-center text-green-600 space-x-2 space-x-reverse">
                      <CheckCircle className="w-6 h-6" />
                      <h3 className="text-xl font-semibold">המערכת זיהתה את הילד!</h3>
                    </div>

                    <div className="flex flex-col items-center space-y-4 py-4">
                      <Avatar className="w-32 h-32 border-4 border-green-200">
                        {existingKid.profileImageUrl ? (
                          <AvatarImage src={existingKid.profileImageUrl} alt={`${existingKid.firstname} ${existingKid.lastname}`} />
                        ) : (
                          <AvatarFallback className="bg-green-100 text-green-700 text-4xl">
                            {existingKid.firstname?.charAt(0)}{existingKid.lastname?.charAt(0)}
                          </AvatarFallback>
                        )}
                      </Avatar>
                      <div className="text-center">
                        <p className="text-2xl font-bold">
                          {existingKid.firstname} {existingKid.lastname}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          ת"ז: {existingKid.idNumber}
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-col-reverse sm:flex-row gap-3">
                      <Button
                        variant="outline"
                        onClick={() => setStep(1)}
                        className="flex-1"
                      >
                        חזור
                      </Button>
                      <Button
                        onClick={handleExistingKidContinue}
                        className="flex-1"
                      >
                        המשך לטופס ההרשמה
                        <ArrowRight className="w-4 h-4 mr-2" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Step 2b: New Kid Details Form */}
              {step === 2 && !existingKid && (
                <>
                  <Card className="shadow-lg border-0 bg-blue-50 border-blue-200">
                    <CardContent className="pt-6">
                      <div className="flex items-center space-x-2 space-x-reverse text-blue-700">
                        <AlertCircle className="w-5 h-5" />
                        <p className="text-sm font-medium">
                          הילד לא נמצא במערכת. אנא מלא את פרטי הילד כדי להמשיך.
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                  <KidDetailsForm
                    initialValues={{ idNumber: kidIdNumber }}
                    onSubmit={handleKidFormSubmit}
                    onBack={() => setStep(1)}
                    organizationId={organizationIdString}
                  />
                </>
              )}

              {/* Step 3: Form Registration */}
              {step === 3 && (
                <Card className="shadow-lg border-0">
                  <CardContent className="pt-6">
                    <DynamicForm
                      mode="registration"
                      fields={dynamicFields}
                      validationSchema={validationSchema}
                      onSubmit={handleFormSubmit}
                      extraButtons={
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => setStep(existingKid ? 2 : 2)}
                          className="w-full sm:w-auto"
                        >
                          חזור
                        </Button>
                      }
                    />
                  </CardContent>
                </Card>
              )}
            </>
          ) : !showPayment ? (
            /* Direct form (no kid identification) */
            <Card className="shadow-lg border-0">
              <CardContent className="pt-6">
                <DynamicForm
                  mode="registration"
                  fields={dynamicFields}
                  validationSchema={validationSchema}
                  onSubmit={handleFormSubmit}
                />
              </CardContent>
            </Card>
          ) : (
            /* Payment Step */
            <Card className="shadow-lg border-0">
              <CardHeader>
                <CardTitle className="text-xl sm:text-2xl font-semibold">
                  {t("payment_required")}
                </CardTitle>
                <CardDescription>
                  {t("complete_payment_to_finish", "אנא השלם את התשלום כדי לסיים את הרישום")}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {iframeUrl ? (
                  <div className="w-full rounded-lg overflow-hidden border bg-white">
                    <iframe
                      src={iframeUrl}
                      className="w-full h-[500px] sm:h-[600px] border-0"
                      frameBorder="0"
                      allowTransparency={true}
                      title={t("payment_iframe", "תשלום")}
                    />
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-[400px]">
                    <LoadingSpinner size="lg" />
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Status Messages */}
          {status === "success" && (
            <Card className="shadow-lg border-green-200 bg-green-50">
              <CardContent className="pt-6">
                <div className="flex items-center gap-3 text-green-700">
                  <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
                  <p className="font-medium">{t("registration_success")}</p>
                </div>
              </CardContent>
            </Card>
          )}
          {status === "error" && (
            <Card className="shadow-lg border-red-200 bg-red-50">
              <CardContent className="pt-6">
                <div className="flex items-center gap-3 text-red-700">
                  <AlertCircle className="w-5 h-5 flex-shrink-0" />
                  <p className="font-medium">{t("registration_fail")}</p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </>
  );
}
