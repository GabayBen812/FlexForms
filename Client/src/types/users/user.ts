export interface User {
  _id: string;
  id?: string | number;
  name: string;
  email: string;
  password?: string;
  role: "system_admin" | "admin" | "editor" | "viewer";
  organizationId: string;
  logo?: string | File;
  createdAt?: string;
  updatedAt?: string;
}

export interface UpdateUserPayload extends Partial<User> {
  id: string | number;
  oldPassword?: string;
}
