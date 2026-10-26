/**
 * Database Connection Monitoring Script
 *
 * Monitors PostgreSQL connection count and reports on connection pool usage
 * Run this during load tests to identify if you're hitting connection pool limits
 *
 * Usage:
 *   npx tsx monitor-db-connections.ts
 *
 * Or monitor continuously:
 *   npx tsx monitor-db-connections.ts --watch
 */

import 'dotenv/config';
import { PrismaClient } from '@workspace/db-prisma';

const prisma = new PrismaClient();

interface ConnectionStats {
  total: number;
  active: number;
  idle: number;
  maxConnections: number;
  prismaPoolSize: number;
}

async function getConnectionStats(): Promise<ConnectionStats> {
  const result = await prisma.$queryRaw<Array<{ count: string }>>`
    SELECT count(*) as count
    FROM pg_stat_activity
  `;

  const activeResult = await prisma.$queryRaw<Array<{ count: string }>>`
    SELECT count(*) as count
    FROM pg_stat_activity
    WHERE state = 'active'
  `;

  const idleResult = await prisma.$queryRaw<Array<{ count: string }>>`
    SELECT count(*) as count
    FROM pg_stat_activity
    WHERE state = 'idle'
  `;

  const maxResult = await prisma.$queryRaw<Array<{ max_connections: string }>>`
    SELECT setting::int as max_connections
    FROM pg_settings
    WHERE name = 'max_connections'
  `;

  // Get Prisma pool size from DATABASE_URL connection_limit parameter
  const dbUrl = process.env.DATABASE_URL || '';
  const poolMatch = dbUrl.match(/connection_limit=(\d+)/);
  const prismaPoolSize = poolMatch ? parseInt(poolMatch[1], 10) : 10; // Default Prisma pool is 10

  return {
    total: parseInt(result[0].count),
    active: parseInt(activeResult[0].count),
    idle: parseInt(idleResult[0].count),
    maxConnections: parseInt(maxResult[0].max_connections),
    prismaPoolSize,
  };
}

function formatStats(stats: ConnectionStats): string {
  const poolUtilization = (stats.active / stats.prismaPoolSize * 100).toFixed(1);
  const dbUtilization = (stats.total / stats.maxConnections * 100).toFixed(1);

  return `
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Database Connection Stats
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Total Connections:        ${stats.total} / ${stats.maxConnections} (${dbUtilization}%)
  - Active:               ${stats.active}
  - Idle:                 ${stats.idle}

Prisma Pool Size:         ${stats.prismaPoolSize}
Pool Utilization:         ${stats.active} / ${stats.prismaPoolSize} (${poolUtilization}%)

${parseInt(poolUtilization) > 80 ? '⚠️  WARNING: Pool utilization > 80%' : '✓ Pool utilization healthy'}
${parseInt(dbUtilization) > 80 ? '⚠️  WARNING: DB utilization > 80%' : '✓ DB utilization healthy'}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
`;
}

async function monitor(watch = false): Promise<void> {
  try {
    const stats = await getConnectionStats();
    console.log(formatStats(stats));

    if (watch) {
      console.log('Press Ctrl+C to stop monitoring...\n');
      const interval = setInterval(async () => {
        try {
          const newStats = await getConnectionStats();
          console.log(formatStats(newStats));
        } catch (error) {
          console.error('Error monitoring connections:', error);
        }
      }, 5000); // Check every 5 seconds

      process.on('SIGINT', () => {
        clearInterval(interval);
        console.log('\nMonitoring stopped');
        process.exit(0);
      });
    }
  } catch (error) {
    console.error('Error getting connection stats:', error);
    process.exit(1);
  } finally {
    if (!watch) {
      await prisma.$disconnect();
    }
  }
}

const args = process.argv.slice(2);
const watchMode = args.includes('--watch') || args.includes('-w');

await monitor(watchMode);
