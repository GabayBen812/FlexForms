import { api } from './client';
import type { Season } from './seasons';

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
  currentSeasonId?: string;
  currentSeason?: Season;
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
    string,
    {
      fields: Record<
        string,
        {
          type: string;
          label: string;
          required?: boolean;
          choices?: Array<
            | string
            | {
                value?: string;
                label?: string;
                color?: string;
              }
          >;
          defaultValue?: any;
        }
      >;
      fieldOrder?: string[];
    }
  >;
  paymentProvider?: string;
  paymentProviderCredentials?: {
    terminalNumber?: string;
    username?: string;
    password?: string;
  };
  recurringChargeDay?: number;
  invoicingProvider?: string;
  invoicingProviderApiKey?: {
    apiKey: string;
    secret: string;
  };
  icountCredentials?: {
    apiKey: string;
  };
}

export async function fetchOrganization(search?: string): Promise<Organization> {
  const response = await api.get<Organization>('/organizations/find', {
    params: search ? { search } : {},
  });
  console.log('[fetchOrganization] Full Response:', response);
  console.log('[fetchOrganization] Response.data:', response.data);
  return response.data;
}

