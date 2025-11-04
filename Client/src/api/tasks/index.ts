import apiClient from "@/api/apiClient";
import { Task, CreateTaskDto, UpdateTaskDto, TaskStatus } from "@/types/tasks/task";

export const fetchAllTasks = async (): Promise<Task[]> => {
  // Backend gets organizationId from JWT token
  const { data } = await apiClient.get<Task[]>("/tasks");
  return data;
};

export const createTask = async (taskData: CreateTaskDto): Promise<Task> => {
  // Don't send organizationId - backend sets it from JWT token
  const { organizationId, ...rest } = taskData;
  const { data } = await apiClient.post<Task>("/tasks", rest);
  return data;
};

export const updateTask = async (
  id: string,
  taskData: UpdateTaskDto
): Promise<Task> => {
  const { data } = await apiClient.put<Task>(`/tasks/${id}`, taskData);
  return data;
};

export const moveTask = async (
  taskId: string,
  newStatus: TaskStatus,
  newOrder: number
): Promise<Task> => {
  const { data } = await apiClient.post<Task>("/tasks/move", {
    taskId,
    newStatus,
    newOrder,
  });
  return data;
};

export const deleteTask = async (id: string): Promise<void> => {
  await apiClient.delete(`/tasks/${id}`);
};

