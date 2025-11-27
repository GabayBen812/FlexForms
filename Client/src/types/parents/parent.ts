export interface Parent {
  _id?: string;
  id?: string;
  contactId?: string;
  firstname: string;
  lastname: string;
  profileImageUrl?: string;
  linked_kids?: string[];
  idNumber?: string;
  organizationId: string;
  dynamicFields?: Record<string, any>;
  email?: string;
  phone?: string;
  address?: string;
  status?: string;
}

