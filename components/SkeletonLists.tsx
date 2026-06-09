import React from 'react';
import { StyleSheet, View } from 'react-native';
import { useThemeStore } from '../store/useThemeStore';
import Skeleton from './Skeleton';

export const StudentComplaintSkeleton = () => {
    const { colors, isDark } = useThemeStore();
    const styles = getStyles(colors, isDark);
    return (
        <View style={styles.card}>
            {/* Header: Title + Badge */}
            <View style={styles.header}>
                <Skeleton width="60%" height={20} borderRadius={6} />
                <Skeleton width={60} height={24} borderRadius={8} />
            </View>

            {/* Description lines */}
            <View style={{ gap: 8, marginBottom: 16 }}>
                <Skeleton width="100%" height={14} />
                <Skeleton width="90%" height={14} />
            </View>

            <View style={styles.divider} />

            {/* Footer: Date + Priority */}
            <View style={styles.footer}>
                <View style={{ flexDirection: 'row', gap: 6, alignItems: 'center' }}>
                    <Skeleton width={14} height={14} borderRadius={7} />
                    <Skeleton width={80} height={14} />
                </View>
                <Skeleton width={70} height={20} borderRadius={6} />
            </View>
        </View>
    );
};

export const AdminComplaintSkeleton = () => {
    const { colors, isDark } = useThemeStore();
    const styles = getStyles(colors, isDark);
    return (
        <View style={styles.card}>
            <View style={styles.adminHeader}>
                {/* Avatar */}
                <Skeleton width={48} height={48} borderRadius={24} />
                {/* Name + Title */}
                <View style={{ flex: 1, gap: 6 }}>
                    <Skeleton width={120} height={18} borderRadius={4} />
                    <Skeleton width="80%" height={14} borderRadius={4} />
                </View>
                {/* Status Badge */}
                <Skeleton width={32} height={32} borderRadius={16} />
            </View>
        </View>
    );
}

export const NoticeSkeleton = () => {
    const { colors, isDark } = useThemeStore();
    const styles = getStyles(colors, isDark);
    return (
        <View style={styles.card}>
            {/* Header */}
            <View style={styles.noticeHeader}>
                <Skeleton width={36} height={36} borderRadius={10} />
                <View style={{ flex: 1, gap: 4 }}>
                    <Skeleton width={150} height={16} borderRadius={4} />
                    <Skeleton width={80} height={12} borderRadius={4} />
                </View>
            </View>
            {/* Body */}
            <View style={{ gap: 6, marginTop: 12 }}>
                <Skeleton width="100%" height={14} />
                <Skeleton width="95%" height={14} />
                <Skeleton width="60%" height={14} />
            </View>
        </View>
    );
}

// Compact Skeleton for Popover
export const CompactNoticeSkeleton = () => {
    const { colors, isDark } = useThemeStore();
    const styles = getStyles(colors, isDark);
    return (
        <View style={[styles.card, { padding: 12, marginBottom: 8 }]}>
            <View style={{ flexDirection: 'row', gap: 10 }}>
                {/* Icon Placeholder */}
                <Skeleton width={32} height={32} borderRadius={10} />
                <View style={{ flex: 1, gap: 6 }}>
                    {/* Title */}
                    <Skeleton width="70%" height={14} borderRadius={4} />
                    {/* Date */}
                    <Skeleton width={60} height={10} borderRadius={4} />
                    {/* Body Lines */}
                    <View style={{ gap: 4, marginTop: 4 }}>
                        <Skeleton width="100%" height={10} />
                        <Skeleton width="90%" height={10} />
                    </View>
                </View>
            </View>
        </View>
    );
}


// Lists

export const StudentComplaintListSkeleton = () => (
    <View style={{ gap: 16 }}>
        {[1, 2, 3, 4].map((i) => (
            <StudentComplaintSkeleton key={i} />
        ))}
    </View>
);

export const AdminComplaintListSkeleton = () => (
    <View style={{ gap: 16 }}>
        {[1, 2, 3, 4, 5, 6].map((i) => (
            <AdminComplaintSkeleton key={i} />
        ))}
    </View>
);

export const NoticeListSkeleton = () => (
    <View style={{ gap: 10 }}>
        {[1, 2, 3].map((i) => (
            <NoticeSkeleton key={i} />
        ))}
    </View>
);

export const CompactNoticeListSkeleton = () => (
    <View style={{ gap: 10 }}>
        {[1, 2, 3].map((i) => (
            <CompactNoticeSkeleton key={i} />
        ))}
    </View>
);


export const DashboardSkeleton = () => {
    const { colors, isDark } = useThemeStore();
    const styles = getStyles(colors, isDark);
    return (
        <View style={{ flex: 1, padding: 20, gap: 24, width: '100%' }}>
            {/* Header Area */}
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <View style={{ gap: 8 }}>
                    <Skeleton width={120} height={20} borderRadius={4} />
                    <Skeleton width={180} height={28} borderRadius={6} />
                </View>
                <Skeleton width={56} height={56} borderRadius={28} />
            </View>

            {/* Stats Cards */}
            <View style={{ flexDirection: 'row', gap: 16 }}>
                <Skeleton width="48%" height={100} borderRadius={16} />
                <Skeleton width="48%" height={100} borderRadius={16} />
            </View>

            {/* Quick Actions */}
            <View style={{ gap: 12 }}>
                <Skeleton width={140} height={20} borderRadius={4} />
                <View style={{ flexDirection: 'row', gap: 16 }}>
                    <Skeleton width={70} height={70} borderRadius={16} />
                    <Skeleton width={70} height={70} borderRadius={16} />
                    <Skeleton width={70} height={70} borderRadius={16} />
                    <Skeleton width={70} height={70} borderRadius={16} />
                </View>
            </View>

            {/* Recent Activity / Menu */}
            <View style={{ gap: 16, marginTop: 10 }}>
                <Skeleton width="100%" height={150} borderRadius={16} />
                <Skeleton width="100%" height={80} borderRadius={16} />
            </View>
        </View>
    );
};


export const ProfileSkeleton = () => {
    const { colors, isDark } = useThemeStore();
    return (
        <View style={{ flex: 1, backgroundColor: colors.background }}>
            {/* Header / Avatar */}
            <View style={{ alignItems: 'center', marginTop: 80, gap: 16 }}>
                <Skeleton width={120} height={120} borderRadius={60} />
                <Skeleton width={160} height={24} borderRadius={4} />
                <Skeleton width={100} height={16} borderRadius={4} />
            </View>

            {/* Info Cards */}
            <View style={{ padding: 20, gap: 16, marginTop: 20 }}>
                {/* Basic Details Card */}
                <View style={{ backgroundColor: colors.card, padding: 20, borderRadius: 16, gap: 16 }}>
                    <Skeleton width={100} height={16} borderRadius={4} />
                    <View style={{ gap: 12 }}>
                        <Skeleton width="100%" height={20} borderRadius={4} />
                        <Skeleton width="80%" height={20} borderRadius={4} />
                        <Skeleton width="90%" height={20} borderRadius={4} />
                    </View>
                </View>

                {/* Parent Details Card */}
                <View style={{ backgroundColor: colors.card, padding: 20, borderRadius: 16, gap: 16 }}>
                    <Skeleton width={120} height={16} borderRadius={4} />
                    <View style={{ gap: 12 }}>
                        <Skeleton width="100%" height={20} borderRadius={4} />
                        <Skeleton width="70%" height={20} borderRadius={4} />
                    </View>
                </View>
            </View>
        </View>
    );
};

export const SettingsSkeleton = () => {
    const { colors, isDark } = useThemeStore();
    return (
        <View style={{ flex: 1, backgroundColor: colors.background, paddingHorizontal: 24, paddingTop: 40 }}>
            {/* Header */}
            <View style={{ marginBottom: 48, gap: 12 }}>
                <Skeleton width={200} height={44} borderRadius={8} />
                <Skeleton width="80%" height={20} borderRadius={4} />
            </View>

            {/* List items */}
            <View style={{ gap: 30 }}>
                {[1, 2, 3, 4, 5].map((i) => (
                    <View key={i} style={{ flexDirection: 'row', alignItems: 'center', gap: 16 }}>
                        <Skeleton width={48} height={48} borderRadius={24} />
                        <View style={{ flex: 1, gap: 8 }}>
                            <Skeleton width={140} height={18} borderRadius={4} />
                            <Skeleton width="90%" height={14} borderRadius={4} />
                        </View>
                        <Skeleton width={50} height={30} borderRadius={15} />
                    </View>
                ))}
            </View>
        </View>
    );
};

const getStyles = (colors: any, isDark: boolean) => StyleSheet.create({
    card: {
        backgroundColor: colors.card,
        borderRadius: 16,
        padding: 16,
        borderWidth: 1,
        borderColor: colors.border,
        marginBottom: 0,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 12,
    },
    adminHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 14,
    },
    noticeHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12
    },
    divider: {
        height: 1,
        backgroundColor: colors.border,
        marginBottom: 12,
    },
    footer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
});
