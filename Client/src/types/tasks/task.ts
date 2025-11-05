export enum TaskStatus {
  TODO = 'todo',
  IN_PROGRESS = 'in_progress',
  IN_REVIEW = 'in_review',
  DONE = 'done',
}

export interface Task {
  _id: string;
  title: string;
  description?: string;
  status: TaskStatus;
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

export interface CreateTaskDto {
  title: string;
  description?: string;
  status?: TaskStatus;
  assignedTo?: string;
  dueDate?: string;
  tags?: string[];
  priority?: number;
}

export interface UpdateTaskDto {
  title?: string;
  description?: string;
  status?: TaskStatus;
  assignedTo?: string;
  dueDate?: string;
  tags?: string[];
  priority?: number;
  order?: number;
}


