import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Offline Cache Utility
 * Manages data caching for offline mode
 */

export interface CacheOptions {
    ttl?: number; // Time to live in milliseconds
}

interface CacheEntry<T> {
    data: T;
    timestamp: number;
    ttl?: number;
}

const CACHE_PREFIX = '@smart_hostel_cache:';

/**
 * Save data to cache
 */
export async function cacheData<T>(
    key: string,
    data: T,
    options?: CacheOptions
): Promise<void> {
    try {
        const cacheEntry: CacheEntry<T> = {
            data,
            timestamp: Date.now(),
            ttl: options?.ttl
        };

        await AsyncStorage.setItem(
            `${CACHE_PREFIX}${key}`,
            JSON.stringify(cacheEntry)
        );
    } catch (error) {
        console.error(`Failed to cache data for key: ${key}`, error);
    }
}

/**
 * Get data from cache
 * Returns null if not found or expired
 */
export async function getCachedData<T>(key: string): Promise<T | null> {
    try {
        const cached = await AsyncStorage.getItem(`${CACHE_PREFIX}${key}`);

        if (!cached) {
            return null;
        }

        const cacheEntry: CacheEntry<T> = JSON.parse(cached);

        // Check if cache has expired
        if (cacheEntry.ttl) {
            const age = Date.now() - cacheEntry.timestamp;
            if (age > cacheEntry.ttl) {
                // Cache expired, remove it
                await removeCachedData(key);
                return null;
            }
        }

        return cacheEntry.data;
    } catch (error) {
        console.error(`Failed to get cached data for key: ${key}`, error);
        return null;
    }
}

/**
 * Remove specific cached data
 */
export async function removeCachedData(key: string): Promise<void> {
    try {
        await AsyncStorage.removeItem(`${CACHE_PREFIX}${key}`);
    } catch (error) {
        console.error(`Failed to remove cached data for key: ${key}`, error);
    }
}

/**
 * Clear all cached data
 */
export async function clearAllCache(): Promise<void> {
    try {
        const keys = await AsyncStorage.getAllKeys();
        const cacheKeys = keys.filter(key => key.startsWith(CACHE_PREFIX));
        await AsyncStorage.multiRemove(cacheKeys);
    } catch (error) {
        console.error('Failed to clear cache', error);
    }
}

/**
 * Get cache statistics
 */
export async function getCacheStats(): Promise<{
    totalKeys: number;
    totalSize: number; // Approximate in bytes
}> {
    try {
        const keys = await AsyncStorage.getAllKeys();
        const cacheKeys = keys.filter(key => key.startsWith(CACHE_PREFIX));

        let totalSize = 0;
        for (const key of cacheKeys) {
            const value = await AsyncStorage.getItem(key);
            if (value) {
                totalSize += value.length;
            }
        }

        return {
            totalKeys: cacheKeys.length,
            totalSize
        };
    } catch (error) {
        console.error('Failed to get cache stats', error);
        return { totalKeys: 0, totalSize: 0 };
    }
}

// Predefined cache keys for common data
export const CACHE_KEYS = {
    MESS_MENU: 'mess_menu',
    BUS_TIMINGS: 'bus_timings',
    USER_PROFILE: 'user_profile',
    LAUNDRY_SETTINGS: 'laundry_settings',
    HOSTEL_INFO: 'hostel_info',
    EMERGENCY_CONTACTS: 'emergency_contacts',
    NOTICES: 'notices',
    FACILITIES: 'facilities'
} as const;

// Cache durations (in milliseconds)
export const CACHE_DURATION = {
    ONE_HOUR: 60 * 60 * 1000,
    ONE_DAY: 24 * 60 * 60 * 1000,
    ONE_WEEK: 7 * 24 * 60 * 60 * 1000,
    ONE_MONTH: 30 * 24 * 60 * 60 * 1000
} as const;
