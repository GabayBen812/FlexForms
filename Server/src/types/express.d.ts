import { Role } from '@/types/api/user';

declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email: string;
        password?: string;
        organizationId?: string;
        role?: Role | 'admin' | 'editor' | 'viewer';
      };
    }
  }
}
