import { Request } from 'express';
import { UserFromRequest } from './UserFromRequest';

export interface CustomRequest extends Request {
  user: UserFromRequest;
}
