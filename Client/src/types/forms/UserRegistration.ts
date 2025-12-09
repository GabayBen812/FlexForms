export interface UserRegistration {
    _id: string;
    fullName: string;
    email?: string;
    phone?: string;
    formId: string;
    organizationId: string;
    kidId?: string; // ID of the linked kid
    additionalData?: Record<string, any>;
    createdAt: string;
  }
  