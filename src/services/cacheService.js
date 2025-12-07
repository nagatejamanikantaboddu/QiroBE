import { getRedisClient } from '../config/redis.js';
import logger from '../config/logger.js';

const CACHE_KEYS = {
    USER: 'user:',
    USER_SESSION: 'session:',
    PAYMENT_HISTORY: 'payment_history:',
    WEBHOOK_EVENT: 'webhook_event:',
};

const CACHE_TTL = {
    USER: 3600, // 1 hour
    USER_SESSION: 86400, // 24 hours
    PAYMENT_HISTORY: 7200, // 2 hours
    WEBHOOK_EVENT: 86400, // 24 hours - store webhook event IDs for 24 hours
};

class CacheService {
    /**
     * Set user data in cache
     * @param {string} userId - User ID
     * @param {object} userData - User data to cache
     * @param {number} ttl - Time to live in seconds (optional)
     */
    async setUserCache(userId, userData, ttl = CACHE_TTL.USER) {
        try {
            const redis = getRedisClient();
            const cacheKey = `${CACHE_KEYS.USER}${userId}`;
            const serialized = JSON.stringify(userData);
            
            await redis.setEx(cacheKey, ttl, serialized);
            logger.info(`User cache set for userId: ${userId}`);
            
            return true;
        } catch (error) {
            logger.error(`Error setting user cache: ${error.message}`);
            return false;
        }
    }

    /**
     * Get user data from cache
     * @param {string} userId - User ID
     * @returns {object|null} Cached user data or null if not found
     */
    async getUserCache(userId) {
        try {
            const redis = getRedisClient();
            const cacheKey = `${CACHE_KEYS.USER}${userId}`;
            
            const cached = await redis.get(cacheKey);
            if (cached) {
                logger.info(`User cache hit for userId: ${userId}`);
                return JSON.parse(cached);
            }
            
            logger.info(`User cache miss for userId: ${userId}`);
            return null;
        } catch (error) {
            logger.error(`Error getting user cache: ${error.message}`);
            return null;
        }
    }

    /**
     * Delete user cache
     * @param {string} userId - User ID
     */
    async deleteUserCache(userId) {
        try {
            const redis = getRedisClient();
            const cacheKey = `${CACHE_KEYS.USER}${userId}`;
            
            await redis.del(cacheKey);
            logger.info(`User cache deleted for userId: ${userId}`);
            
            return true;
        } catch (error) {
            logger.error(`Error deleting user cache: ${error.message}`);
            return false;
        }
    }

    /**
     * Invalidate user cache (when user data is updated)
     * @param {string} userId - User ID
     */
    async invalidateUserCache(userId) {
        return this.deleteUserCache(userId);
    }

    /**
     * Clear all user caches
     */
    async clearAllUserCache() {
        try {
            const redis = getRedisClient();
            const pattern = `${CACHE_KEYS.USER}*`;
            
            let cursor = 0;
            let keysToDelete = [];

            do {
                const reply = await redis.scan(cursor, { MATCH: pattern, COUNT: 100 });
                cursor = reply.cursor;
                keysToDelete = keysToDelete.concat(reply.keys);
            } while (cursor !== 0);

            if (keysToDelete.length > 0) {
                await redis.del(keysToDelete);
                logger.info(`Cleared ${keysToDelete.length} user cache entries`);
            }

            return true;
        } catch (error) {
            logger.error(`Error clearing user cache: ${error.message}`);
            return false;
        }
    }

    /**
     * Set session data in cache
     * @param {string} userId - User ID
     * @param {object} sessionData - Session data
     * @param {number} ttl - Time to live in seconds
     */
    async setSessionCache(userId, sessionData, ttl = CACHE_TTL.USER_SESSION) {
        try {
            const redis = getRedisClient();
            const cacheKey = `${CACHE_KEYS.USER_SESSION}${userId}`;
            const serialized = JSON.stringify(sessionData);
            
            await redis.setEx(cacheKey, ttl, serialized);
            logger.info(`Session cache set for userId: ${userId}`);
            
            return true;
        } catch (error) {
            logger.error(`Error setting session cache: ${error.message}`);
            return false;
        }
    }

    /**
     * Get session data from cache
     * @param {string} userId - User ID
     * @returns {object|null} Cached session data or null
     */
    async getSessionCache(userId) {
        try {
            const redis = getRedisClient();
            const cacheKey = `${CACHE_KEYS.USER_SESSION}${userId}`;
            
            const cached = await redis.get(cacheKey);
            if (cached) {
                logger.info(`Session cache hit for userId: ${userId}`);
                return JSON.parse(cached);
            }
            
            return null;
        } catch (error) {
            logger.error(`Error getting session cache: ${error.message}`);
            return null;
        }
    }

    /**
     * Delete session cache
     * @param {string} userId - User ID
     */
    async deleteSessionCache(userId) {
        try {
            const redis = getRedisClient();
            const cacheKey = `${CACHE_KEYS.USER_SESSION}${userId}`;
            
            await redis.del(cacheKey);
            logger.info(`Session cache deleted for userId: ${userId}`);
            
            return true;
        } catch (error) {
            logger.error(`Error deleting session cache: ${error.message}`);
            return false;
        }
    }

    /**
     * Set payment history in cache
     * @param {string} userId - User ID
     * @param {array} payments - Payment history data
     * @param {number} ttl - Time to live in seconds
     */
    async setPaymentHistoryCache(userId, payments, ttl = CACHE_TTL.PAYMENT_HISTORY) {
        try {
            const redis = getRedisClient();
            const cacheKey = `${CACHE_KEYS.PAYMENT_HISTORY}${userId}`;
            const serialized = JSON.stringify(payments);
            
            await redis.setEx(cacheKey, ttl, serialized);
            logger.info(`Payment history cache set for userId: ${userId}`);
            
            return true;
        } catch (error) {
            logger.error(`Error setting payment history cache: ${error.message}`);
            return false;
        }
    }

    /**
     * Get payment history from cache
     * @param {string} userId - User ID
     * @returns {array|null} Cached payment history or null
     */
    async getPaymentHistoryCache(userId) {
        try {
            const redis = getRedisClient();
            const cacheKey = `${CACHE_KEYS.PAYMENT_HISTORY}${userId}`;
            
            const cached = await redis.get(cacheKey);
            if (cached) {
                logger.info(`Payment history cache hit for userId: ${userId}`);
                return JSON.parse(cached);
            }
            
            logger.info(`Payment history cache miss for userId: ${userId}`);
            return null;
        } catch (error) {
            logger.error(`Error getting payment history cache: ${error.message}`);
            return null;
        }
    }

    /**
     * Invalidate payment history cache for a user
     * @param {string} userId - User ID
     */
    async invalidatePaymentHistoryCache(userId) {
        try {
            const redis = getRedisClient();
            const cacheKey = `${CACHE_KEYS.PAYMENT_HISTORY}${userId}`;
            
            await redis.del(cacheKey);
            logger.info(`Payment history cache invalidated for userId: ${userId}`);
            
            return true;
        } catch (error) {
            logger.error(`Error invalidating payment history cache: ${error.message}`);
            return false;
        }
    }

    /**
     * Clear all payment history caches
     */
    async clearAllPaymentHistoryCache() {
        try {
            const redis = getRedisClient();
            const pattern = `${CACHE_KEYS.PAYMENT_HISTORY}*`;
            
            let cursor = 0;
            let keysToDelete = [];

            do {
                const reply = await redis.scan(cursor, { MATCH: pattern, COUNT: 100 });
                cursor = reply.cursor;
                keysToDelete = keysToDelete.concat(reply.keys);
            } while (cursor !== 0);

            if (keysToDelete.length > 0) {
                await redis.del(keysToDelete);
                logger.info(`Cleared ${keysToDelete.length} payment history cache entries`);
            }

            return true;
        } catch (error) {
            logger.error(`Error clearing payment history cache: ${error.message}`);
            return false;
        }
    }

    /**
     * Check if webhook event has been processed (prevents duplicate webhooks)
     * @param {string} eventId - Razorpay event ID
     * @returns {boolean} True if event is duplicate, false if new
     */
    async isWebhookEventProcessed(eventId) {
        try {
            const redis = getRedisClient();
            const cacheKey = `${CACHE_KEYS.WEBHOOK_EVENT}${eventId}`;
            
            const exists = await redis.exists(cacheKey);
            if (exists === 1) {
                logger.warn(`Duplicate webhook event detected: ${eventId}`);
                return true;
            }
            
            return false;
        } catch (error) {
            logger.error(`Error checking webhook event: ${error.message}`);
            // On error, return false to allow processing (safer than blocking)
            return false;
        }
    }

    /**
     * Mark webhook event as processed
     * @param {string} eventId - Razorpay event ID
     * @param {number} ttl - Time to live in seconds
     */
    async markWebhookEventProcessed(eventId, ttl = CACHE_TTL.WEBHOOK_EVENT) {
        try {
            const redis = getRedisClient();
            const cacheKey = `${CACHE_KEYS.WEBHOOK_EVENT}${eventId}`;
            
            await redis.setEx(cacheKey, ttl, JSON.stringify({
                processedAt: new Date().toISOString(),
            }));
            
            logger.info(`Webhook event marked as processed: ${eventId}`);
            return true;
        } catch (error) {
            logger.error(`Error marking webhook event as processed: ${error.message}`);
            return false;
        }
    }

    /**
     * Clear webhook event processing record (if needed for testing)
     * @param {string} eventId - Razorpay event ID
     */
    async clearWebhookEvent(eventId) {
        try {
            const redis = getRedisClient();
            const cacheKey = `${CACHE_KEYS.WEBHOOK_EVENT}${eventId}`;
            
            await redis.del(cacheKey);
            logger.info(`Webhook event cleared: ${eventId}`);
            
            return true;
        } catch (error) {
            logger.error(`Error clearing webhook event: ${error.message}`);
            return false;
        }
    }
}

export default new CacheService();
