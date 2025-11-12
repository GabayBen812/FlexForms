export type ContactType = "parent" | "kid" | "contact" | "staff";

export type ContactStatus = "active" | "inactive" | "archived";

export interface Contact {
  _id: string;
  firstname: string;
  lastname: string;
  type: ContactType;
  organizationId: string;
  idNumber?: string;
  email?: string;
  phone?: string;
  address?: string;
  status: ContactStatus;
  accountId?: string;
  dynamicFields?: Record<string, unknown>;
  createdAt?: string;
  updatedAt?: string;
}

export interface ContactRelationship {
  _id?: string;
  sourceContactId: string;
  targetContactId: string;
  relation: "parent" | "child" | "guardian" | "emergency_contact" | "other";
  note?: string;
  priority?: number;
  startDate?: string;
  endDate?: string;
}


