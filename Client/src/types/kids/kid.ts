export interface Kid {
  _id?: string;
  id?: string;
  contactId?: string;
  firstname: string;
  lastname: string;
  profileImageUrl?: string;
  linked_parents?: string[];
  address?: string;
  idNumber?: string;
  organizationId: string;
  dynamicFields?: Record<string, any>;
  createdAt?: string;
  updatedAt?: string;
  status?: string;
}

