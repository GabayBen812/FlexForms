export interface Parent {
  _id?: string;
  id?: string;
  firstname: string;
  lastname: string;
  birthdate: string | Date;
  sex: string;
  linked_kids?: string[];
  address?: string;
  organizationId: string;
  dynamicFields?: Record<string, any>;
}

