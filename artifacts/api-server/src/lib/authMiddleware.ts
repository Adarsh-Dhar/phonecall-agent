import { Request, Response, NextFunction } from 'express';
import { verifyToken, type JWTPayload } from './jwt';
import { logger } from './logger';

export function requireAuth(req: Request, res: Response, next: NextFunction): void {
  const token = req.cookies?.token;

  if (!token) {
    res.status(401).json({ error: 'Unauthorized - No token provided' });
    return;
  }

  const payload = verifyToken(token);
  if (!payload) {
    res.status(401).json({ error: 'Unauthorized - Invalid token' });
    return;
  }

  req.userId = payload.userId;
  req.user = payload;
  next();
}

export function optionalAuth(req: Request, res: Response, next: NextFunction): void {
  const token = req.cookies?.token;
  if (token) {
    const payload = verifyToken(token);
    if (payload) {
      req.userId = payload.userId;
      req.user = payload;
    }
  }
  next();
}
