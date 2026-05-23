import MaterialIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import AppText from '../../../components/AppText';

interface StudentCardProps {
    item: any;
    onPress: () => void;
    colors: any;
    theme: 'light' | 'dark';
    API_BASE_URL: string;
}

export default function StudentCard({ item, onPress, colors, theme, API_BASE_URL }: StudentCardProps) {
    const isDark = theme === 'dark';

    const getStatusColor = (status: string) => {
        return status === 'active' ? '#10B981' : '#EF4444';
    };

    const getStatusIcon = (status: string) => {
        return status === 'active' ? 'check-circle' : 'alert-circle';
    };

    return (
        <TouchableOpacity
            activeOpacity={0.8}
            onPress={onPress}
            style={[styles.studentCard, { backgroundColor: isDark ? '#1E293B' : '#FFFFFF' }]}
        >
            <LinearGradient
                colors={isDark ? ['rgba(255,255,255,0.03)', 'transparent'] : ['rgba(0,0,0,0.01)', 'transparent']}
                style={StyleSheet.absoluteFill}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
            />

            <View style={styles.cardHeader}>
                <View style={styles.studentAvatarContainer}>
                    <LinearGradient
                        colors={isDark ? ['#312E81', '#1E1B4B'] : ['#E0E7FF', '#C7D2FE']}
                        style={styles.studentAvatar}
                    >
                        {item.profilePhoto ? (
                            <Image
                                source={{ uri: item.profilePhoto.startsWith('http') ? item.profilePhoto : `${API_BASE_URL}${item.profilePhoto}` }}
                                style={styles.avatarImage}
                                contentFit="cover"
                            />
                        ) : (
                            <AppText style={[styles.studentInitial, { color: isDark ? '#C7D2FE' : '#4F46E5' }]}>
                                {item.name
                                    .split(' ')
                                    .map((n: string) => n[0])
                                    .join('')
                                    .toUpperCase()}
                            </AppText>
                        )}
                    </LinearGradient>
                </View>

                <View style={styles.studentInfo}>
                    <AppText style={[styles.studentName, { color: colors.text }]} numberOfLines={1}>
                        {item.name}
                    </AppText>
                    <View style={styles.roomRollContainer}>
                        <View style={[styles.pill, { backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : '#F1F5F9' }]}>
                            <AppText style={[styles.detailSmall, { color: isDark ? '#94A3B8' : '#64748B' }]}>Room {item.room}</AppText>
                        </View>
                        <AppText style={[styles.detailSmallLight, { color: colors.textSecondary }]}>• {item.rollNo}</AppText>
                    </View>
                </View>

                <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) + '15' }]}>
                    <MaterialIcons name={getStatusIcon(item.status) as any} size={20} color={getStatusColor(item.status)} />
                </View>
            </View>

            {/* Subtle Watermark */}
            <MaterialIcons
                name="account-details"
                size={64}
                color={isDark ? '#FFF' : colors.primary}
                style={{
                    position: 'absolute',
                    right: -10,
                    bottom: -10,
                    opacity: isDark ? 0.03 : 0.02,
                    transform: [{ rotate: '-15deg' }]
                }}
            />
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    studentCard: {
        borderRadius: 20,
        marginBottom: 12,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.05)',
        elevation: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
    },
    cardHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 14,
    },
    studentAvatarContainer: {
        marginRight: 14,
    },
    studentAvatar: {
        width: 54,
        height: 54,
        borderRadius: 18,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
    },
    avatarImage: {
        width: '100%',
        height: '100%',
        borderRadius: 18,
    },
    studentInitial: {
        fontSize: 20,
        fontWeight: '800',
        letterSpacing: -0.5,
    },
    studentInfo: {
        flex: 1,
    },
    studentName: {
        fontSize: 16,
        fontWeight: '800',
        marginBottom: 4,
        letterSpacing: -0.3,
    },
    roomRollContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    pill: {
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 8,
    },
    detailSmall: {
        fontSize: 11,
        fontWeight: '800',
        textTransform: 'uppercase',
    },
    detailSmallLight: {
        fontSize: 12,
        fontWeight: '500',
    },
    statusBadge: {
        width: 40,
        height: 40,
        borderRadius: 14,
        justifyContent: 'center',
        alignItems: 'center',
    },
});
