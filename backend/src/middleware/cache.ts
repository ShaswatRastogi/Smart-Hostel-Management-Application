import { Request, Response, NextFunction } from 'express';
import { redisClient } from '../utils/redis';

/**
 * Middleware to cache HTTP GET responses in Redis.
 * @param duration Duration in seconds to cache the response.
 */
export const cacheMiddleware = (duration: number) => {
    return async (req: Request, res: Response, next: NextFunction) => {
        // Only cache GET requests
        if (req.method !== 'GET') {
            return next();
        }

        // Use the request URL, query, and user ID as the cache key to prevent cross-user leakage
        const userId = (req as any).user?.userId || 'anonymous';
        const key = `__express__${req.originalUrl || req.url}__user_${userId}`;

        try {
            // Check if the response is cached
            const cachedBody = await redisClient.get(key);
            if (cachedBody) {
                console.log(`⚡ Serving from Redis Cache: ${key}`);
                return res.json(JSON.parse(cachedBody));
            }

            // If not cached, override res.json to cache the response body
            const originalJson = res.json.bind(res);
            res.json = (body: any) => {
                // We only cache successful responses (HTTP 200-299)
                if (res.statusCode >= 200 && res.statusCode < 300) {
                    redisClient.set(key, JSON.stringify(body), 'EX', duration).catch((err) => {
                        console.error('Redis cache set error:', err);
                    });
                }
                return originalJson(body);
            };

            next();
        } catch (error) {
            console.error('Redis cache error:', error);
            next();
        }
    };
};
