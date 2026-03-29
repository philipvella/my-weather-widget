const NodeCache = require('node-cache');

// In-process fallback used when Redis env vars are absent (local dev without `vercel env pull`)
const localCache = new NodeCache({ stdTTL: 600 });

function getRedis() {
  const url   = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) return null;
  const { Redis } = require('@upstash/redis');
  return new Redis({ url, token });
}

async function get(key) {
  const redis = getRedis();
  if (!redis) return localCache.get(key) || null;
  try {
    return await redis.get(key);
  } catch (e) {
    console.warn('[cache] Redis get failed, using local cache:', e.message);
    return localCache.get(key) || null;
  }
}

async function set(key, value, ttlSeconds = 600) {
  localCache.set(key, value, ttlSeconds); // always mirror locally
  const redis = getRedis();
  if (!redis) return;
  try {
    await redis.set(key, value, { ex: ttlSeconds });
  } catch (e) {
    console.warn('[cache] Redis set failed:', e.message);
  }
}

module.exports = { get, set };
