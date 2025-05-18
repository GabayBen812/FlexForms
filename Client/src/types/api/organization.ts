export interface Organization {
  _id: string;
  name: string;
  description?: string;
  owner: string;
}

export interface NewOrganizationPayload {
  name: string;
  description?: string;
}

export interface UpdateOrganizationPayload {
  organizationId: string;
  name?: string;
  description?: string;
}
