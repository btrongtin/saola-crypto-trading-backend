import { fastifyPlugin } from 'fastify-plugin';

const cache = new Map();

const setCache = (key, value, ttl) => {
  const expireAt = Date.now() + ttl;
  cache.set(key, { value, expireAt });
};

const getCache = (key) => {
  const cached = cache.get(key);
  if (!cached) return null;

  const { value, expireAt } = cached;
  if (Date.now() > expireAt) {
    cache.delete(key);
    return null;
  }

  return value;
};

const clearCache = (key) => {
  cache.delete(key);
};

const cachePlugin = async function (fastify, options) {
  fastify.decorate('cache', {
    set: setCache,
    get: getCache,
    clear: clearCache,
  });
};

export default fastifyPlugin(cachePlugin);
