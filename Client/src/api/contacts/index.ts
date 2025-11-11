import apiClient from "@/api/apiClient";
import { handleApiError } from "@/api/configs";
import { MutationResponse } from "@/types/api/auth";
import { ApiQueryParams } from "@/types/ui/data-table-types";
import { Contact, ContactRelationship, ContactType } from "@/types/contacts/contact";

export interface ContactSearchParams extends ApiQueryParams {
  type: ContactType;
  status?: string;
}

export interface ContactSearchResponse {
  data: Contact[];
  totalCount: number;
  totalPages: number;
}

const normalizeQueryParams = (params: ContactSearchParams): Record<string, unknown> => {
  const { page = 1, pageSize = 25, ...rest } = params;
  const limit = pageSize;
  const offset = (page - 1) * pageSize;

  return {
    limit,
    offset,
    ...rest,
  };
};

export const fetchContacts = async (
  params: ContactSearchParams,
): Promise<MutationResponse<ContactSearchResponse>> => {
  try {
    const queryParams = normalizeQueryParams(params);
    const response = await apiClient.get<ContactSearchResponse>("/contacts", {
      params: queryParams,
    });

    const { data, totalCount, totalPages } = response.data;

    return {
      status: response.status,
      data: {
        data,
        totalCount,
        totalPages,
      },
    };
  } catch (error) {
    return handleApiError(error);
  }
};

export const createContact = async (
  payload: Partial<Contact> & { type: ContactType; organizationId: string },
): Promise<MutationResponse<Contact>> => {
  try {
    const response = await apiClient.post<Contact>("/contacts", payload);
    return {
      status: response.status,
      data: response.data,
    };
  } catch (error) {
    return handleApiError(error);
  }
};

export const updateContact = async (
  contactId: string,
  payload: Partial<Contact>,
): Promise<MutationResponse<Contact>> => {
  try {
    const response = await apiClient.put<Contact>(`/contacts/${contactId}`, payload);
    return {
      status: response.status,
      data: response.data,
    };
  } catch (error) {
    return handleApiError(error);
  }
};

export const deleteContact = async (contactId: string): Promise<MutationResponse<null>> => {
  try {
    const response = await apiClient.delete<null>(`/contacts/${contactId}`);
    return {
      status: response.status,
      data: response.data,
    };
  } catch (error) {
    return handleApiError(error);
  }
};

export const getRelationshipsForContacts = async (
  contactIds: string[],
): Promise<MutationResponse<ContactRelationship[]>> => {
  try {
    if (!contactIds.length) {
      return { status: 200, data: [] };
    }

    const response = await apiClient.get<ContactRelationship[]>("/contacts/relationships", {
      params: {
        contactIds: contactIds.join(","),
      },
    });

    return {
      status: response.status,
      data: response.data,
    };
  } catch (error) {
    return handleApiError(error);
  }
};

export const upsertRelationship = async (
  sourceContactId: string,
  payload: {
    targetContactId: string;
    relation: ContactRelationship["relation"];
    note?: string;
    priority?: number;
    startDate?: string;
    endDate?: string;
  },
): Promise<MutationResponse<ContactRelationship>> => {
  try {
    const response = await apiClient.post<ContactRelationship>(`/contacts/${sourceContactId}/relationships`, payload);
    return {
      status: response.status,
      data: response.data,
    };
  } catch (error) {
    return handleApiError(error);
  }
};

export const removeRelationship = async (
  sourceContactId: string,
  targetContactId: string,
): Promise<MutationResponse<null>> => {
  try {
    const response = await apiClient.delete<null>(`/contacts/${sourceContactId}/relationships/${targetContactId}`);
    return {
      status: response.status,
      data: response.data,
    };
  } catch (error) {
    return handleApiError(error);
  }
};


