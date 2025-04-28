export interface Role {
  id: number;
  name: { he: string; en: string };
  userCount: number;
  permissions: Permissions[];
}

export interface Permissions {
  id: number;
  roleId: number;
  resource: string;
  canView: boolean;
  canUpdate: boolean;
  canCreate: boolean;
  canDelete: boolean;
}
