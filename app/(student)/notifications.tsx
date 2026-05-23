import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, RefreshControl, StyleSheet, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StudentNotification, clearStudentNotifications, subscribeToStudentNotifications } from '../../utils/notificationUtils';
import { useTheme } from '../../utils/ThemeContext';
import AppText from '../../components/AppText';

export default function StudentNotifications() {
    const { colors, theme } = useTheme();
    const insets = useSafeAreaInsets();
    const router = useRouter();
    const [notifications, setNotifications] = useState<StudentNotification[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    useEffect(() => {
        setLoading(true);
        const unsubscribe = subscribeToStudentNotifications((data) => {
            setNotifications(data);
            setLoading(false);
            setRefreshing(false);
        });
        return () => { if (unsubscribe) unsubscribe(); };
    }, []);

    const onRefresh = () => {
        setRefreshing(true);
        // Subscription will update on next poll, but force immediate fetch
        subscribeToStudentNotifications((data) => {
            setNotifications(data);
            setRefreshing(false);
        });
    };

    const handleClearAll = async () => {
        try {
            await clearStudentNotifications();
            setNotifications([]);
        } catch (error) {
            console.error('Clear Notifs Error:', error);
        }
    };


    const getIcon = (type: string) => {
        switch (type) {
            case 'bus': return 'bus-alert';
            case 'emergency': return 'ambulance';
            case 'message': return 'message-text-outline';
            case 'leave': return 'calendar-account';
            case 'complaint': return 'alert-circle-outline';
            case 'service': return 'tools';
            case 'notice': return 'bullhorn-outline';
            case 'mess': return 'silverware-fork-knife';
            default: return 'bell-outline';
        }
    };

    const getColor = (type: string) => {
        switch (type) {
            case 'bus': return '#F59E0B';
            case 'emergency': return '#EF4444';
            case 'message': return '#3B82F6';
            case 'leave': return '#10B981';
            case 'complaint': return '#F97316';
            case 'service': return '#8B5CF6';
            case 'notice': return '#EC4899';
            case 'mess': return '#F59E0B'; // Amber
            default: return colors.primary;
        }
    };

    const handlePress = (item: Notification) => {
        switch (item.type) {
            case 'bus':
                router.push('/bustimings');
                break;
            case 'emergency':
                router.push('/(tabs)/emergency');
                break;
            case 'message':
                router.push('/chat');
                break;
            case 'leave':
                router.push('/leave-request');
                break;
            case 'complaint':
                router.push('/my-complaints');
                break;
            case 'service':
                router.push('/roomservice');
                break;
            case 'notice':
                router.push('/alerts');
                break;
            case 'mess':
                // @ts-ignore
                const p = new URLSearchParams({ tab: 'menu' });
                // @ts-ignore
                if (item.data?.day) p.append('day', item.data.day);
                // @ts-ignore
                if (item.data?.meal) p.append('target', item.data.meal);
                router.push(`/mess?${p.toString()}`);
                break;
            default:
                break;
        }
    };

    const renderItem = ({ item }: { item: Notification }) => (
        <TouchableOpacity
            style={[styles.card, { backgroundColor: colors.card }]}
            activeOpacity={0.8}
            onPress={() => handlePress(item)}
        >
            <View style={[styles.iconContainer, { backgroundColor: `${getColor(item.type)}15` }]}>
                <MaterialCommunityIcons name={getIcon(item.type) as any} size={24} color={getColor(item.type)} />
            </View>
            <View style={styles.textContainer}>
                <AppText style={[styles.title, { color: colors.text }]}>{item.title}</AppText>
                <AppText style={[styles.subtitle, { color: colors.textSecondary }]}>{item.subtitle}</AppText>
                <AppText style={[styles.time, { color: colors.textSecondary }]}>
                    {new Date(item.time).toLocaleString()}
                </AppText>
            </View>
        </TouchableOpacity>
    );

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            <LinearGradient
                colors={[colors.primary, '#1E3A8A']}
                style={[styles.header, { paddingTop: insets.top + 20 }]}
            >
                <View style={styles.headerTop}>
                    <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                        <MaterialIcons name="arrow-back" size={24} color="#fff" />
                    </TouchableOpacity>
                    <AppText style={styles.headerTitle}>Notifications</AppText>
                    {notifications.length > 0 && (
                        <TouchableOpacity onPress={handleClearAll} style={styles.clearBtn}>
                            <AppText style={styles.clearText}>Clear All</AppText>
                        </TouchableOpacity>
                    )}
                    {notifications.length === 0 && <View style={{ width: 60 }} />}
                </View>
            </LinearGradient>

            {loading ? (
                <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: 50 }} />
            ) : (
                <FlatList
                    data={notifications}
                    renderItem={renderItem}
                    keyExtractor={item => item.id}
                    contentContainerStyle={{ padding: 20 }}
                    refreshControl={
                        <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchNotifications(); }} tintColor={colors.primary} />
                    }
                    ListEmptyComponent={
                        <View style={styles.emptyContainer}>
                            <MaterialCommunityIcons name="bell-sleep-outline" size={60} color={colors.textSecondary} style={{ opacity: 0.5 }} />
                            <AppText style={[styles.emptyText, { color: colors.textSecondary }]}>No new notifications</AppText>
                        </View>
                    }
                />
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        paddingBottom: 20,
        paddingHorizontal: 20,
        borderBottomLeftRadius: 24,
        borderBottomRightRadius: 24,
    },
    headerTop: {
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
    headerTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#fff',
    },
    clearBtn: {
        backgroundColor: 'rgba(255,255,255,0.2)',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 16,
    },
    clearText: {
        color: '#fff',
        fontSize: 12,
        fontWeight: '600',
    },
    card: {
        flexDirection: 'row',
        padding: 16,
        borderRadius: 16,
        marginBottom: 12,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOpacity: 0.05,
        shadowOffset: { width: 0, height: 2 },
        shadowRadius: 8,
        elevation: 2,
    },
    iconContainer: {
        width: 48,
        height: 48,
        borderRadius: 24,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
    },
    textContainer: {
        flex: 1,
    },
    title: {
        fontSize: 16,
        fontWeight: '700',
        marginBottom: 4,
    },
    subtitle: {
        fontSize: 14,
        marginBottom: 6,
        lineHeight: 20,
    },
    time: {
        fontSize: 12,
        opacity: 0.7,
    },
    emptyContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingTop: 100,
        gap: 16
    },
    emptyText: {
        fontSize: 16,
        fontWeight: '500'
    }
});
