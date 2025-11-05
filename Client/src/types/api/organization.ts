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
  tableFieldDefinitions?: Record<
    string, // entity type: "kids", "parents", etc.
    {
      fields: Record<string, {
        type: string; // "TEXT" | "SELECT" | "DATE" | "NUMBER" | "EMAIL" | "PHONE"
        label: string;
        required?: boolean;
        choices?: string[]; // for SELECT type
        defaultValue?: any;
      }>;
      fieldOrder?: string[]; // Array of field names in the desired order
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
