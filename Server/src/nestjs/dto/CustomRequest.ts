export interface CustomRequest extends Request {
    user?: {
      id: string;
      email: string;
      organizationId?: string;
      role?: 'admin' | 'editor' | 'viewer';
      name?: string;
    };
    secret?: string | undefined;
    cookies?: Record<string, any>;
    signedCookies?: Record<string, any>;
    headers: Headers;
  }