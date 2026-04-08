// backend/src/auth/auth.middleware.ts
import { Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { AuthenticatedRequest } from '../types/express';

export const authenticateJWT = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ message: 'No token provided' });

  const token = authHeader.split(' ')[1];
  if (!token) return res.status(401).json({ message: 'Invalid token format' });

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET!) as { id: number; email: string };
    req.user = { id: payload.id, email: payload.email }; // TypeScript knows req.user exists
    next();
  } catch (err) {
    return res.status(403).json({ message: 'Invalid or expired token' });
  }
};