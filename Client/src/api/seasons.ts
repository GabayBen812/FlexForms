import apiClient from './apiClient';

export type Season = {
  _id: string;
  name: string;
  order: number;
  organizationId: string;
  createdAt?: string;
  updatedAt?: string;
};

export async function fetchSeasons(): Promise<Season[]> {
  const response = await apiClient.get<Season[]>('/seasons');
  return response.data ?? [];
}

export async function createSeason(name: string): Promise<Season> {
  const response = await apiClient.post<Season>('/seasons', { name });
  return response.data;
}

export async function updateSeason(id: string, data: { name?: string }): Promise<Season> {
  const response = await apiClient.put<Season>(`/seasons/${id}`, data);
  return response.data;
}

export async function reorderSeason(id: string, newOrder: number): Promise<Season> {
  const response = await apiClient.put<Season>(`/seasons/${id}/reorder`, { newOrder });
  return response.data;
}

export async function deleteSeason(id: string): Promise<void> {
  await apiClient.delete(`/seasons/${id}`);
}

