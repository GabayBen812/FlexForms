export interface Department {
  id: number;
  name: { he: string; en: string };
  logo: string;
  _count: { OrganizationRole: number };
}

export interface NewDepartmentPayload {
  name: { he: string; en?: string };
  logo: string;
  organizationId: number;
}
