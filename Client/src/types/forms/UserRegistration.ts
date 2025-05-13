export interface UserRegistration {
    _id: string;
    fullName: string;
    email?: string;
    phone?: string;
    formId: string;
    organizationId: string;
    additionalData?: Record<string, any>;
    createdAt: string;
  }
  