export interface User {
  _id: string;
  id?: string;
  name: string;
  email: string;
  password?: string;
  role: "system_admin" | "admin" | "editor" | "viewer";
  organizationId: string;
  logo?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface UpdateUserPayload {
  name?: string;
  email?: string;
  password?: string;
  oldPassword?: string;
  logo?: File;
  id?: string;
}
