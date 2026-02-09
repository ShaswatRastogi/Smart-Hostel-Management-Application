import { useCallback, useState } from 'react';

/**
 * Custom hook for Pull-to-Refresh functionality.
 * 
 * @param fetchData Function to fetch/reload data.
 * @param resetInputs Optional function to clear/reset input fields.
 * @returns Object containing `refreshing` state and `onRefresh` callback.
 */
export const useRefresh = (
    fetchData: () => Promise<void> | void,
    resetInputs?: () => void
) => {
    const [refreshing, setRefreshing] = useState(false);

    const onRefresh = useCallback(async () => {
        setRefreshing(true);
        try {
            // Execute the data fetching logic
            await fetchData();

            // If a reset function is provided, execute it (e.g., clearing form inputs)
            if (resetInputs) {
                resetInputs();
            }
        } catch (error) {
            console.error("Refresh failed:", error);
        } finally {
            // Ensure refreshing state is disabled after operation
            setRefreshing(false);
        }
    }, [fetchData, resetInputs]);

    return { refreshing, onRefresh };
};
