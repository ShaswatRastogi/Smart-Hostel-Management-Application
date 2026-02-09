import { MaterialCommunityIcons } from '@expo/vector-icons';
import React from 'react';
import { Animated, StyleSheet, Text } from 'react-native';
import { useOffline } from '../context/OfflineContext';

export default function OfflineIndicator() {
    const { isOnline, isLoading } = useOffline();
    const [slideAnim] = React.useState(new Animated.Value(-100));

    React.useEffect(() => {
        if (!isOnline) {
            // Slide down
            Animated.spring(slideAnim, {
                toValue: 0,
                useNativeDriver: true,
                tension: 50,
                friction: 8
            }).start();
        } else {
            // Slide up
            Animated.timing(slideAnim, {
                toValue: -100,
                duration: 300,
                useNativeDriver: true
            }).start();
        }
    }, [isOnline]);

    const styles = StyleSheet.create({
        container: {
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            zIndex: 9999,
            backgroundColor: isLoading ? '#F59E0B' : '#EF4444',
            paddingVertical: 12,
            paddingHorizontal: 16,
            flexDirection: 'row',
            alignItems: 'center',
            gap: 12,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.25,
            shadowRadius: 4,
            elevation: 5
        },
        text: {
            color: '#fff',
            fontSize: 14,
            fontWeight: '600',
            flex: 1
        }
    });

    return (
        <Animated.View
            style={[
                styles.container,
                {
                    transform: [{ translateY: slideAnim }]
                }
            ]}
        >
            <MaterialCommunityIcons
                name={isLoading ? 'sync' : 'wifi-off'}
                size={20}
                color="#fff"
            />
            <Text style={styles.text}>
                {isLoading ? 'Syncing data...' : "You're offline"}
            </Text>
        </Animated.View>
    );
}
