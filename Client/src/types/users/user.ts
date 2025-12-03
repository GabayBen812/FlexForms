export interface User {
  _id: string;
  id?: string | number;
  name: string;
  email: string;
  password?: string;
  role:
    | "system_admin"
    | "assistant_employee"
    | "room_manager"
    | "branch_manager"
    | "district_manager"
    | "finance_manager"
    | "activity_manager"
    | "parent"
    | "student"
    | "shift_manager";
  organizationId: string;
  linked_parent_id?: string;
  logo?: string | File;
  createdAt?: string;
  updatedAt?: string;
}

export interface UpdateUserPayload extends Partial<User> {
  id: string | number;
  oldPassword?: string;
}
