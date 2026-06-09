import Redis from 'ioredis';

const redisUrl = process.env.REDIS_URL || 'redis://127.0.0.1:6379';

export const redisClient = new Redis(redisUrl, {
    retryStrategy: (times) => {
        // Prevent aggressive reconnects if the server dies
        return Math.min(times * 100, 3000);
    }
});

redisClient.on('error', (err) => console.log('Redis Client Error', err.message));

export const connectRedis = async () => {
    try {
        await new Promise<void>((resolve, reject) => {
            redisClient.once('ready', () => resolve());
            redisClient.once('error', (err) => reject(err));
        });
        console.log('📦 Redis Connected Successfully (ioredis)');
    } catch (error: any) {
        console.error('❌ Redis Connection Failed:', error.message);
    }
};
