import React, { useState, useMemo } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Kid } from '@/types/kids/kid';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Upload, Loader2, Mail } from 'lucide-react';
import { handleImageUpload, uploadFile } from '@/lib/imageUtils';
import { isValidIsraeliID } from '@/lib/israeliIdValidator';
import { IdNumberInput } from '@/components/ui/id-number-input';
import { DateInput } from '@/components/ui/date-input';
import { PhoneInput } from '@/components/ui/phone-input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { useQuery } from '@tanstack/react-query';
import { fetchOrganization } from '@/api/organizations';
import { getDynamicFieldDefinitions, normalizeDynamicFieldChoices, type DynamicFieldDefinition } from '@/utils/tableFieldUtils';
import { namespaceDynamicFields, denamespaceDynamicFields } from '@/utils/contacts/dynamicFieldNamespaces';
import { Separator } from '@/components/ui/separator';

interface Props {
  initialValues?: Partial<Kid>;
  onSubmit: (data: any) => void;
  onBack?: () => void;
  isLoading?: boolean;
  organizationId?: string;
}

// Helper function to create dynamic schema from field definitions
function createDynamicSchema(fieldDefinitions: Record<string, DynamicFieldDefinition>) {
  const dynamicFields: Record<string, z.ZodTypeAny> = {};
  
  Object.entries(fieldDefinitions).forEach(([fieldName, definition]) => {
    let fieldSchema: z.ZodTypeAny;
    
    switch (definition.type) {
      case 'TEXT':
      case 'EMAIL':
      case 'PHONE':
      case 'ADDRESS':
      case 'LINK':
        fieldSchema = z.string();
        break;
      case 'NUMBER':
      case 'MONEY':
        fieldSchema = z.union([z.number(), z.string().transform((val) => {
          const num = parseFloat(val);
          return isNaN(num) ? val : num;
        })]);
        break;
      case 'DATE':
      case 'TIME':
        fieldSchema = z.string();
        break;
      case 'SELECT':
        fieldSchema = z.string();
        break;
      case 'MULTI_SELECT':
        fieldSchema = z.array(z.string()).or(z.string().transform((val) => {
          if (typeof val === 'string' && val.trim() === '') return [];
          return [val];
        }));
        break;
      case 'CHECKBOX':
        fieldSchema = z.boolean();
        break;
      case 'IMAGE':
      case 'FILE':
        fieldSchema = z.string();
        break;
      default:
        fieldSchema = z.string();
    }
    
    if (definition.required) {
      if (definition.type === 'CHECKBOX') {
        // For checkbox, required means it must be true
        fieldSchema = z.boolean().refine((val) => val === true, {
          message: `${definition.label} הוא שדה חובה`,
        });
      } else if (definition.type === 'MULTI_SELECT') {
        fieldSchema = z.array(z.string()).min(1, {
          message: `${definition.label} הוא שדה חובה`,
        });
      } else if (definition.type === 'NUMBER' || definition.type === 'MONEY') {
        fieldSchema = z.number().min(0, {
          message: `${definition.label} הוא שדה חובה`,
        });
      } else {
        fieldSchema = (fieldSchema as z.ZodString).min(1, {
          message: `${definition.label} הוא שדה חובה`,
        });
      }
    } else {
      fieldSchema = fieldSchema.optional();
    }
    
    dynamicFields[fieldName] = fieldSchema;
  });
  
  return z.object(dynamicFields);
}

// Helper function to convert DynamicFieldDefinition to FieldConfig format
function convertToFieldConfig(fieldName: string, definition: DynamicFieldDefinition) {
  let type: string;
  
  switch (definition.type) {
    case 'TEXT':
    case 'ADDRESS':
    case 'LINK':
      type = 'text';
      break;
    case 'SELECT':
      type = 'select';
      break;
    case 'MULTI_SELECT':
      type = 'multiselect';
      break;
    case 'DATE':
      type = 'date';
      break;
    case 'NUMBER':
    case 'MONEY':
      type = 'number';
      break;
    case 'EMAIL':
      type = 'email';
      break;
    case 'PHONE':
      type = 'phone';
      break;
    case 'CHECKBOX':
      type = 'checkbox';
      break;
    case 'IMAGE':
      type = 'image';
      break;
    case 'FILE':
      type = 'file';
      break;
    case 'TIME':
      type = 'text'; // Time can be handled as text for now
      break;
    default:
      type = 'text';
  }
  
  const choices = normalizeDynamicFieldChoices(definition.choices);
  
  return {
    name: fieldName,
    label: definition.label,
    type,
    isRequired: definition.required || false,
    config: choices.length > 0 ? { options: choices } : undefined,
    defaultValue: definition.defaultValue,
  };
}

export default function KidDetailsForm({ initialValues, onSubmit, onBack, isLoading, organizationId }: Props) {
  const [uploadingImage, setUploadingImage] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | undefined>(initialValues?.profileImageUrl);
  const [uploadingFields, setUploadingFields] = useState<Record<string, boolean>>({});
  
  // Fetch organization to get dynamic field definitions
  const { data: organizationData } = useQuery({
    queryKey: ['organization', organizationId],
    queryFn: () => fetchOrganization(),
    enabled: !!organizationId,
  });
  
  const organization = organizationData?.data || null;
  
  // Get kid dynamic field definitions
  const kidDynamicFieldDefinitions = useMemo(
    () => getDynamicFieldDefinitions(organization, 'kids'),
    [organization]
  );
  
  // Get dynamic field order
  const dynamicFieldOrder = useMemo(() => {
    const config = organization?.tableFieldDefinitions?.kids;
    const definedKeys = Object.keys(kidDynamicFieldDefinitions);
    
    if (!config?.fieldOrder || config.fieldOrder.length === 0) {
      return definedKeys;
    }
    
    const ordered: string[] = [];
    const seen = new Set<string>();
    
    (config.fieldOrder || []).forEach((fieldName: string) => {
      if (kidDynamicFieldDefinitions[fieldName]) {
        ordered.push(fieldName);
        seen.add(fieldName);
      }
    });
    
    definedKeys.forEach((fieldName) => {
      if (!seen.has(fieldName)) {
        ordered.push(fieldName);
      }
    });
    
    return ordered;
  }, [organization, kidDynamicFieldDefinitions]);
  
  // Convert dynamic field definitions to FieldConfig format
  const dynamicFieldConfigs = useMemo(() => {
    return dynamicFieldOrder.map((fieldName) =>
      convertToFieldConfig(fieldName, kidDynamicFieldDefinitions[fieldName])
    );
  }, [dynamicFieldOrder, kidDynamicFieldDefinitions]);
  
  // Create base schema
  const baseSchema = z.object({
    firstname: z.string().min(1, { message: 'שם פרטי הוא שדה חובה' }),
    lastname: z.string().min(1, { message: 'שם משפחה הוא שדה חובה' }),
    idNumber: z.string().min(1, { message: 'תעודת זהות היא שדה חובה' }).refine(
      (val) => isValidIsraeliID(val),
      { message: 'תעודת זהות לא תקינה' }
    ),
    birthDate: z.string().min(1, { message: 'תאריך לידה הוא שדה חובה' }),
    gender: z.enum(['זכר', 'נקבה', '']).optional(),
    address: z.string().optional(),
    profileImageUrl: z.string().min(1, { message: 'תמונה היא שדה חובה' }),
  });
  
  // Create dynamic schema and merge with base schema
  const dynamicSchema = useMemo(() => {
    if (Object.keys(kidDynamicFieldDefinitions).length === 0) {
      return baseSchema;
    }
    return baseSchema.merge(createDynamicSchema(kidDynamicFieldDefinitions));
  }, [kidDynamicFieldDefinitions]);
  
  type KidFormData = z.infer<typeof dynamicSchema>;
  
  // Denamespace initial dynamic fields
  const denamespacedDynamicFields = useMemo(() => {
    if (!initialValues?.dynamicFields) return {};
    return denamespaceDynamicFields(initialValues.dynamicFields as Record<string, unknown>, 'kid') || {};
  }, [initialValues?.dynamicFields]);
  
  // Prepare default values including dynamic fields
  const defaultValues = useMemo(() => {
    const baseDefaults = {
      firstname: initialValues?.firstname || '',
      lastname: initialValues?.lastname || '',
      idNumber: initialValues?.idNumber || '',
      birthDate: initialValues?.birthDate || '',
      gender: (initialValues?.gender as any) || '',
      address: initialValues?.address || '',
      profileImageUrl: initialValues?.profileImageUrl || '',
    };
    
    // Add dynamic field defaults
    const dynamicDefaults: Record<string, any> = {};
    dynamicFieldConfigs.forEach((field) => {
      const denamespacedValue = denamespacedDynamicFields[field.name];
      if (denamespacedValue !== undefined) {
        dynamicDefaults[field.name] = denamespacedValue;
      } else if (field.defaultValue !== undefined) {
        dynamicDefaults[field.name] = field.defaultValue;
      } else {
        dynamicDefaults[field.name] = field.type === 'checkbox' ? false : field.type === 'multiselect' ? [] : '';
      }
    });
    
    return { ...baseDefaults, ...dynamicDefaults };
  }, [initialValues, dynamicFieldConfigs, denamespacedDynamicFields]);

  const {
    register,
    handleSubmit,
    setValue,
    control,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<KidFormData>({
    resolver: zodResolver(dynamicSchema),
    defaultValues,
  });

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert('אנא בחר קובץ תמונה בלבד');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('גודל הקובץ חייב להיות קטן מ-5MB');
      return;
    }

    try {
      setUploadingImage(true);
      
      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);

      // Upload to Supabase - use the correct bucket path format
      const timestamp = Date.now();
      const fileName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
      const uploadedUrl = await handleImageUpload(file, `uploads/kids/${timestamp}_${fileName}`);
      setValue('profileImageUrl', uploadedUrl);
    } catch (error) {
      console.error('Error uploading image:', error);
      alert('שגיאה בהעלאת התמונה. אנא נסה שוב.');
      setImagePreview(undefined);
    } finally {
      setUploadingImage(false);
    }
  };

  const handleFileUpload = async (fieldName: string, file: File, fieldType: 'image' | 'file') => {
    if (!file) return;
    
    setUploadingFields((prev) => ({ ...prev, [fieldName]: true }));
    
    try {
      const timestamp = Date.now();
      const uuid = crypto.randomUUID();
      const fileExtension = file.name.split('.').pop() || '';
      const fileName = `${timestamp}_${uuid}${fileExtension ? '.' + fileExtension : ''}`;
      const path = `uploads/kids/dynamic-fields/${fieldName}/${fileName}`;
      
      const fileUrl = await uploadFile(file, path);
      setValue(fieldName as any, fileUrl);
    } catch (error) {
      console.error(`Error uploading ${fieldType}:`, error);
      setValue(fieldName as any, '');
      alert(`שגיאה בהעלאת ${fieldType === 'image' ? 'תמונה' : 'קובץ'}. אנא נסה שוב.`);
    } finally {
      setUploadingFields((prev) => ({ ...prev, [fieldName]: false }));
    }
  };
  
  const handleFormSubmit = (data: KidFormData) => {
    // Extract dynamic fields
    const dynamicFields: Record<string, any> = {};
    dynamicFieldConfigs.forEach((field) => {
      const value = data[field.name as keyof KidFormData];
      if (value !== undefined && value !== null && value !== '') {
        dynamicFields[field.name] = value;
      }
    });
    
    // Namespace dynamic fields
    const namespacedDynamicFields = Object.keys(dynamicFields).length > 0
      ? namespaceDynamicFields(dynamicFields, 'kid')
      : undefined;
    
    // Prepare submission data
    const submissionData = {
      ...data,
      dynamicFields: namespacedDynamicFields,
    };
    
    onSubmit(submissionData);
  };
  
  // Render dynamic field
  const renderDynamicField = (field: ReturnType<typeof convertToFieldConfig>) => {
    switch (field.type) {
      case 'text':
      case 'email':
        return field.type === 'email' ? (
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none z-10" />
            <Input
              type="email"
              placeholder="דוא״ל"
              {...register(field.name as any)}
              className="pl-10 text-blue-600"
              dir="ltr"
              lang="en"
              autoComplete="email"
              onKeyDown={(e) => {
                if (/[\u0590-\u05FF]/.test(e.key)) {
                  e.preventDefault();
                }
              }}
            />
          </div>
        ) : (
          <Input
            type="text"
            {...register(field.name as any)}
            placeholder={`הכנס ${field.label}`}
          />
        );
      
      case 'phone':
        return (
          <Controller
            name={field.name as any}
            control={control}
            render={({ field: formField }) => (
              <PhoneInput
                value={formField.value || ''}
                onChange={formField.onChange}
                onBlur={formField.onBlur}
                name={formField.name}
                required={field.isRequired}
              />
            )}
          />
        );
      
      case 'date':
        return (
          <Controller
            name={field.name as any}
            control={control}
            render={({ field: formField }) => (
              <DateInput
                value={formField.value || ''}
                onChange={formField.onChange}
                onBlur={formField.onBlur}
                name={formField.name}
              />
            )}
          />
        );
      
      case 'number':
        return (
          <Input
            type="number"
            {...register(field.name as any, { valueAsNumber: true })}
            placeholder={`הכנס ${field.label}`}
          />
        );
      
      case 'select':
        return (
          <Controller
            name={field.name as any}
            control={control}
            defaultValue=""
            render={({ field: formField }) => {
              const selectValue = formField.value === '' ? undefined : formField.value;
              return (
                <Select
                  value={selectValue}
                  onValueChange={(value) => {
                    formField.onChange(value === undefined ? '' : value);
                  }}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="בחר אפשרות" />
                  </SelectTrigger>
                  <SelectContent>
                    {field.config?.options?.map((opt: any, i: number) => (
                      <SelectItem key={i} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              );
            }}
          />
        );
      
      case 'multiselect':
        return (
          <div className="space-y-2">
            <div className="flex flex-wrap gap-2">
              {field.config?.options?.map((opt: any) => {
                const fieldValue = watch(field.name as any) || [];
                const isChecked = Array.isArray(fieldValue) && fieldValue.includes(opt.value);
                return (
                  <label
                    key={opt.value}
                    className="flex items-center gap-2 bg-gray-100 px-3 py-1.5 rounded-full text-sm hover:bg-gray-200 cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={(e) => {
                        const currentValue = watch(field.name as any) || [];
                        const newValue = Array.isArray(currentValue) ? [...currentValue] : [];
                        if (e.target.checked) {
                          if (!newValue.includes(opt.value)) {
                            newValue.push(opt.value);
                          }
                        } else {
                          const index = newValue.indexOf(opt.value);
                          if (index > -1) {
                            newValue.splice(index, 1);
                          }
                        }
                        setValue(field.name as any, newValue);
                      }}
                      className="rounded border-gray-300 focus:ring-primary"
                    />
                    <span>{opt.label}</span>
                  </label>
                );
              })}
            </div>
          </div>
        );
      
      case 'checkbox':
        return (
          <div className="flex items-center space-x-2 space-x-reverse">
            <Controller
              name={field.name as any}
              control={control}
              render={({ field: formField }) => (
                <Checkbox
                  checked={formField.value || false}
                  onCheckedChange={formField.onChange}
                />
              )}
            />
            <Label className="text-sm font-normal">{field.label}</Label>
          </div>
        );
      
      case 'image':
      case 'file':
        const fieldValue = watch(field.name as any) || '';
        const isUploading = uploadingFields[field.name];
        return (
          <div className="space-y-2">
            {fieldValue && (
              <div className="relative">
                {field.type === 'image' ? (
                  <img
                    src={fieldValue}
                    alt={field.label}
                    className="w-full h-32 object-cover rounded border"
                  />
                ) : (
                  <div className="flex items-center gap-2 p-2 border rounded">
                    <span className="text-sm">{fieldValue}</span>
                  </div>
                )}
              </div>
            )}
            <div className="flex items-center gap-2">
              <input
                type="file"
                accept={field.type === 'image' ? 'image/*' : '*'}
                className="hidden"
                id={`dynamic-${field.name}`}
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          handleFileUpload(field.name, file, field.type as 'image' | 'file');
                        }
                      }}
                disabled={isUploading}
              />
              <Label
                htmlFor={`dynamic-${field.name}`}
                className="cursor-pointer inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors text-sm"
              >
                {isUploading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    מעלה...
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4" />
                    {fieldValue ? 'החלף' : 'העלה'} {field.type === 'image' ? 'תמונה' : 'קובץ'}
                  </>
                )}
              </Label>
            </div>
          </div>
        );
      
      default:
        return (
          <Input
            type="text"
            {...register(field.name as any)}
            placeholder={`הכנס ${field.label}`}
          />
        );
    }
  };

  return (
    <Card className="shadow-lg border-0">
      <CardContent className="pt-6">
        <form 
          onSubmit={handleSubmit(handleFormSubmit)} 
          className="space-y-6"
          onKeyDown={(e) => {
            if (e.key === 'Enter' && (e.target as HTMLElement).tagName !== 'BUTTON') {
              e.preventDefault();
              handleSubmit(handleFormSubmit)();
            }
          }}
        >
          {/* Profile Image Upload */}
          <div className="flex flex-col items-center gap-3">
            <div className="relative">
              <Avatar className="w-32 h-32 border-2 border-border shadow-sm">
                {imagePreview ? (
                  <AvatarImage src={imagePreview} alt="תמונת פרופיל" />
                ) : (
                  <AvatarFallback className="bg-muted text-muted-foreground text-4xl">
                    {initialValues?.firstname?.charAt(0) || '👤'}
                  </AvatarFallback>
                )}
              </Avatar>
              {uploadingImage && (
                <div className="absolute inset-0 flex items-center justify-center bg-background/80 rounded-full">
                  <Loader2 className="w-6 h-6 animate-spin text-primary" />
                </div>
              )}
            </div>
            
            <div className="flex flex-col items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => document.getElementById('profile-image')?.click()}
                disabled={uploadingImage}
                className="gap-2"
              >
                {uploadingImage ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>מעלה תמונה...</span>
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4" />
                    <span>{imagePreview ? 'החלף תמונה' : 'העלה תמונה'}</span>
                  </>
                )}
              </Button>
              <input
                id="profile-image"
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleImageChange}
                disabled={uploadingImage}
              />
              <p className="text-xs text-muted-foreground text-center">יש להעלות תמונת פנים</p>
            </div>
            {errors.profileImageUrl && (
              <p className="text-sm text-destructive text-center">{String(errors.profileImageUrl.message || '')}</p>
            )}
          </div>

          {/* Name Fields */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="firstname">שם פרטי *</Label>
              <Input
                id="firstname"
                {...register('firstname')}
                placeholder="הכנס שם פרטי"
              />
              {errors.firstname && (
                <p className="text-sm text-red-500">{String(errors.firstname.message || '')}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="lastname">שם משפחה *</Label>
              <Input
                id="lastname"
                {...register('lastname')}
                placeholder="הכנס שם משפחה"
              />
              {errors.lastname && (
                <p className="text-sm text-red-500">{String(errors.lastname.message || '')}</p>
              )}
            </div>
          </div>

          {/* ID Number */}
          <div className="space-y-2">
            <Label htmlFor="idNumber">תעודת זהות *</Label>
            <Controller
              name="idNumber"
              control={control}
              render={({ field }) => (
                <IdNumberInput
                  value={field.value}
                  onChange={field.onChange}
                  onBlur={field.onBlur}
                  name="idNumber"
                  required
                />
              )}
            />
            {errors.idNumber && (
              <p className="text-sm text-red-500">{String(errors.idNumber.message || '')}</p>
            )}
          </div>

          {/* Birth Date */}
          <div className="space-y-2">
            <Label htmlFor="birthDate">תאריך לידה *</Label>
            <Controller
              name="birthDate"
              control={control}
              render={({ field }) => (
                <DateInput
                  value={field.value}
                  onChange={field.onChange}
                  onBlur={field.onBlur}
                  name="birthDate"
                />
              )}
            />
            {errors.birthDate && (
              <p className="text-sm text-red-500">{String(errors.birthDate.message || '')}</p>
            )}
          </div>

          {/* Gender */}
          <div className="space-y-2">
            <Label>מגדר</Label>
            <Controller
              name="gender"
              control={control}
              render={({ field }) => (
                <RadioGroup
                  value={field.value || ''}
                  onValueChange={field.onChange}
                  className="grid grid-cols-2 gap-3"
                >
                  {[
                    { 
                      value: 'זכר', 
                      label: 'זכר', 
                      selectedColor: 'border-blue-500 bg-blue-50',
                      iconColor: 'text-blue-600',
                      textColor: 'text-blue-700',
                      symbol: '♂'
                    },
                    { 
                      value: 'נקבה', 
                      label: 'נקבה', 
                      selectedColor: 'border-pink-500 bg-pink-50',
                      iconColor: 'text-pink-600',
                      textColor: 'text-pink-700',
                      symbol: '♀'
                    },
                  ].map((option) => {
                    const isSelected = field.value === option.value;
                    return (
                      <label
                        key={option.value}
                        htmlFor={`gender-${option.value}`}
                        className={`relative flex flex-col items-center justify-center gap-2 p-5 rounded-xl border-2 cursor-pointer transition-all ${
                          isSelected
                            ? `${option.selectedColor} shadow-md scale-[1.02]`
                            : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                        }`}
                      >
                        <RadioGroupItem
                          value={option.value}
                          id={`gender-${option.value}`}
                          className="absolute top-2 right-2"
                        />
                        <span
                          className={`text-4xl font-normal ${
                            isSelected ? option.iconColor : 'text-gray-400'
                          }`}
                        >
                          {option.symbol}
                        </span>
                        <span
                          className={`text-base font-semibold ${
                            isSelected ? option.textColor : 'text-gray-700'
                          }`}
                        >
                          {option.label}
                        </span>
                      </label>
                    );
                  })}
                </RadioGroup>
              )}
            />
            {errors.gender && (
              <p className="text-sm text-red-500">{String(errors.gender.message || '')}</p>
            )}
          </div>

          {/* Address */}
          <div className="space-y-2">
            <Label htmlFor="address">כתובת</Label>
            <Input
              id="address"
              {...register('address')}
              placeholder="הכנס כתובת"
            />
            {errors.address && (
              <p className="text-sm text-red-500">{String(errors.address.message || '')}</p>
            )}
          </div>

          {/* Dynamic Fields Section */}
          {dynamicFieldConfigs.length > 0 && (
            <>
              <Separator className="my-6" />
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">שדות דינאמיים</h3>
                {dynamicFieldConfigs.map((field) => (
                  <div key={field.name} className="space-y-2">
                    <Label htmlFor={field.name}>
                      {field.label}
                      {field.isRequired && <span className="text-red-500"> *</span>}
                    </Label>
                    {renderDynamicField(field)}
                    {errors[field.name as keyof typeof errors] && (
                      <p className="text-sm text-red-500">
                        {String(errors[field.name as keyof typeof errors]?.message || '')}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </>
          )}

          {/* Action Buttons */}
          <div className="flex flex-col-reverse sm:flex-row gap-3 pt-4">
            {onBack && (
              <Button
                type="button"
                variant="outline"
                onClick={onBack}
                disabled={isSubmitting || isLoading}
                className="flex-1"
              >
                חזור
              </Button>
            )}
            <Button
              type="submit"
              disabled={isSubmitting || isLoading || uploadingImage}
              className="flex-1"
            >
              {isSubmitting || isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin ml-2" />
                  שומר...
                </>
              ) : (
                'המשך לטופס ההרשמה'
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

