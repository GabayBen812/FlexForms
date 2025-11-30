import { api } from './client';

export type KidsCountResponse = {
  count: number;
};

export type Kid = {
  _id: string;
  firstname: string;
  lastname: string;
  profileImageUrl?: string;
  linked_parents?: string[];
  address?: string;
  idNumber?: string;
  organizationId: string;
  contactId?: string;
  dynamicFields?: Record<string, any>;
};

export type Parent = {
  _id: string;
  firstname: string;
  lastname: string;
  linked_kids?: string[];
  idNumber?: string;
  organizationId: string;
  contactId?: string;
  dynamicFields?: Record<string, any>;
};

export async function fetchKidsCount(): Promise<number> {
  const response = await api.get<KidsCountResponse>('/kids/count');
  return response.data.count;
}

export async function fetchKidById(kidId: string): Promise<Kid> {
  const response = await api.get<Kid>(`/kids/${kidId}`);
  return response.data;
}

export async function fetchParentById(parentId: string): Promise<Parent> {
  const response = await api.get<Parent>(`/parents/${parentId}`);
  return response.data;
}

