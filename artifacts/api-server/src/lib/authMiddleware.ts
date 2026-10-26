import { Request, Response, NextFunction } from 'express';
import { verifyToken, type JWTPayload } from './jwt';
import { logger } from './logger';
import { prisma } from '@workspace/db-prisma';

export async function requireAuth(req: Request, res: Response, next: NextFunction): Promise<void> {
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

  // Check that the account still exists
  try {
    const account = await prisma.account.findUnique({
      where: { id: payload.userId },
      select: { id: true },
    });

    if (!account) {
      res.status(401).json({ error: 'Unauthorized - Account not found' });
      return;
    }
  } catch (error) {
    logger.error({ error }, 'Error checking account existence');
    res.status(500).json({ error: 'Internal server error' });
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
