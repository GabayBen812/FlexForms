export interface CustomRequest extends Request {
    user?: {
      id: string;
      email: string;
      organizationId?: string;
      role?: 'system_admin' | 'assistant_employee' | 'room_manager' | 'branch_manager' | 'district_manager' | 'finance_manager' | 'activity_manager' | 'parent' | 'student' | 'shift_manager';
      name?: string;
      linked_parent_id?: string;
    };
    secret?: string | undefined;
    cookies?: Record<string, any>;
    signedCookies?: Record<string, any>;
    headers: Headers;
  }