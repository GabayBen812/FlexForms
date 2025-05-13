export interface User {
  name: string;
  email: string;
  password: string;
  role: "system_admin" | "admin" | "editor" | "viewer";
  organizationId: string;
}

export interface UpdateUserPayload {
  name?: string;
  email?: string;
  password?: string;
  oldPassword?: string;
}
