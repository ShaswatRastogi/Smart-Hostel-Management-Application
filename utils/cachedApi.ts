import api from './api';
import { CACHE_DURATION, CACHE_KEYS, cacheData, getCachedData } from './offlineCache';
import { checkNetworkStatus } from './useNetworkStatus';

// Re-export for convenience
export { CACHE_DURATION, CACHE_KEYS };

/**
 * API wrapper with offline caching support
 * Use this for GET requests that should work offline
 */

interface CachedRequestOptions {
    cacheKey: string;
    cacheDuration?: number;
    forceRefresh?: boolean;
}

/**
 * Make a GET request with caching support
 */
export async function cachedGet<T>(
    url: string,
    options: CachedRequestOptions
): Promise<T> {
    const { cacheKey, cacheDuration, forceRefresh = false } = options;

    // Check if online
    const isOnline = await checkNetworkStatus();

    // If offline, try to return cached data
    if (!isOnline) {
        const cached = await getCachedData<T>(cacheKey);
        if (cached) {
            console.log(`📦 Returning cached data (offline): ${cacheKey}`);
            return cached;
        }
        throw new Error('No internet connection and no cached data available');
    }

    // Online: Try to fetch fresh data
    try {
        if (!forceRefresh) {
            // Check cache first
            const cached = await getCachedData<T>(cacheKey);
            if (cached) {
                console.log(`📦 Returning cached data: ${cacheKey}`);
                // Return cached data but fetch fresh in background
                fetchAndCache(url, cacheKey, cacheDuration);
                return cached;
            }
        }

        // Fetch from network
        const response = await api.get<T>(url);
        const data = response.data;

        // Cache the response
        await cacheData(cacheKey, data, { ttl: cacheDuration });
        console.log(`✅ Fetched and cached: ${cacheKey}`);

        return data;
    } catch (error) {
        // Network request failed, try cache as fallback
        const cached = await getCachedData<T>(cacheKey);
        if (cached) {
            console.log(`⚠️ Network failed, using cached data: ${cacheKey}`);
            return cached;
        }
        throw error;
    }
}

/**
 * Background fetch and cache (fire and forget)
 */
async function fetchAndCache(url: string, cacheKey: string, cacheDuration?: number) {
    try {
        const response = await api.get(url);
        await cacheData(cacheKey, response.data, { ttl: cacheDuration });
        console.log(`🔄 Background cache updated: ${cacheKey}`);
    } catch (error) {
        console.log(`⚠️ Background fetch failed: ${cacheKey}`);
    }
}

/**
 * Preload essential data for offline use
 */
export async function preloadEssentialData(): Promise<void> {
    const isOnline = await checkNetworkStatus();

    if (!isOnline) {
        console.log('⏭️ Skipping preload (offline)');
        return;
    }

    console.log('🔄 Preloading essential data...');

    try {
        // Preload in parallel
        await Promise.allSettled([
            cachedGet('/mess/menu', {
                cacheKey: CACHE_KEYS.MESS_MENU,
                cacheDuration: CACHE_DURATION.ONE_WEEK
            }),
            cachedGet('/bus/timings', {
                cacheKey: CACHE_KEYS.BUS_TIMINGS,
                cacheDuration: CACHE_DURATION.ONE_MONTH
            }),
            cachedGet('/hostel/info', {
                cacheKey: CACHE_KEYS.HOSTEL_INFO,
                cacheDuration: CACHE_DURATION.ONE_MONTH
            }),
            cachedGet('/emergency/contacts', {
                cacheKey: CACHE_KEYS.EMERGENCY_CONTACTS,
                cacheDuration: CACHE_DURATION.ONE_MONTH
            })
        ]);

        console.log('✅ Essential data preloaded');
    } catch (error) {
        console.error('⚠️ Some preload requests failed:', error);
    }
}
