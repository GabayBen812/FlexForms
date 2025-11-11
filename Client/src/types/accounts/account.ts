export interface Account {
  _id?: string;
  id?: string;
  name: string;
  organizationId: string;
  dynamicFields?: Record<string, any>;
  createdAt?: string;
  updatedAt?: string;
}

