import React, { createContext, useContext, useEffect, useState } from 'react';
import { useNetworkStatus } from '../utils/useNetworkStatus';

interface OfflineContextType {
    isOnline: boolean;
    isLoading: boolean;
    lastSyncTime: Date | null;
    syncData: () => Promise<void>;
}

const OfflineContext = createContext<OfflineContextType | undefined>(undefined);

export function OfflineProvider({ children }: { children: React.ReactNode }) {
    const { isOnline } = useNetworkStatus();
    const [isLoading, setIsLoading] = useState(false);
    const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null);

    // Auto-sync when coming back online
    useEffect(() => {
        if (isOnline) {
            syncData();
        }
    }, [isOnline]);

    const syncData = async () => {
        if (!isOnline) return;

        setIsLoading(true);
        try {
            // This will be called by individual components to refresh their data
            setLastSyncTime(new Date());
        } catch (error) {
            console.error('Sync failed:', error);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <OfflineContext.Provider
            value={{
                isOnline,
                isLoading,
                lastSyncTime,
                syncData
            }}
        >
            {children}
        </OfflineContext.Provider>
    );
}

export function useOffline() {
    const context = useContext(OfflineContext);
    if (context === undefined) {
        throw new Error('useOffline must be used within OfflineProvider');
    }
    return context;
}
