import apiClient from '@/api/apiClient';
import { Task, CreateTaskDto, UpdateTaskDto, TaskColumn } from '@/types/tasks/task';

export interface MoveTaskPayload {
  taskId: string;
  newStatus: string;
  newOrder: number;
}

export const fetchAllTasks = async (): Promise<Task[]> => {
  const { data } = await apiClient.get<Task[]>('/tasks');
  return data;
};

export const fetchTaskColumns = async (): Promise<TaskColumn[]> => {
  const { data } = await apiClient.get<TaskColumn[]>('/task-columns');
  return data;
};

export const createTaskColumn = async (payload: {
  name: string;
  color: string;
}): Promise<TaskColumn> => {
  const { data } = await apiClient.post<TaskColumn>('/task-columns', payload);
  return data;
};

export const updateTaskColumn = async (
  id: string,
  payload: { name?: string; color?: string },
): Promise<TaskColumn> => {
  const { data } = await apiClient.patch<TaskColumn>(`/task-columns/${id}`, payload);
  return data;
};

export const deleteTaskColumn = async (id: string): Promise<void> => {
  await apiClient.delete(`/task-columns/${id}`);
};

export const reorderTaskColumns = async (columnIds: string[]): Promise<void> => {
  await apiClient.patch('/task-columns/reorder', { columnIds });
};

export const createTask = async (taskData: CreateTaskDto): Promise<Task> => {
  const { organizationId, ...rest } = taskData as CreateTaskDto & { organizationId?: string };
  const { data } = await apiClient.post<Task>('/tasks', rest);
  return data;
};

export const updateTask = async (id: string, taskData: UpdateTaskDto): Promise<Task> => {
  const { data } = await apiClient.put<Task>(`/tasks/${id}`, taskData);
  return data;
};

export const moveTask = async (payload: MoveTaskPayload): Promise<Task> => {
  const { data } = await apiClient.post<Task>('/tasks/move', {
    taskId: payload.taskId,
    newStatus: payload.newStatus,
    newOrder: payload.newOrder,
  });
  return data;
};

export const deleteTask = async (id: string): Promise<void> => {
  await apiClient.delete(`/tasks/${id}`);
};
