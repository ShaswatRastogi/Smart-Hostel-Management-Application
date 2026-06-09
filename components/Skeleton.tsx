import { LinearGradient } from 'expo-linear-gradient';
import React, { useEffect } from 'react';
import { DimensionValue, StyleSheet, View, ViewStyle } from 'react-native';
import Animated, {
    Easing,
    useAnimatedStyle,
    useSharedValue,
    withRepeat,
    withTiming
} from 'react-native-reanimated';
import { useThemeStore } from '../store/useThemeStore';

interface SkeletonProps {
    width?: DimensionValue;
    height?: DimensionValue;
    borderRadius?: number;
    style?: ViewStyle;
    flex?: number;
    circle?: boolean;
    size?: number; // Shortcut for setting width and height to the same value
}

export default function Skeleton({
    width,
    height,
    borderRadius = 8,
    style,
    flex,
    circle,
    size
}: SkeletonProps) {
    const { isDark } = useThemeStore();
    const translateX = useSharedValue(-100);

    // Dynamic Colors based on theme
    const baseColor = isDark ? '#1F2937' : '#E5E7EB'; // tailwind gray-800 / gray-200
    const highlightColor = isDark ? '#374151' : '#F3F4F6'; // tailwind gray-700 / gray-100

    useEffect(() => {
        translateX.value = withRepeat(
            withTiming(100, {
                duration: 1200,
                easing: Easing.bezier(0.25, 0.1, 0.25, 1),
            }),
            -1, // Infinite
            false // Don't reverse, always sweep left-to-right
        );
    }, [translateX]);

    const animatedStyle = useAnimatedStyle(() => ({
        transform: [{ translateX: `${translateX.value}%` }],
    }));

    // Computed Dimensions
    const computedWidth = size ?? width ?? '100%';
    const computedHeight = size ?? height ?? 20;
    const computedBorderRadius = circle ? (size ? size / 2 : 50) : borderRadius;

    return (
        <View
            style={[
                styles.container,
                {
                    width: computedWidth as any,
                    height: computedHeight as any,
                    borderRadius: computedBorderRadius,
                    backgroundColor: baseColor,
                    flex: flex,
                },
                style,
            ]}
        >
            <Animated.View style={[StyleSheet.absoluteFill, animatedStyle, { width: '200%', left: '-50%' }]}>
                <LinearGradient
                    colors={[
                        'transparent',
                        highlightColor,
                        'transparent',
                    ]}
                    start={{ x: 0, y: 0.5 }}
                    end={{ x: 1, y: 0.5 }}
                    style={StyleSheet.absoluteFill}
                />
            </Animated.View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        overflow: 'hidden',
    },
});
