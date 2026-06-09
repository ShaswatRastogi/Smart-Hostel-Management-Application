import NetInfo from '@react-native-community/netinfo';
import { BlurView } from 'expo-blur';
import React, { useEffect, useState } from 'react';
import { StyleSheet } from 'react-native';
import Animated, {
    useAnimatedStyle,
    useSharedValue,
    withSpring,
    withTiming
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AppText from './AppText';
import { MaterialCommunityIcons } from '@expo/vector-icons';

export default function OfflineBanner() {
    const [isConnected, setIsConnected] = useState<boolean | null>(true);
    const translateY = useSharedValue(-100);
    const insets = useSafeAreaInsets();

    useEffect(() => {
        const unsubscribe = NetInfo.addEventListener((state) => {
            setIsConnected(state.isConnected);
        });

        return () => {
            unsubscribe();
        };
    }, []);

    useEffect(() => {
        if (isConnected === false) {
            // Slide down into view
            translateY.value = withSpring(insets.top + 10, { damping: 15 });
        } else {
            // Slide up out of view
            translateY.value = withTiming(-100, { duration: 300 });
        }
    }, [isConnected, insets.top]);

    const animatedStyle = useAnimatedStyle(() => ({
        transform: [{ translateY: translateY.value }],
    }));

    return (
        <Animated.View style={[styles.container, animatedStyle]}>
            <BlurView intensity={80} tint="dark" style={styles.blurContainer}>
                <MaterialCommunityIcons name="wifi-off" size={20} color="#FF6B6B" />
                <AppText style={styles.text}>No Internet Connection</AppText>
            </BlurView>
        </Animated.View>
    );
}

const styles = StyleSheet.create({
    container: {
        position: 'absolute',
        top: 0,
        left: 20,
        right: 20,
        zIndex: 9999,
        alignItems: 'center',
    },
    blurContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 12,
        borderRadius: 100,
        backgroundColor: 'rgba(20,20,20,0.85)',
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: 'rgba(255,107,107,0.3)',
        elevation: 10,
        shadowColor: '#FF6B6B',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 10,
    },
    text: {
        color: '#FFFFFF',
        marginLeft: 10,
        fontSize: 14,
        fontWeight: '600',
    },
});
