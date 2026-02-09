import { MaterialCommunityIcons, MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Dimensions, FlatList, RefreshControl, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useAlert } from '../../context/AlertContext';
import { useRefresh } from '../../hooks/useRefresh';
import { isAdmin, useUser } from '../../utils/authUtils';
import { AdminNotification, clearNotifications, subscribeToNotifications } from '../../utils/notificationUtils';
import { useTheme } from '../../utils/ThemeContext';

const { width } = Dimensions.get('window');
const CONTAINER_WIDTH = Math.min(width * 0.85, 380);

export default function AdminNotifications() {
    const { colors, theme, isDark } = useTheme();
    const insets = useSafeAreaInsets();
    const user = useUser();
    const router = useRouter();
    const { showAlert } = useAlert();

    const [notifications, setNotifications] = useState<AdminNotification[]>([]);
    const [loading, setLoading] = useState(true);

    const { refreshing, onRefresh } = useRefresh(async () => {
        await new Promise(resolve => setTimeout(resolve, 500));
    });

    useEffect(() => {
        if (!isAdmin(user)) return;

        setLoading(true);
        const unsubscribe = subscribeToNotifications((data) => {
            setNotifications(data);
            setLoading(false);
        });
        return () => {
            if (unsubscribe) unsubscribe();
        };
    }, [user]);

    const handleClear = async () => {
        if (notifications.length === 0) return;

        // Immediate clear without popup
        try {
            const success = await clearNotifications();
            if (success) {
                setNotifications([]);
            } else {
                showAlert('Error', 'Failed to clear notifications', [], 'error');
            }
        } catch (e: any) {
            showAlert('Error', e.message, [], 'error');
        }
    };

    const handlePress = (item: AdminNotification) => {
        switch (item.type) {
            case 'message':
                router.push({ pathname: '/chat/[id]', params: { id: item.data.studentId } });
                break;
            case 'complaint':
                router.push({ pathname: '/admin/complaints', params: { openId: item.data.id } });
                break;
            case 'leave':
                router.push({ pathname: '/admin/leaveRequests', params: { openId: item.data.id } });
                break;
            case 'laundry':
                router.push({ pathname: '/admin/laundry', params: { openId: item.data.id } });
                break;
            case 'service':
                router.push({ pathname: '/admin/services', params: { openId: item.data.id } });
                break;
            default:
                break;
        }
    };

    const getIcon = (type: string) => {
        switch (type) {
            case 'message': return 'message-text-outline';
            case 'complaint': return 'alert-circle-outline';
            case 'leave': return 'clock-outline';
            case 'laundry': return 'washing-machine';
            case 'service': return 'tools';
            default: return 'bell-outline';
        }
    };

    const getColor = (type: string) => {
        switch (type) {
            case 'message': return '#3B82F6';
            case 'complaint': return '#EF4444';
            case 'leave': return '#F59E0B';
            case 'laundry': return '#10B981';
            case 'service': return '#8B5CF6';
            default: return '#64748B';
        }
    };

    const formatTime = (time: string) => {
        const date = new Date(time);
        const now = new Date();
        const diff = (now.getTime() - date.getTime()) / 1000; // seconds

        if (diff < 60) return 'Just now';
        if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
        if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
        return date.toLocaleDateString();
    };

    const styles = StyleSheet.create({
        container: {
            flex: 1,
            backgroundColor: colors.background,
        },
        header: {
            paddingBottom: 24,
            borderBottomLeftRadius: 32,
            borderBottomRightRadius: 32,
            shadowColor: "#004e92",
            shadowOffset: { width: 0, height: 8 },
            shadowOpacity: 0.2,
            shadowRadius: 16,
            elevation: 8,
            zIndex: 10,
            alignItems: 'center',
        },
        centeredContent: {
            flexDirection: 'row',
            alignItems: 'center',
            gap: 12,
            width: CONTAINER_WIDTH
        },
        headerTitle: {
            fontSize: 22,
            fontWeight: '800',
            color: '#fff',
            letterSpacing: 0.5,
            flex: 1,
        },
        backBtn: {
            width: 40,
            height: 40,
            borderRadius: 20,
            backgroundColor: 'rgba(255,255,255,0.2)',
            justifyContent: 'center',
            alignItems: 'center',
        },
        clearBtn: {
            paddingHorizontal: 14,
            paddingVertical: 8,
            borderRadius: 12,
            backgroundColor: '#fff',
            justifyContent: 'center',
            alignItems: 'center',
            shadowColor: '#000',
            shadowOpacity: 0.2,
            shadowRadius: 4,
            shadowOffset: { width: 0, height: 2 },
            elevation: 3,
        },
        clearBtnText: {
            color: '#004e92',
            fontSize: 12,
            fontWeight: '800',
            letterSpacing: 0.5,
        },
        listContent: {
            paddingBottom: 100,
            alignItems: 'center',
            paddingTop: 20,
        },
        card: {
            width: CONTAINER_WIDTH,
            backgroundColor: colors.card,
            borderRadius: 20,
            padding: 16,
            marginBottom: 12,
            flexDirection: 'row',
            alignItems: 'center',
            gap: 16,
            shadowColor: colors.textSecondary,
            shadowOpacity: 0.08,
            shadowOffset: { width: 0, height: 4 },
            shadowRadius: 12,
            elevation: 3,
            borderWidth: 1,
            borderColor: colors.border,
        },
        iconBox: {
            width: 48,
            height: 48,
            borderRadius: 16,
            justifyContent: 'center',
            alignItems: 'center',
        },
        cardText: {
            flex: 1,
        },
        cardTitle: {
            fontSize: 15,
            fontWeight: '700',
            color: colors.text,
            marginBottom: 2,
        },
        cardSubtitle: {
            fontSize: 13,
            color: colors.textSecondary,
            marginBottom: 4,
        },
        cardTime: {
            fontSize: 11,
            color: colors.textSecondary,
            fontWeight: '600',
            opacity: 0.8,
        },
        emptyState: {
            alignItems: 'center',
            justifyContent: 'center',
            padding: 40,
            borderRadius: 24,
            borderWidth: 1,
            borderColor: colors.border,
            gap: 12,
            marginTop: 20,
            width: CONTAINER_WIDTH,
            backgroundColor: colors.card,
        },
        emptyText: {
            fontSize: 15,
            fontWeight: '600',
            color: colors.text,
        }
    });

    if (!isAdmin(user)) {
        return (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                <Text>Access denied.</Text>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <LinearGradient
                colors={['#000428', '#004e92']}
                style={[styles.header, { paddingTop: 24 + insets.top }]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
            >
                <View style={styles.centeredContent}>
                    <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                        <MaterialIcons name="chevron-left" size={32} color="#fff" />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Notifications</Text>
                    {notifications.length > 0 ? (
                        <TouchableOpacity onPress={handleClear} style={styles.clearBtn}>
                            <Text style={styles.clearBtnText}>CLEAR</Text>
                        </TouchableOpacity>
                    ) : (
                        <View style={{ width: 40 }} /> // Spacer to balance back button
                    )}
                </View>
            </LinearGradient>

            <FlatList
                data={notifications}
                keyExtractor={(item) => item.id}
                contentContainerStyle={styles.listContent}
                showsVerticalScrollIndicator={false}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} tintColor={colors.primary} />}
                renderItem={({ item }) => (
                    <TouchableOpacity
                        style={styles.card}
                        onPress={() => handlePress(item)}
                        activeOpacity={0.7}
                    >
                        <View style={[styles.iconBox, { backgroundColor: `${getColor(item.type)}20` }]}>
                            <MaterialCommunityIcons name={getIcon(item.type)} size={24} color={getColor(item.type)} />
                        </View>
                        <View style={styles.cardText}>
                            <Text style={styles.cardTitle}>{item.title}</Text>
                            <Text style={styles.cardSubtitle} numberOfLines={2}>{item.subtitle}</Text>
                            <Text style={styles.cardTime}>{formatTime(item.time)}</Text>
                        </View>
                        <MaterialIcons name="chevron-right" size={20} color={colors.textSecondary} />
                    </TouchableOpacity>
                )}
                ListEmptyComponent={
                    <View style={styles.emptyState}>
                        <MaterialCommunityIcons name="bell-sleep-outline" size={48} color={isDark ? colors.secondary : "#CBD5E1"} />
                        <Text style={styles.emptyText}>No new notifications</Text>
                    </View>
                }
            />
        </View>
    );
}
