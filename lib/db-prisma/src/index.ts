import { PrismaClient } from '../generated/index.js';
import path from 'path';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

// Ensure we use the absolute path to the database
const dbPath = process.env.DATABASE_URL || 'file:./prisma/dev.db';
const absoluteDbPath = dbPath.startsWith('file:') 
  ? `file:${path.resolve(process.cwd(), dbPath.replace('file:', ''))}`
  : dbPath;

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    datasources: {
      db: {
        url: absoluteDbPath
      }
    },
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  });

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

export * from '../generated/index.js';
