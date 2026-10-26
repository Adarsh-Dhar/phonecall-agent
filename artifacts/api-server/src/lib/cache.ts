/**
 * Redis caching layer for frequently accessed data
 *
 * Caches closures and business hours to reduce database load
 * on GET /contacts endpoint
 */

import { createClient, type RedisClientType } from 'redis';

let redisClient: RedisClientType | null = null;
const CACHE_TTL_SECONDS = 300; // 5 minutes
const CLOSURE_CACHE_PREFIX = 'closure:';
const BUSINESS_HOURS_CACHE_PREFIX = 'business_hours:';

/**
 * Initialize Redis client (lazy initialization)
 */
function getRedisClient(): RedisClientType {
  if (!redisClient) {
    const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
    redisClient = createClient({
      url: redisUrl,
      socket: {
        reconnectStrategy: (retries) => {
          if (retries > 10) {
            return new Error('Too many retries');
          }
          return Math.min(retries * 100, 3000);
        },
      },
    });

    redisClient.on('error', (err) => {
      console.error('Redis Client Error:', err);
    });

    redisClient.connect().catch((err) => {
      console.error('Failed to connect to Redis:', err);
    });
  }
  return redisClient;
}

/**
 * Cache closure info for a business
 */
export async function cacheClosureInfo(businessId: string, closureData: any): Promise<void> {
  try {
    const client = getRedisClient();
    const key = `${CLOSURE_CACHE_PREFIX}${businessId}`;
    await client.setEx(key, CACHE_TTL_SECONDS, JSON.stringify(closureData));
  } catch (error) {
    // Fail silently - cache misses are acceptable
    console.warn('Failed to cache closure info:', error);
  }
}

/**
 * Get cached closure info for a business
 */
export async function getCachedClosureInfo(businessId: string): Promise<any | null> {
  try {
    const client = getRedisClient();
    const key = `${CLOSURE_CACHE_PREFIX}${businessId}`;
    const data = await client.get(key);
    return data ? JSON.parse(data) : null;
  } catch (error) {
    console.warn('Failed to get cached closure info:', error);
    return null;
  }
}

/**
 * Cache business hours for an account
 */
export async function cacheBusinessHours(accountId: string, hoursData: any): Promise<void> {
  try {
    const client = getRedisClient();
    const key = `${BUSINESS_HOURS_CACHE_PREFIX}${accountId}`;
    await client.setEx(key, CACHE_TTL_SECONDS, JSON.stringify(hoursData));
  } catch (error) {
    console.warn('Failed to cache business hours:', error);
  }
}

/**
 * Get cached business hours for an account
 */
export async function getCachedBusinessHours(accountId: string): Promise<any | null> {
  try {
    const client = getRedisClient();
    const key = `${BUSINESS_HOURS_CACHE_PREFIX}${accountId}`;
    const data = await client.get(key);
    return data ? JSON.parse(data) : null;
  } catch (error) {
    console.warn('Failed to get cached business hours:', error);
    return null;
  }
}

/**
 * Invalidate cache for a specific business (e.g., after updates)
 */
export async function invalidateBusinessCache(businessId: string): Promise<void> {
  try {
    const client = getRedisClient();
    await client.del(`${CLOSURE_CACHE_PREFIX}${businessId}`);
    await client.del(`${BUSINESS_HOURS_CACHE_PREFIX}${businessId}`);
  } catch (error) {
    console.warn('Failed to invalidate business cache:', error);
  }
}

/**
 * Check if Redis is available
 */
export async function isRedisAvailable(): Promise<boolean> {
  try {
    const client = getRedisClient();
    await client.ping();
    return true;
  } catch (error) {
    return false;
  }
}
