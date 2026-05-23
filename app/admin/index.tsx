import MaterialIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import { Alert, Dimensions, RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
    interpolate,
    runOnJS,
    useAnimatedStyle,
    useSharedValue,
    withSpring
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AdminNotificationOverlay from '../../components/AdminNotificationOverlay';
import AdminSidebar from '../../components/AdminSidebar';

import { useRefresh } from '../../hooks/useRefresh';
import { performGlobalSearch, SearchResult } from '../../utils/adminSearchUtils';
import { isAdmin, useUser } from '../../utils/authUtils';
import { Complaint, subscribeToAllComplaints, updateComplaintStatus } from '../../utils/complaintsSyncUtils';
import { LeaveRequest, subscribeToPendingLeaves, updateLeaveStatus } from '../../utils/leavesUtils';
import { subscribeToNotifications } from '../../utils/notificationUtils';
import { useTheme } from '../../utils/ThemeContext';
import AppText from '../../components/AppText';

import AdminPortal from './portals/AdminPortal';
import CleaningPortal from './portals/CleaningPortal';
import MessPortal from './portals/MessPortal';
import LaundryPortal from './portals/LaundryPortal';
import GuardPortal from './portals/GuardPortal';
import MaintenancePortal from './portals/MaintenancePortal';
import WardenPortal from './portals/WardenPortal';

const debounce = require('lodash.debounce');
const { width: SCREEN_WIDTH } = Dimensions.get('window');
const DRAWER_WIDTH = SCREEN_WIDTH * 0.8;

export default function AdminDashboard() {
    const { colors, theme, toggleTheme, isDark } = useTheme();
    const insets = useSafeAreaInsets();
    const user = useUser();
    const router = useRouter();

    const [activeNav, setActiveNav] = useState('dashboard');
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [notificationVisible, setNotificationVisible] = useState(false);
    const [recentComplaints, setRecentComplaints] = useState<Complaint[]>([]);
    const [pendingLeaves, setPendingLeaves] = useState<LeaveRequest[]>([]);
    const [activePagingIndex, setActivePagingIndex] = useState(0);
    const [loadingActions, setLoadingActions] = useState<Record<string, string>>({});
    const [unreadCount, setUnreadCount] = useState(0);
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const searchRef = React.useRef('');

    const drawerProgress = useSharedValue(0);
    const isSidebarOpenSV = useSharedValue(sidebarOpen ? 1 : 0);

    useEffect(() => {
        isSidebarOpenSV.value = sidebarOpen ? 1 : 0;
    }, [sidebarOpen]);

    const panGesture = Gesture.Pan()
        .activeOffsetX([-20, 20])
        .failOffsetY([-20, 20])
        .onUpdate((e) => {
            const isOpen = isSidebarOpenSV.value === 1;
            const targetValue = isOpen ? 1 + (e.translationX / DRAWER_WIDTH) : (e.translationX / DRAWER_WIDTH);
            drawerProgress.value = Math.min(Math.max(targetValue, 0), 1);
        })
        .onEnd((e) => {
            const isOpen = isSidebarOpenSV.value === 1;
            let shouldOpen = isOpen;
            if (Math.abs(e.translationX) > 40) {
                if (Math.abs(e.velocityX) > 500) shouldOpen = e.velocityX > 0;
                else shouldOpen = drawerProgress.value > 0.5;
            } else shouldOpen = isOpen;
            drawerProgress.value = withSpring(shouldOpen ? 1 : 0);
            runOnJS(setSidebarOpen)(shouldOpen);
        });

    useEffect(() => {
        drawerProgress.value = withSpring(sidebarOpen ? 1 : 0);
    }, [sidebarOpen]);

    const contentStyle = useAnimatedStyle(() => ({
        flex: 1,
        transform: [{ translateX: interpolate(drawerProgress.value, [0, 1], [0, DRAWER_WIDTH + 7]) }],
        borderRadius: interpolate(drawerProgress.value, [0, 1], [0, 20]),
        overflow: 'hidden',
    }));

    const { refreshing, onRefresh } = useRefresh(async () => {
        await new Promise(resolve => setTimeout(resolve, 1000));
    });

    const debouncedSearch = useCallback(
        debounce(async (text: string) => {
            if (text.length < 1) { setSearchResults([]); setIsSearching(false); return; }
            setIsSearching(true);
            const results = await performGlobalSearch(text);
            if (searchRef.current !== text) return;
            setSearchResults(results);
            setIsSearching(false);
        }, 300),
        []
    );

    const handleSearch = (text: string) => {
        setSearchQuery(text);
        searchRef.current = text;
        if (!text) { setSearchResults([]); setIsSearching(false); debouncedSearch.cancel(); return; }
        debouncedSearch(text);
    };

    const handleSearchResultPress = (result: SearchResult) => {
        setSearchQuery('');
        setSearchResults([]);
        if (result.type === 'student') router.push({ pathname: '/admin/students', params: { search: result.title, openId: result.id } });
        else if (result.type === 'room') router.push({ pathname: '/admin/rooms', params: { search: result.title.replace('Room ', ''), openRoomId: result.id } });
        else if (result.type === 'complaint') router.push('/admin/complaints');
    };

    const handleComplaintAction = async (id: string, status: 'inProgress' | 'resolved') => {
        const actionKey = `complaint-${id}`;
        setLoadingActions(prev => ({ ...prev, [actionKey]: status }));
        try {
            await updateComplaintStatus(id, status);
            Alert.alert('Success', `Complaint marked as ${status}`);
        } catch (e) {
            Alert.alert('Error', 'Failed to update complaint.');
        } finally {
            setLoadingActions(prev => { const next = { ...prev }; delete next[actionKey]; return next; });
        }
    };

    const handleLeaveAction = async (id: string, status: 'approved' | 'rejected') => {
        const actionKey = `leave-${id}`;
        setLoadingActions(prev => ({ ...prev, [actionKey]: status }));
        try {
            await updateLeaveStatus(id, status);
            Alert.alert('Success', `Leave ${status}`);
        } catch (e) {
            Alert.alert('Error', 'Failed to update leave.');
        } finally {
            setLoadingActions(prev => { const next = { ...prev }; delete next[actionKey]; return next; });
        }
    };

    useEffect(() => {
        if (!isAdmin(user)) return;
        const unsubComplaints = subscribeToAllComplaints((data) => {
            setRecentComplaints(data.filter(c => c.status !== 'closed' && c.status !== 'resolved').slice(0, 3));
        });
        const unsubLeaves = subscribeToPendingLeaves((data) => {
            setPendingLeaves(data.slice(0, 3));
        });
        const unsubNotifs = subscribeToNotifications((data) => {
            setUnreadCount(data.length);
        });
        return () => {
            unsubComplaints();
            unsubLeaves();
            unsubNotifs();
        };
    }, [user]);

    const handleNavPress = (id: string) => {
        setActiveNav(id);
        setSidebarOpen(false);
        if (id === 'services') router.push('/admin/services');
        else router.push(`/admin/${id === 'students' ? 'students' : id === 'rooms' ? 'rooms' : id === 'complaints' ? 'complaints' : id === 'leaves' ? 'leaveRequests' : 'notices'}`);
    };

    if (!isAdmin(user)) {
        return (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                <AppText style={{ fontSize: 16 }}>Access denied. Admins only.</AppText>
            </View>
        );
    }

    const renderPortal = () => {
        const role = user?.role;
        const commonProps = {
            user, isDark, colors, theme, toggleTheme,
            sidebarOpen, setSidebarOpen,
            setNotificationVisible, unreadCount,
            searchQuery, setSearchQuery, handleSearch,
            isSearching, searchResults, handleSearchResultPress,
            refreshing, onRefresh,
            recentComplaints, pendingLeaves,
            activePagingIndex, setActivePagingIndex,
            handleNavPress, handleComplaintAction, handleLeaveAction,
            loadingActions
        };

        switch (role) {
            case 'warden': return <WardenPortal {...commonProps} />;
            case 'cleaning_staff': return <CleaningPortal {...commonProps} />;
            case 'mess_staff': return <MessPortal {...commonProps} />;
            case 'laundry_staff': return <LaundryPortal {...commonProps} />;
            case 'guard': return <GuardPortal {...commonProps} />;
            case 'maintenance_staff': return <MaintenancePortal {...commonProps} />;
            default: return <AdminPortal {...commonProps} />;
        }
    };

    return (
        <GestureDetector gesture={panGesture}>
            <View style={{ flex: 1, backgroundColor: '#000212', position: 'relative' }}>
                <AdminSidebar
                    onClose={() => setSidebarOpen(false)}
                    activeNav={activeNav}
                    drawerProgress={drawerProgress}
                />

                <AdminNotificationOverlay
                    visible={notificationVisible}
                    onClose={() => setNotificationVisible(false)}
                />

                <Animated.View style={[contentStyle, { flex: 1 }]}>
                    <LinearGradient
                        colors={isDark ? ['#020617', '#0f172a'] : [colors.background, colors.background]}
                        style={StyleSheet.absoluteFill}
                    />
                    {renderPortal()}
                </Animated.View>
            </View>
        </GestureDetector>
    );
}
