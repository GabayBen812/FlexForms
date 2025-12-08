import { api } from './client';

export async function checkFeatureFlag(key: string, organizationId: string): Promise<boolean> {
  const response = await api.get<boolean>(`/feature-flags/check/${key}/${organizationId}`);
  return response.data;
}

