import {
  CanActivate,
  ExecutionContext,
  Injectable,
  InternalServerErrorException,
  UnauthorizedException,
} from '@nestjs/common';
import * as jwt from 'jsonwebtoken';

interface JwtPayload {
  id: number;
  email: string;
}

@Injectable()
export class JwtAuthGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest();
    const authHeader = req.headers['authorization'];

    // Returning `false` here would make Nest answer 403 Forbidden, which means
    // "you are known and still not allowed". The correct answer for a missing or
    // bad token is 401 Unauthorized.
    if (typeof authHeader !== 'string') {
      throw new UnauthorizedException('No token provided');
    }

    const [scheme, token] = authHeader.split(' ');
    if (scheme !== 'Bearer' || !token) {
      throw new UnauthorizedException('Invalid token format');
    }

    const secret = process.env.JWT_SECRET;
    if (!secret) {
      // A configuration fault, not the caller's fault — do not report it as 401.
      throw new InternalServerErrorException('JWT_SECRET is not configured');
    }

    try {
      // Pinning the algorithm matters: without it, `verify` accepts whatever the
      // token's own header advertises, which is the entry point for algorithm
      // confusion attacks.
      const decoded = jwt.verify(token, secret, {
        algorithms: ['HS256'],
      }) as JwtPayload;

      req.user = { id: decoded.id, email: decoded.email };
      return true;
    } catch {
      throw new UnauthorizedException('Invalid or expired token');
    }
  }
}
