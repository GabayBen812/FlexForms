export interface Parent {
  _id?: string;
  id?: string;
  firstname: string;
  lastname: string;
  linked_kids?: string[];
  idNumber?: string;
  organizationId: string;
  dynamicFields?: Record<string, any>;
}

