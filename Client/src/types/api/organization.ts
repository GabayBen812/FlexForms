export interface Organization {
  _id: string;
  id?: string;
  name: string;
  description?: string;
  owner?: string;
  logo?: string;
  createdAt?: string;
  updatedAt?: string;
  featureFlagIds?: string[];
  customStyles?: {
    accentColor?: string;
  };
  OrganizationRole?: string;
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
