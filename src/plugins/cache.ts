import { FastifyPluginAsync } from 'fastify';
import fastifyPlugin from 'fastify-plugin';

// Define the cache structure
interface CacheEntry<T> {
  value: T;
  expireAt: number;
}

// Initialize an in-memory cache
const cache = new Map<string, CacheEntry<any>>();

/**
 * Set a value in the cache with a time-to-live (TTL)
 * @param key - The cache key
 * @param value - The value to be cached
 * @param ttl - Time-to-live in milliseconds
 */
const setCache = <T>(key: string, value: T, ttl: number): void => {
  const expireAt = Date.now() + ttl;
  cache.set(key, { value, expireAt });
};

/**
 * Get a value from the cache
 * @param key - The cache key
 * @returns The cached value or null if not found or expired
 */
const getCache = <T>(key: string): T | null => {
  const cached = cache.get(key);
  if (!cached) return null;

  const { value, expireAt } = cached;
  if (Date.now() > expireAt) {
    cache.delete(key);
    return null;
  }

  return value;
};

/**
 * Clear a value from the cache
 * @param key - The cache key
 */
const clearCache = (key: string): void => {
  cache.delete(key);
};

// Define the cache plugin
const cachePlugin: FastifyPluginAsync = async (fastify, options) => {
  fastify.decorate('cache', {
    set: setCache,
    get: getCache,
    clear: clearCache,
  });
};

export default fastifyPlugin(cachePlugin);
