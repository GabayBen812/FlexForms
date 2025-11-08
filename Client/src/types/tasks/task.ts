export interface Task {
  _id: string;
  title: string;
  description?: string;
  status: string;
  assignedTo?: {
    _id: string;
    name: string;
    email: string;
  };
  createdBy: {
    _id: string;
    name: string;
    email: string;
  };
  organizationId: string;
  order: number;
  dueDate?: string;
  tags?: string[];
  priority: number; // 0 = low, 1 = medium, 2 = high
  createdAt?: string;
  updatedAt?: string;
}

export interface TaskColumn {
  _id: string;
  key: string;
  name: string;
  color: string;
  order: number;
}

export interface CreateTaskDto {
  title: string;
  description?: string;
  status?: string;
  assignedTo?: string;
  dueDate?: string;
  tags?: string[];
  priority?: number;
}

export interface UpdateTaskDto {
  title?: string;
  description?: string;
  status?: string;
  assignedTo?: string;
  dueDate?: string;
  tags?: string[];
  priority?: number;
  order?: number;
}








