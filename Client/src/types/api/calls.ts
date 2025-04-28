import { Department } from "./departments";

export interface CallCategory {
  id: number;
  name: { he: string; en: string };
  logo: string;
  departmentId: number;
  organizationId: number;
  department: Department;
}
export interface NewCallCategoryPayload {
  name: { he: string; en?: string };
  logo: string;
  departmentId: number;
  organizationId: number;
}

export interface Call {
  id: string;
  location: string;
  roomNumber: number;
  description: string;
  title: string;
  createdAt: string;
  closedAt: string | null;
  departmentId: number;
  createdById: number;
  assignedToId: number;
  closedById: number | null;
  status: "Open" | "InProgress" | "Closed";
  callCategoryId: number;
}