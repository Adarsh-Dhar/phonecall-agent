import { PrismaClient } from '../generated/index.js';
import path from 'path';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

// Use DATABASE_URL as-is (already set correctly by start-all.sh)
// For local dev, it's "file:./prisma/dev.db" relative to repo root
// For production, it's the PostgreSQL connection string
export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  });

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

export * from '../generated/index.js';
