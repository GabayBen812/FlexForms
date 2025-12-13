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
    
    // Try to get token from cookie first, then from Authorization header
    let token = req.cookies?.jwt;
    
    // If not in cookie, check Authorization header (for mobile apps)
    const authHeader = req.headers['authorization'];
    if (!token && authHeader) {
      // Support both "Bearer TOKEN" and just "TOKEN"
      token = authHeader.startsWith('Bearer ') 
        ? authHeader.substring(7) 
        : authHeader;
    }
    
    if (!token) {
      console.error('❌ JWT Guard: Missing token', {
        hasCookies: !!req.cookies,
        cookieKeys: req.cookies ? Object.keys(req.cookies) : [],
        hasAuthHeader: !!authHeader,
        origin: req.headers['origin'],
        url: req.url
      });
      throw new UnauthorizedException('Missing token');
    }

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

