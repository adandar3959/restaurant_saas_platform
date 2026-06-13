const Redis = require('ioredis');

let redis = null;

// Determine if we should attempt to connect to Redis
const shouldConnect = process.env.ENABLE_REDIS === 'true' || process.env.REDIS_URL || process.env.NODE_ENV === 'production';

if (shouldConnect) {
  try {
    const redisUrl = process.env.REDIS_URL || 'redis://127.0.0.1:6379';
    redis = new Redis(redisUrl, {
      connectTimeout: 5000, // Timeout connection after 5 seconds
      retryStrategy(times) {
        // Reconnect every 3 seconds
        return 3000;
      }
    });

    let isOfflineLogged = false;

    redis.on('error', (err) => {
      // Only log the offline warning once to prevent console spam
      if (!isOfflineLogged) {
        console.warn('⚠️ Redis is offline, bypassing cache:', err.message);
        isOfflineLogged = true;
      }
    });

    redis.on('connect', () => {
      console.log('✅ Connected to Redis successfully');
      isOfflineLogged = false;
    });
  } catch (err) {
    console.error('Failed to initialize Redis:', err);
    redis = null;
  }
} else {
  console.log('ℹ️ Redis caching is disabled. (Set ENABLE_REDIS=true in .env to enable)');
}

/**
 * Safely get cached value from Redis.
 * Falls back to null if Redis is not connected.
 */
const getCache = async (key) => {
  if (!redis || redis.status !== 'ready') return null;
  try {
    const data = await redis.get(key);
    return data ? JSON.parse(data) : null;
  } catch (err) {
    console.warn(`Redis GET failed for key ${key}:`, err.message);
    return null;
  }
};

/**
 * Safely store value in Redis with TTL (seconds).
 * Falls back silently if Redis is not connected.
 */
const setCache = async (key, value, ttlSeconds = 3600) => {
  if (!redis || redis.status !== 'ready') return;
  try {
    const stringValue = JSON.stringify(value);
    await redis.set(key, stringValue, 'EX', ttlSeconds);
  } catch (err) {
    console.warn(`Redis SET failed for key ${key}:`, err.message);
  }
};

/**
 * Safely delete cached value from Redis.
 * Falls back silently if Redis is not connected.
 */
const deleteCache = async (key) => {
  if (!redis || redis.status !== 'ready') return;
  try {
    await redis.del(key);
  } catch (err) {
    console.warn(`Redis DEL failed for key ${key}:`, err.message);
  }
};

/**
 * Clear all cached menu items, categories, and deals for a restaurant.
 */
const clearMenuCache = async (restaurantId) => {
  if (!redis || redis.status !== 'ready') return;
  try {
    // Find all keys matching menu:*:restaurantId*
    const keys = await redis.keys(`menu:*:${restaurantId}*`);
    if (keys.length > 0) {
      await redis.del(...keys);
      console.log(`🧹 Cleared ${keys.length} cached menu keys for restaurant: ${restaurantId}`);
    }
  } catch (err) {
    console.warn('Failed to clear menu cache:', err.message);
  }
};

module.exports = {
  redis,
  getCache,
  setCache,
  deleteCache,
  clearMenuCache,
};
