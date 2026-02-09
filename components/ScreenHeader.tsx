import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AnimatedGradientHeader from './AnimatedGradientHeader';

interface Props {
    title: string;
    subtitle?: string;
    showBackButton?: boolean;
    rightAction?: React.ReactNode;
}

export default function ScreenHeader({ title, subtitle, showBackButton = true, rightAction }: Props) {
    const router = useRouter();
    const insets = useSafeAreaInsets();

    return (
        <AnimatedGradientHeader style={[styles.header, { paddingTop: insets.top + 10 }]}>
            <View style={styles.content}>
                {showBackButton && (
                    <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                        <MaterialCommunityIcons name="arrow-left" size={24} color="#fff" />
                    </TouchableOpacity>
                )}
                <View style={styles.textContainer}>
                    <Text style={styles.title}>{title}</Text>
                    {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
                </View>
                {/* Render right action or placeholder */}
                {rightAction ? (
                    <View style={styles.rightAction}>{rightAction}</View>
                ) : (
                    <View style={{ width: 40 }} />
                )}
            </View>
        </AnimatedGradientHeader>
    );
}

const styles = StyleSheet.create({
    header: {
        paddingBottom: 24,
        paddingHorizontal: 20,
        borderBottomLeftRadius: 32,
        borderBottomRightRadius: 32,
    },
    content: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    backBtn: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(255,255,255,0.2)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    textContainer: {
        flex: 1,
        alignItems: 'center',
    },
    title: {
        fontSize: 20,
        fontWeight: '800',
        color: '#fff',
        letterSpacing: 0.5,
    },
    subtitle: {
        fontSize: 12,
        color: 'rgba(255,255,255,0.8)',
        marginTop: 2,
        fontWeight: '600',
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    rightAction: {
        minWidth: 40,
        justifyContent: 'center',
        alignItems: 'flex-end',
    },
});
