import { Request, Response, NextFunction } from 'express';
import { prisma } from '@workspace/db-prisma';
import { requireAuth } from './authMiddleware';

export type AccountRole = 'individual' | 'business';

/**
 * Get the role of the authenticated account from the request.
 * Returns 'individual' if the account is not a service account (isService: false).
 * Returns 'business' if the account is a service account (isService: true).
 * Returns null if the account is not found.
 */
export async function getAccountRole(req: Request): Promise<AccountRole | null> {
  const userId = req.user?.userId;
  if (!userId) return null;

  const account = await prisma.account.findUnique({
    where: { id: userId },
    select: { isService: true },
  });

  if (!account) return null;

  return account.isService ? 'business' : 'individual';
}

/**
 * Middleware to ensure the authenticated account is an individual.
 * Returns 401 if not authenticated, 403 if the account is a business.
 */
export async function requireIndividual(req: Request, res: Response, next: NextFunction) {
  if (!req.user) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }

  const role = await getAccountRole(req);
  if (role !== 'individual') {
    res.status(403).json({ error: 'Forbidden: individual-only endpoint' });
    return;
  }

  next();
}

/**
 * Middleware to ensure the authenticated account is a business.
 * Returns 401 if not authenticated, 403 if the account is an individual.
 */
export async function requireBusiness(req: Request, res: Response, next: NextFunction) {
  if (!req.user) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }

  const role = await getAccountRole(req);
  if (role !== 'business') {
    res.status(403).json({ error: 'Forbidden: business-only endpoint' });
    return;
  }

  next();
}
