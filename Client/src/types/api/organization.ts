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
  requestDefinitions?: Record<
    string,
    {
      type: string;
     fields: Record<string, {
      type: string;
      choices?: string[];
    }>;
    }
  >;
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
