import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React from 'react';
import { Animated, Dimensions, Modal, Platform, Pressable, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { AdminNotification, clearNotifications, getAdminNotifications, subscribeToNotifications } from '../utils/notificationUtils';
import { useTheme } from '../utils/ThemeContext';
import { CompactNoticeListSkeleton } from './SkeletonLists';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

interface AdminNotificationOverlayProps {
    visible: boolean;
    onClose: () => void;
}

export default function AdminNotificationOverlay({ visible, onClose }: AdminNotificationOverlayProps) {
    const [notifications, setNotifications] = React.useState<AdminNotification[]>([]);
    const [loading, setLoading] = React.useState(true);
    const { colors, theme } = useTheme();
    const router = useRouter();

    const scale = React.useRef(new Animated.Value(0)).current;
    const opacity = React.useRef(new Animated.Value(0)).current;

    React.useEffect(() => {
        let unsubscribe: (() => void) | undefined;

        if (visible) {
            // Animate In - Quick Pop
            Animated.parallel([
                Animated.spring(scale, {
                    toValue: 1,
                    useNativeDriver: true,
                    damping: 20,
                    stiffness: 200,
                }),
                Animated.timing(opacity, {
                    toValue: 1,
                    duration: 150,
                    useNativeDriver: true,
                })
            ]).start();

            setLoading(true);

            // Subscribe to notifications
            const fetchInitial = async () => {
                const data = await getAdminNotifications();
                setNotifications(data);
                setLoading(false);
            };
            fetchInitial();

            // Set up polling interval similar to the page logic, or reuse subscribe function if it returns unsubscribe
            // The utils show subscribeToNotifications returns a cleanup function for interval
            unsubscribe = subscribeToNotifications((data) => {
                setNotifications(data);
                setLoading(false);
            });

        } else {
            scale.setValue(0.8); // Start smaller for next pop
            opacity.setValue(0);
        }

        return () => {
            if (unsubscribe) unsubscribe();
        };
    }, [visible]);

    const handleClear = async () => {
        if (notifications.length === 0) return;

        // Optimistic update
        const prev = [...notifications];
        setNotifications([]);

        const success = await clearNotifications();
        if (!success) {
            setNotifications(prev); // Revert if failed
        }
    };

    const handleClose = () => {
        Animated.parallel([
            Animated.timing(opacity, {
                toValue: 0,
                duration: 100,
                useNativeDriver: true,
            })
        ]).start(() => onClose());
    };

    const handlePress = (item: AdminNotification) => {
        handleClose(); // Close overlay first

        // Small timeout to allow animation to start closing before navigation
        setTimeout(() => {
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
                    console.warn('Unknown notification type:', item.type);
            }
        }, 50);
    };

    const getIcon = (type: string) => {
        switch (type) {
            case 'message': return 'message-text-outline';
            case 'complaint': return 'alert-circle-outline';
            case 'leave': return 'calendar-clock';
            case 'laundry': return 'washing-machine';
            case 'service': return 'room-service-outline';
            default: return 'bell-outline';
        }
    };

    const getColor = (type: string) => {
        switch (type) {
            case 'message': return '#3B82F6';
            case 'complaint': return '#EF4444';
            case 'leave': return '#8B5CF6';
            case 'laundry': return '#06B6D4';
            case 'service': return '#F59E0B';
            default: return colors.primary;
        }
    };

    return (
        <Modal
            animationType="none"
            transparent={true}
            visible={visible}
            onRequestClose={handleClose}
        >
            <Pressable style={styles.backdrop} onPress={handleClose} />

            <Animated.View style={[
                styles.popoverContainer,
                {
                    opacity: opacity,
                    transform: [
                        { scale: scale },
                        { translateY: Platform.OS === 'android' ? 30 : 0 }
                    ]
                }
            ]}>
                {/* Arrow Pointer */}
                <View style={[styles.arrow, { borderBottomColor: colors.card }]} />

                <View style={[styles.container, { backgroundColor: colors.card, borderColor: colors.border }]}>
                    <View style={styles.headerCompact}>
                        <View style={[styles.headerTitleContainer, { flex: 1 }]}>
                            <Text style={[styles.headerTitle, { color: colors.text }]}>Notifications</Text>
                            {(notifications.length > 0) && (
                                <View style={styles.badgeSmall}>
                                    <Text style={styles.badgeText}>{notifications.length}</Text>
                                </View>
                            )}
                        </View>
                        {notifications.length > 0 && (
                            <TouchableOpacity onPress={handleClear} style={styles.clearBtnCompact}>
                                <Text style={[styles.clearBtnText, { color: colors.primary }]}>Clear All</Text>
                            </TouchableOpacity>
                        )}
                    </View>

                    <ScrollView
                        style={styles.content}
                        contentContainerStyle={{ paddingBottom: 20 }}
                        showsVerticalScrollIndicator={true}
                    >
                        <View style={styles.section}>
                            {loading ? (
                                <CompactNoticeListSkeleton />
                            ) : notifications.length > 0 ? (
                                notifications.map((item) => (
                                    <TouchableOpacity
                                        key={item.id}
                                        style={[styles.noticeItem, { borderBottomColor: colors.border }]}
                                        onPress={() => handlePress(item)}
                                    >
                                        {/* Icon Box */}
                                        <View style={[styles.noticeIcon, { backgroundColor: getColor(item.type) + '15' }]}>
                                            <MaterialCommunityIcons
                                                name={getIcon(item.type) as any}
                                                size={20}
                                                color={getColor(item.type)}
                                            />
                                        </View>

                                        {/* Content */}
                                        <View style={{ flex: 1, gap: 4 }}>
                                            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                                <Text style={[styles.noticeTitle, { color: colors.text }]}>{item.title}</Text>
                                                <Text style={[styles.noticeDate, { color: colors.textSecondary }]}>
                                                    {new Date(item.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                </Text>
                                            </View>

                                            <Text style={[styles.noticeBody, { color: colors.textSecondary }]} numberOfLines={2}>
                                                {item.subtitle}
                                            </Text>
                                        </View>
                                    </TouchableOpacity>
                                ))
                            ) : (
                                <View style={styles.emptyStateCompact}>
                                    <MaterialCommunityIcons name="bell-sleep-outline" size={32} color={colors.textSecondary} style={{ opacity: 0.5, marginBottom: 8 }} />
                                    <Text style={[styles.emptyText, { color: colors.textSecondary }]}>No new notifications</Text>
                                </View>
                            )}
                        </View>
                    </ScrollView>
                </View>
            </Animated.View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    backdrop: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0,0,0,0.2)',
    },
    popoverContainer: {
        position: 'absolute',
        top: 90, // Adjusted for Admin Header height
        right: 20,
        width: 320,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.25,
        shadowRadius: 20,
        elevation: 20,
        zIndex: 100,
    },
    arrow: {
        position: 'absolute',
        top: -10,
        right: 15,
        width: 0,
        height: 0,
        backgroundColor: 'transparent',
        borderStyle: 'solid',
        borderLeftWidth: 10,
        borderRightWidth: 10,
        borderBottomWidth: 10,
        borderLeftColor: 'transparent',
        borderRightColor: 'transparent',
        borderBottomColor: '#fff',
        zIndex: 200,
    },
    container: {
        borderRadius: 24,
        borderWidth: 1,
        overflow: 'hidden',
    },
    headerCompact: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingTop: 20,
        paddingBottom: 16,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(0,0,0,0.05)',
    },
    headerTitleContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '700',
    },
    badgeSmall: {
        backgroundColor: '#EF4444',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12,
    },
    badgeText: {
        color: '#fff',
        fontSize: 11,
        fontWeight: 'bold',
    },
    content: {
        maxHeight: SCREEN_HEIGHT * 0.5,
    },
    section: {
        paddingHorizontal: 0,
    },
    noticeItem: {
        flexDirection: 'row',
        padding: 16,
        gap: 12,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(0,0,0,0.05)',
        alignItems: 'center',
    },
    noticeIcon: {
        width: 40,
        height: 40,
        borderRadius: 20,
        alignItems: 'center',
        justifyContent: 'center',
    },
    noticeTitle: {
        fontSize: 14,
        fontWeight: '700',
        marginBottom: 2,
        flex: 1,
    },
    noticeBody: {
        fontSize: 13,
        lineHeight: 18,
    },
    noticeDate: {
        fontSize: 11,
        fontWeight: '500',
        marginLeft: 8,
    },
    emptyStateCompact: {
        padding: 40,
        alignItems: 'center',
        justifyContent: 'center',
    },
    emptyText: {
        fontSize: 14,
        fontWeight: '500',
    },
    clearBtnCompact: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        borderRadius: 12,
    },
    clearBtnText: {
        fontSize: 12,
        fontWeight: '600',
    },
});
