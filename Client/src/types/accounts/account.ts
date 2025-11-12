export interface Account {
  _id?: string;
  id?: string;
  name: string;
  organizationId: string;
  linked_contacts?: string[];
  dynamicFields?: Record<string, any>;
  createdAt?: string;
  updatedAt?: string;
}

