import { Role } from "./roles";

export interface OrganizationRole {
  role: Role;
}
export interface User {
  id: number;
  username: string;
  email: string;
  password: string;
  name: string;
  logo?: string;
  userType: "EMPLOYER" | "EMPLOYEE";
  organizationRoles?: OrganizationRole[];
}

export interface UpdateUserPayload {
  name?: string;
  email?: string;
  password?: string;
  oldPassword?: string;
}
