import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React from 'react';
import { Animated, Dimensions, Modal, Platform, Pressable, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import api from '../utils/api';
import { CompactNoticeListSkeleton } from './SkeletonLists';
import AppText from './AppText';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

interface StudentNotification {
    id: string;
    type: 'bus' | 'emergency' | 'message' | 'leave' | 'complaint' | 'service' | 'notice' | 'mess' | 'payment' | 'laundry' | 'visitor';
    title: string;
    subtitle: string;
    time: string;
    read: boolean;
}

interface StudentNotificationOverlayProps {
    visible: boolean;
    onClose: () => void;
}

export default function StudentNotificationOverlay({ visible, onClose }: StudentNotificationOverlayProps) {
    const [notifications, setNotifications] = React.useState<StudentNotification[]>([]);
    const [loading, setLoading] = React.useState(true);
    const router = useRouter();

    const scale = React.useRef(new Animated.Value(0)).current;
    const opacity = React.useRef(new Animated.Value(0)).current;

    React.useEffect(() => {
        if (visible) {
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

            fetchNotifications();
        } else {
            scale.setValue(0.8);
            opacity.setValue(0);
        }
    }, [visible]);

    const fetchNotifications = async () => {
        setLoading(true);
        try {
            const res = await api.get('/notifications/student');
            setNotifications(res.data);
        } catch (error) {
            console.error('Fetch Notifs Error:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleClear = async () => {
        if (notifications.length === 0) return;
        const prev = [...notifications];
        setNotifications([]);

        try {
            await api.post('/notifications/student/clear');
        } catch (error) {
            console.error('Clear Notifs Error:', error);
            setNotifications(prev);
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

    const handlePress = (item: StudentNotification) => {
        handleClose();
        setTimeout(() => {
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
                    const params = new URLSearchParams({ tab: 'menu' });
                    // @ts-ignore
                    if (item.data?.day) params.append('day', item.data.day);
                    // @ts-ignore
                    if (item.data?.meal) params.append('target', item.data.meal);

                    router.push(`/mess?${params.toString()}`);
                    break;
                default:
                    break;
            }
        }, 50);
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
                <View style={styles.container}>
                    <View style={styles.headerCompact}>
                        <View style={styles.headerTitleContainer}>
                            <AppText style={styles.headerTitle}>Notifications</AppText>
                            {(notifications.length > 0) && (
                                <View style={styles.badgeSmall}>
                                    <AppText style={styles.badgeText}>{notifications.length}</AppText>
                                </View>
                            )}
                        </View>
                        {notifications.length > 0 && (
                            <TouchableOpacity onPress={handleClear} style={styles.clearBtnCompact}>
                                <AppText style={styles.clearBtnText}>Clear All</AppText>
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
                                        style={styles.noticeItem}
                                        onPress={() => handlePress(item)}
                                    >
                                        <View style={styles.noticeIcon}>
                                            <MaterialCommunityIcons
                                                name={getIcon(item.type) as any}
                                                size={22}
                                                color="#FFFFFF"
                                            />
                                        </View>

                                        <View style={{ flex: 1, gap: 4 }}>
                                            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                                <AppText style={styles.noticeTitle}>{item.title}</AppText>
                                                <AppText style={styles.noticeDate}>
                                                    {new Date(item.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                </AppText>
                                            </View>
                                            <AppText style={styles.noticeBody} numberOfLines={2}>
                                                {item.subtitle}
                                            </AppText>
                                        </View>
                                    </TouchableOpacity>
                                ))
                            ) : (
                                <View style={styles.emptyStateCompact}>
                                    <MaterialCommunityIcons name="bell-sleep-outline" size={32} color="#666666" style={{ opacity: 0.5, marginBottom: 8 }} />
                                    <AppText style={styles.emptyText}>No new notifications</AppText>
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
        top: 0, left: 0, right: 0, bottom: 0,
        backgroundColor: 'rgba(0,0,0,0.6)',
    },
    popoverContainer: {
        position: 'absolute',
        top: 90,
        right: 20,
        width: 340,
        zIndex: 100,
    },
    container: {
        backgroundColor: '#000000',
        borderRadius: 24,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.15)',
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
        borderBottomColor: 'rgba(255,255,255,0.1)',
    },
    headerTitleContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        flex: 1,
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: '800',
        color: '#FFFFFF',
        letterSpacing: -0.5,
    },
    badgeSmall: {
        backgroundColor: '#FFFFFF',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12,
    },
    badgeText: {
        color: '#000000',
        fontSize: 11,
        fontWeight: '900',
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
        gap: 14,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255,255,255,0.1)',
        alignItems: 'center',
    },
    noticeIcon: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: 'rgba(255,255,255,0.05)',
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
    },
    noticeTitle: {
        fontSize: 15,
        fontWeight: '700',
        color: '#FFFFFF',
        flex: 1,
    },
    noticeBody: {
        fontSize: 13,
        lineHeight: 18,
        color: '#A1A1AA',
    },
    noticeDate: {
        fontSize: 11,
        fontWeight: '600',
        color: '#666666',
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
        color: '#666666',
    },
    clearBtnCompact: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        backgroundColor: 'rgba(255,255,255,0.1)',
        borderRadius: 12,
    },
    clearBtnText: {
        fontSize: 12,
        fontWeight: '800',
        color: '#FFFFFF',
    },
});
