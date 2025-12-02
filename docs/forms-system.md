# Forms System

This document describes the dynamic forms system in FlexForms, including form creation, field configuration, and registration management.

## Overview

FlexForms provides a dynamic form builder that allows organizations to:
- Create custom forms with various field types
- Configure form settings (payment, registration limits, deadlines)
- Publish forms for external registration
- Track registrations and submissions
- Duplicate and manage form templates

## Form Structure

### Form Schema

```typescript
interface Form {
  _id: string;
  title: string;
  description?: string;
  fields: FieldConfig[];
  organizationId: string;
  isActive: boolean;
  code: number; // Unique numeric code for public access
  paymentSum?: number;
  maxRegistrators?: number;
  registrationDeadline?: string;
  backgroundColor?: string;
  createdAt: Date;
  updatedAt: Date;
}
```

### Field Configuration

Fields are defined using `FieldConfig`:

```typescript
interface FieldConfig {
  id: string;
  type: 'text' | 'email' | 'number' | 'select' | 'date' | 'textarea' | 'checkbox';
  label: string;
  required?: boolean;
  placeholder?: string;
  options?: string[]; // For select fields
  validation?: {
    min?: number;
    max?: number;
    pattern?: string;
  };
}
```

## Form Creation

### Creating a New Form

```typescript
import { createApiService } from "@/api/utils/apiFactory";
import { Form } from "@/types/forms/Form";

const formsApi = createApiService<Form>("/forms");

const newForm = await formsApi.create({
  title: "Summer Camp Registration",
  description: "Register for our summer camp program",
  fields: [
    {
      id: "name",
      type: "text",
      label: "Full Name",
      required: true
    },
    {
      id: "email",
      type: "email",
      label: "Email Address",
      required: true
    },
    {
      id: "age",
      type: "number",
      label: "Age",
      required: true,
      validation: { min: 5, max: 18 }
    }
  ],
  paymentSum: 500,
  maxRegistrators: 50,
  registrationDeadline: "2024-06-01"
});
```

### Form Code Generation

Forms automatically receive a unique numeric `code` when created. This code is used for public form access:

```
https://yourapp.com/form/{code}
```

The code is generated server-side to ensure uniqueness.

## Form Management

### Listing Forms

```typescript
const { data: forms } = useQuery({
  queryKey: ["forms"],
  queryFn: async () => {
    const response = await formsApi.fetchAll({
      page: 1,
      pageSize: 10,
      sortField: "createdAt",
      sortDirection: "desc"
    });
    return response.data || [];
  }
});
```

### Updating Forms

```typescript
const updateForm = useMutation({
  mutationFn: (data: Partial<Form>) => 
    formsApi.update(formId, data),
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ["forms"] });
  }
});

await updateForm.mutateAsync({
  title: "Updated Title",
  isActive: false
});
```

### Duplicating Forms

```typescript
const handleDuplicate = async (form: Form) => {
  const { _id, code, createdAt, updatedAt, ...formData } = form;
  
  const duplicated = await formsApi.create({
    ...formData,
    title: `${form.title} - Copy`
  });
  
  // Form is duplicated with a new code
};
```

### Deleting Forms

```typescript
await formsApi.delete(formId);
// Or delete multiple
await formsApi.deleteMany([formId1, formId2]);
```

## Form Settings

### Payment Configuration

Forms can include payment requirements:

```typescript
{
  paymentSum: 500, // Amount in currency units
  // Payment is processed when form is submitted
}
```

### Registration Limits

Control how many people can register:

```typescript
{
  maxRegistrators: 50, // Maximum number of registrations
  registrationDeadline: "2024-06-01" // ISO date string
}
```

### Form Activation

Control form visibility:

```typescript
{
  isActive: true // Form is accessible for registration
}
```

## Public Form Access

### External Registration Page

Forms are accessible via their unique code:

```
/form/{code}
```

The external registration page:
- Displays form fields dynamically
- Validates input client-side
- Submits registration data
- Handles payment if required
- Shows success/error messages

### Form Registration Flow

1. User visits `/form/{code}`
2. Form data is fetched using the code
3. User fills out the form
4. Form is validated
5. Registration is submitted
6. Payment is processed (if required)
7. Success page is shown

## Registration Management

### Fetching Registrations

```typescript
// Registrations are linked to forms via formId
const registrations = await registrationApi.fetchAll({
  formId: formId
});
```

### Registration Data Structure

```typescript
interface Registration {
  _id: string;
  formId: string;
  formCode: number;
  data: Record<string, any>; // Field values from form submission
  organizationId: string;
  paymentStatus?: 'pending' | 'completed' | 'failed';
  createdAt: Date;
}
```

## Form Builder UI

### Creating Forms in the UI

The form builder (`Client/src/pages/Forms/createPage/`) provides:
- Drag-and-drop field addition
- Field configuration (type, label, validation)
- Form settings (payment, limits, deadlines)
- Preview functionality
- Save and publish actions

### Field Types Supported

- **Text**: Single-line text input
- **Email**: Email validation
- **Number**: Numeric input with min/max
- **Select**: Dropdown with options
- **Date**: Date picker
- **Textarea**: Multi-line text
- **Checkbox**: Boolean input

## Best Practices

### 1. Validate Form Data

Always validate form submissions:

```typescript
// Server-side validation
@Post('register')
async register(@Body() dto: RegistrationDto) {
  // Validate against form field configuration
  await this.validateRegistration(dto.formId, dto.data);
  return this.registrationService.create(dto);
}
```

### 2. Handle Payment Errors

```typescript
try {
  const registration = await submitRegistration(formData);
  
  if (form.paymentSum) {
    const payment = await processPayment(registration._id, form.paymentSum);
    if (!payment.success) {
      // Handle payment failure
    }
  }
} catch (error) {
  // Handle registration errors
}
```

### 3. Check Registration Limits

```typescript
const currentRegistrations = await registrationApi.fetchAll({
  formId: formId
});

if (form.maxRegistrators && 
    currentRegistrations.length >= form.maxRegistrators) {
  throw new Error('Registration limit reached');
}

if (form.registrationDeadline && 
    new Date() > new Date(form.registrationDeadline)) {
  throw new Error('Registration deadline has passed');
}
```

### 4. Organization Scoping

Always ensure forms are scoped by organization:

```typescript
// Forms are automatically scoped by organizationId from JWT token
// No need to manually filter - handled by API client
const forms = await formsApi.fetchAll(); // Only returns current org's forms
```

## Common Patterns

### Form with Payment

```typescript
const form = {
  title: "Workshop Registration",
  paymentSum: 200,
  fields: [
    { id: "name", type: "text", label: "Name", required: true },
    { id: "email", type: "email", label: "Email", required: true }
  ]
};

// Registration includes payment processing
```

### Limited Registration Form

```typescript
const form = {
  title: "Exclusive Event",
  maxRegistrators: 30,
  registrationDeadline: "2024-05-15",
  fields: [/* ... */]
};
```

### Multi-Step Form

Forms can be configured with conditional logic for multi-step flows (implementation depends on form builder capabilities).

## Troubleshooting

### Form Code Not Found
- Verify the code exists in the database
- Check that the form is active (`isActive: true`)
- Ensure the form belongs to the correct organization

### Registration Limit Reached
- Check `maxRegistrators` setting
- Verify current registration count
- Consider increasing the limit or creating a new form

### Payment Processing Fails
- Verify payment provider configuration
- Check payment service logs
- Ensure payment credentials are correct in organization settings

### Form Fields Not Rendering
- Verify field configuration is valid JSON
- Check field types are supported
- Ensure form data structure matches expected format

