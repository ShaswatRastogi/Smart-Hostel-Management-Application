import NetInfo from '@react-native-community/netinfo';
import { useEffect, useState } from 'react';

/**
 * Hook to monitor network connectivity status
 */
export function useNetworkStatus() {
    const [isOnline, setIsOnline] = useState(true);
    const [isInternetReachable, setIsInternetReachable] = useState(true);

    useEffect(() => {
        // Subscribe to network state changes
        const unsubscribe = NetInfo.addEventListener(state => {
            setIsOnline(state.isConnected ?? true);
            setIsInternetReachable(state.isInternetReachable ?? true);
        });

        // Initial check
        NetInfo.fetch().then(state => {
            setIsOnline(state.isConnected ?? true);
            setIsInternetReachable(state.isInternetReachable ?? true);
        });

        return () => unsubscribe();
    }, []);

    return {
        isOnline: isOnline && isInternetReachable,
        isConnected: isOnline,
        isInternetReachable
    };
}

/**
 * Get current network status (one-time check)
 */
export async function checkNetworkStatus(): Promise<boolean> {
    const state = await NetInfo.fetch();
    return (state.isConnected && state.isInternetReachable) ?? false;
}
