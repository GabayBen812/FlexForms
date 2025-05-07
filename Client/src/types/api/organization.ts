export interface Organization {
  _id: string;
  owner: string;
  name: string;
  description?: string;
  logo?: string;
  customStyles?: {
    accentColor?: string;
  };
}

export interface NewOrganizationPayload {
  name: string;
  description?: string;
}

export interface UpdateOrganizationPayload {
  organizationId: string;
  name?: string;
  description?: string;
  logo?: string;
  customStyles?: {
    accentColor?: string;
  };
}
