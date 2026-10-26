import { Request, Response, NextFunction } from 'express';
import { verifyToken, type JWTPayload } from './jwt';
import { logger } from './logger';

export function requireAuth(req: Request, res: Response, next: NextFunction): void {
  // Check for token in cookie first
  let token = req.cookies?.token;

  // Fall back to Authorization header for programmatic access
  if (!token && req.headers.authorization) {
    const authHeader = req.headers.authorization;
    if (authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7);
    }
  }

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
  // Check for token in cookie first
  let token = req.cookies?.token;

  // Fall back to Authorization header for programmatic access
  if (!token && req.headers.authorization) {
    const authHeader = req.headers.authorization;
    if (authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7);
    }
  }

  if (token) {
    const payload = verifyToken(token);
    if (payload) {
      req.userId = payload.userId;
      req.user = payload;
    }
  }
  next();
}
