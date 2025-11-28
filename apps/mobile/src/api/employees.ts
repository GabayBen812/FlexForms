import { api } from './client';

export type EmployeesCountResponse = {
  count: number;
};

export async function fetchEmployeesCount(): Promise<number> {
  const response = await api.get<EmployeesCountResponse>('/employees/count');
  return response.data.count;
}

