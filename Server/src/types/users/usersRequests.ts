import { Request } from "express";
export interface Permission {
  resource: string;
  canView: boolean;
  canCreate: boolean;
  canUpdate: boolean;
  canDelete: boolean;
}

export interface OrganizationRoleInfo {
  organizationId: number;
  roleId: number;
  permissions: Permission[];
}

export interface JWTUserInfo {
  id: number;
  email: string;
  name: string;
  username: string;
}

export interface ExtendedRequest extends Request {
  user?: JWTUserInfo & { organizationRoles: OrganizationRoleInfo[] };
  id?: number;
  query: {
    id: string;
    organizationId?: string;
    departmentId?: string;
    roleId?: string;
    page?: string;
    pageSize?: string;
    search?: string;
    sortField?: string;
    sortDirection?: "asc" | "desc";
    [key: string]: string | undefined;
  };
}
export interface CreateUserRequest {
  username: string;
  name: string;
  email: string;
  userType: "EMPLOYER" | "EMPLOYEE";
  password: string;
  organizationId: number;
  roleName: string;
  logo?: string;
}
