import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { Request } from 'express';
import * as jwt from 'jsonwebtoken';
import { CustomRequest } from '../dto/CustomRequest';

interface DecodedToken {
  UserInfo: {
    id: string;
    email: string;
    organizationId?: string;
    role?: 'system_admin' | 'assistant_employee' | 'room_manager' | 'branch_manager' | 'district_manager' | 'finance_manager' | 'activity_manager' | 'parent' | 'student' | 'shift_manager';
    name?: string;
    linked_parent_id?: string;
  };
}


@Injectable()
export class JwtAuthGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest<CustomRequest>();
    //@ts-ignore
    const token = req.cookies.jwt ?? req.headers.authorization ?? '';
    if (!token) throw new UnauthorizedException('Missing token');

    const secret = process.env.ACCESS_TOKEN_SECRET;
    if (!secret) throw new UnauthorizedException('Missing secret');

    try {
      const decoded = jwt.verify(token, secret) as DecodedToken;
      const { id, email, organizationId, role, name, linked_parent_id } = decoded.UserInfo;
      
      req.user = {
        id,
        email,
        organizationId,
        role,
        name,
        linked_parent_id
      };
      

      return true;
    } catch (err) {
      throw new UnauthorizedException('Token verification failed');
    }
  }
}

