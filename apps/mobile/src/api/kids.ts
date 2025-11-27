import { api } from './client';

export type KidsCountResponse = {
  count: number;
};

export async function fetchKidsCount(): Promise<number> {
  const response = await api.get<KidsCountResponse>('/kids/count');
  return response.data.count;
}

