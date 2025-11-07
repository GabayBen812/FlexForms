import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from "@nestjs/common";
import * as jwt from 'jsonwebtoken';
import { CustomRequest } from '../dto/CustomRequest';

interface DecodedToken {
  UserInfo: {
    id: string;
    email: string;
    organizationId?: string;
    role?: 'admin' | 'editor' | 'viewer';
    name?: string;
  };
}


@Injectable()
export class JwtAuthGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest<CustomRequest>();
    const cookieToken = req.cookies?.jwt;
    const authHeader = req.headers.authorization;

    let token = cookieToken;

    if (!token && typeof authHeader === "string") {
      token = authHeader.startsWith("Bearer ")
        ? authHeader.slice(7).trim()
        : authHeader.trim();
    } else if (!token && Array.isArray(authHeader) && authHeader.length > 0) {
      const bearerHeader = authHeader.find((header) =>
        header?.startsWith("Bearer ")
      );
      const rawHeader = bearerHeader ?? authHeader[0];
      token = rawHeader?.startsWith("Bearer ")
        ? rawHeader.slice(7).trim()
        : rawHeader?.trim();
    }

    if (!token) {
      throw new UnauthorizedException("Missing token");
    }

    const secret = process.env.ACCESS_TOKEN_SECRET;
    if (!secret) throw new UnauthorizedException('Missing secret');

    try {
      const decoded = jwt.verify(token, secret) as DecodedToken;
      const { id, email, organizationId, role, name } = decoded.UserInfo;
      
      req.user = {
        id,
        email,
        organizationId,
        role,
        name
      };
      

      return true;
    } catch (err) {
      throw new UnauthorizedException('Token verification failed');
    }
  }
}

