export interface EmailOptions {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
  from?: string;
  fromName?: string;
  cc?: string | string[];
  bcc?: string | string[];
  replyTo?: string;
}

export interface PasswordResetEmailData {
  email: string;
  name: string;
  resetToken: string;
  resetUrl: string;
  language?: 'he' | 'en';
}

export interface WelcomeEmailData {
  email: string;
  name: string;
  organizationName?: string;
  loginUrl: string;
  language?: 'he' | 'en';
}

export interface FormSubmissionEmailData {
  recipientEmail: string;
  recipientName?: string;
  formName: string;
  submitterName: string;
  submitterEmail: string;
  submissionData: Record<string, unknown>;
  submissionUrl?: string;
  language?: 'he' | 'en';
}

export interface TaskEmailData {
  recipientEmail: string;
  recipientName: string;
  taskTitle: string;
  taskDescription?: string;
  taskStatus: string;
  taskUrl?: string;
  assignedBy?: string;
  dueDate?: Date;
  language?: 'he' | 'en';
}

export interface InvoiceEmailData {
  recipientEmail: string;
  recipientName: string;
  invoiceNumber: string;
  invoiceAmount: number;
  invoiceDate: Date;
  dueDate?: Date;
  invoiceUrl?: string;
  paymentStatus: 'pending' | 'paid' | 'overdue';
  language?: 'he' | 'en';
}



