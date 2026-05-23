import { MaterialIcons } from '@expo/vector-icons';
import React from 'react';
import { Animated, Dimensions, Modal, Platform, Pressable, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { useTheme } from '../utils/ThemeContext';
import { Notice, subscribeToNotices } from '../utils/noticesSyncUtils';
import { CompactNoticeListSkeleton } from './SkeletonLists';
import AppText from './AppText';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');


interface NotificationOverlayProps {
    visible: boolean;
    onClose: () => void;
    lastClearedTimestamp: number;
    onClear: () => void;
}

export default function NotificationOverlay({ visible, onClose, lastClearedTimestamp, onClear }: NotificationOverlayProps) {
    const [notices, setNotices] = React.useState<Notice[]>([]);
    const [noticesLoading, setNoticesLoading] = React.useState(true);
    const { colors, isDark } = useTheme();

    const scale = React.useRef(new Animated.Value(0)).current;
    const opacity = React.useRef(new Animated.Value(0)).current;

    React.useEffect(() => {
        let unsubscribeNotices: (() => void) | undefined;

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

            setNoticesLoading(true);
            unsubscribeNotices = subscribeToNotices((data) => {
                setNotices(data);
                setNoticesLoading(false);
            });
        } else {
            scale.setValue(0.8); // Start smaller for next pop
            opacity.setValue(0);
        }

        return () => {
            if (unsubscribeNotices) unsubscribeNotices();
        };
    }, [visible]);

    const visibleNotices = React.useMemo(() => {
        return notices.filter(n => {
            const time = n.date instanceof Date ? n.date.getTime() : new Date(n.date).getTime();
            return !isNaN(time) && time > lastClearedTimestamp;
        });
    }, [notices, lastClearedTimestamp]);

    const handleClearNotifications = async () => {
        if (visibleNotices.length === 0) return;
        onClear();
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

    // ... helper functions ...
    const getPriorityColor = (priority?: string) => {
        const priorityColors: Record<string, string> = {
            low: '#10B981',      // Green
            medium: '#F59E0B',   // Yellow/Orange
            high: '#EF4444',     // Red
            emergency: '#7F1D1D', // Dark Red
        };
        return priorityColors[priority || 'low'] || '#3B82F6';
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
                        { translateY: Platform.OS === 'android' ? 30 : 0 } // Slight adjust
                    ]
                }
            ]}>
                {/* Arrow Pointer */}
                <View style={[styles.arrow, { borderBottomColor: colors.card }]} />

                <View style={[styles.container, { backgroundColor: colors.card, borderColor: colors.border }]}>
                    <View style={styles.headerCompact}>
                        <View style={[styles.headerTitleContainer, { flex: 1 }]}>
                            <AppText style={[styles.headerTitle, { color: colors.text }]}>Notifications</AppText>
                            {(visibleNotices.length > 0) && (
                                <View style={styles.badgeSmall}>
                                    <AppText style={styles.badgeText}>{visibleNotices.length}</AppText>
                                </View>
                            )}
                        </View>
                        <TouchableOpacity onPress={handleClearNotifications} style={styles.clearBtnCompact}>
                            <AppText style={[styles.clearBtnText, { color: colors.primary }]}>Clear</AppText>
                        </TouchableOpacity>
                    </View>

                    <ScrollView
                        style={styles.content}
                        contentContainerStyle={{ paddingBottom: 20 }}
                        showsVerticalScrollIndicator={true}
                    >
                        <View style={styles.section}>
                            {noticesLoading ? (
                                <CompactNoticeListSkeleton />
                            ) : visibleNotices.length > 0 ? (
                                visibleNotices.map((notice) => (
                                    <View
                                        key={notice.id}
                                        style={[styles.noticeItem, {
                                            borderBottomColor: colors.border
                                        }]}
                                    >
                                        {/* Icon Box */}
                                        <View style={[styles.noticeIcon, { backgroundColor: getPriorityColor(notice.priority) + '15' }]}>
                                            <MaterialIcons
                                                name={notice.priority === 'emergency' ? 'campaign' : 'notifications-none'}
                                                size={20}
                                                color={getPriorityColor(notice.priority)}
                                            />
                                        </View>

                                        {/* Content */}
                                        <View style={{ flex: 1, gap: 4 }}>
                                            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                                <AppText style={[styles.noticeTitle, { color: colors.text }]}>{notice.title}</AppText>
                                                {notice.priority === 'emergency' && (
                                                    <View style={styles.urgentBadge}>
                                                        <AppText style={styles.urgentText}>URGENT</AppText>
                                                    </View>
                                                )}
                                            </View>

                                            <AppText style={[styles.noticeBody, { color: colors.textSecondary }]} numberOfLines={3}>
                                                {notice.body}
                                            </AppText>

                                            <AppText style={[styles.noticeDate, { color: colors.textSecondary }]}>
                                                {notice.date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                            </AppText>
                                        </View>
                                    </View>
                                ))
                            ) : (
                                <View style={styles.emptyStateCompact}>
                                    <MaterialIcons name="notifications-paused" size={32} color={colors.textSecondary} style={{ opacity: 0.5, marginBottom: 8 }} />
                                    <AppText style={[styles.emptyText, { color: colors.textSecondary }]}>No new notices</AppText>
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
        top: 100,
        right: 20,
        width: 340,
        // maxHeight removed, controlled by inner container
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
        // flex: 1 removed to allow content to dictate height
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
        maxHeight: SCREEN_HEIGHT * 0.5, // ScrollView constrained here
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
    },
    noticeIcon: {
        width: 40,
        height: 40,
        borderRadius: 20,
        alignItems: 'center',
        justifyContent: 'center',
    },
    noticeTitle: {
        fontSize: 15,
        fontWeight: '600',
        marginBottom: 2,
        flex: 1,
    },
    noticeBody: {
        fontSize: 13,
        lineHeight: 18,
        marginBottom: 6,
    },
    noticeDate: {
        fontSize: 12,
        fontWeight: '500',
    },
    urgentBadge: {
        backgroundColor: '#FEF2F2',
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 4,
        borderWidth: 1,
        borderColor: '#FCA5A5',
    },
    urgentText: {
        color: '#EF4444',
        fontSize: 9,
        fontWeight: '800',
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
    closeButtonCompact: {},
    clearBtnCompact: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        backgroundColor: 'rgba(0,0,0,0.05)',
        borderRadius: 12,
    },
    clearBtnText: {
        fontSize: 12,
        fontWeight: '600',
    },
});

