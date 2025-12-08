import { api } from './client';

export type Season = {
  _id: string;
  name: string;
  order: number;
  organizationId: string;
  createdAt?: string;
  updatedAt?: string;
};

export async function fetchSeasons(): Promise<Season[]> {
  const response = await api.get<Season[]>('/seasons');
  return response.data ?? [];
}

