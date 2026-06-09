import { MaterialCommunityIcons, MaterialIcons } from '@expo/vector-icons';
import { Stack, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, RefreshControl, SectionList, StyleSheet, TouchableOpacity, View } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withTiming, Easing } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import VisitorPassModal from '../components/VisitorPassModal';
import { useAlert } from '../context/AlertContext';
import { useRefresh } from '../hooks/useRefresh';
import { cancelVisitor, formatDate, formatTime, getMyVisitors, getStatusColor, getStatusLabel, Visitor } from '../utils/visitorUtils';
import { useTheme } from '../utils/ThemeContext';
import AppText from '../components/AppText';

export default function MyVisitors() {
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const { showAlert } = useAlert();
    const { isDark } = useTheme();

    const [visitors, setVisitors] = useState<Visitor[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedVisitor, setSelectedVisitor] = useState<Visitor | null>(null);
    const [showPassModal, setShowPassModal] = useState(false);

    // Dynamic Theme Map
    const themeBg = isDark ? '#000000' : '#F8FAFC';
    const textMain = isDark ? '#FFFFFF' : '#111111';
    const textMuted = isDark ? '#888888' : '#64748B';
    const textSecondary = isDark ? '#CCCCCC' : '#475569';
    const borderSubtle = isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)';
    const boxBg = isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)';
    const fabBg = isDark ? '#FFFFFF' : '#111111';
    const fabText = isDark ? '#000000' : '#FFFFFF';
    const primaryBtnBg = isDark ? '#FFFFFF' : '#111111';
    const primaryBtnText = isDark ? '#000000' : '#FFFFFF';

    const { refreshing, onRefresh } = useRefresh(loadVisitors);

    useEffect(() => { loadVisitors(); }, []);

    async function loadVisitors() {
        try { setLoading(true); const data = await getMyVisitors(); setVisitors(data); } catch (error) { console.error(error); } finally { setLoading(false); }
    }

    const handleCancelVisitor = (visitor: Visitor) => {
        showAlert('Cancel Visitor', `Are you sure you want to cancel the visitor request for ${visitor.visitor_name}?`, [
            { text: 'No', style: 'cancel' },
            { text: 'Yes, Cancel', onPress: async () => { try { await cancelVisitor(visitor.id); showAlert('Success', 'Visitor request cancelled', [], 'success'); loadVisitors(); } catch (error) { showAlert('Error', 'Failed to cancel visitor', [], 'error'); } } }
        ], 'warning');
    };

    const handleViewPass = (visitor: Visitor) => { setSelectedVisitor(visitor); setShowPassModal(true); };

    const getSections = () => {
        const active = visitors.filter(v => ['pending', 'approved', 'checked_in'].includes(v.status));
        const history = visitors.filter(v => ['checked_out', 'rejected', 'cancelled'].includes(v.status));
        const sections = [];
        if (active.length > 0) sections.push({ title: 'ACTIVE & UPCOMING', data: active });
        if (history.length > 0) sections.push({ title: 'HISTORY', data: history });
        return sections;
    };

    const sections = getSections();

    const renderVisitorCard = ({ item: visitor }: { item: Visitor }) => (
        <View style={[styles.historyRow, { borderColor: borderSubtle }]}>
            <View style={{ flex: 1 }}>
                <AppText style={[styles.visitorName, { color: textMain }]}>{visitor.visitor_name}</AppText>
                <AppText style={[styles.visitorPhone, { color: textMuted }]}>{visitor.visitor_phone}</AppText>
                {visitor.visitor_relation ? <AppText style={styles.visitorRelation}>{visitor.visitor_relation}</AppText> : null}
                <AppText style={[styles.purpose, { color: textSecondary }]}>{visitor.purpose}</AppText>

                <View style={styles.dateInfo}>
                    <AppText style={[styles.historyDate, { color: textMain }]}>{formatDate(visitor.expected_date)}</AppText>
                    <MaterialCommunityIcons name="circle-small" size={16} color={textMuted} />
                    <AppText style={styles.durationText}>{visitor.expected_time_in ? formatTime(visitor.expected_time_in) : 'N/A'} - {visitor.expected_time_out ? formatTime(visitor.expected_time_out) : 'N/A'}</AppText>
                </View>

                {visitor.admin_remarks ? (
                    <View style={[styles.remarksBox, { backgroundColor: boxBg }]}>
                        <AppText style={styles.remarksLabel}>ADMIN REMARKS:</AppText>
                        <AppText style={[styles.remarksText, { color: textMain }]}>{visitor.admin_remarks}</AppText>
                    </View>
                ) : null}
            </View>

            <View style={{ alignItems: 'flex-end', justifyContent: 'flex-start', minWidth: 90 }}>
                <AppText style={[styles.statusText, { color: getStatusColor(visitor.status) }]}>{getStatusLabel(visitor.status).toUpperCase()}</AppText>
                {visitor.status === 'approved' && (
                    <TouchableOpacity style={[styles.qrBtn, { backgroundColor: primaryBtnBg }]} onPress={() => handleViewPass(visitor)}>
                        <MaterialCommunityIcons name="qrcode-scan" size={16} color={primaryBtnText} />
                        <AppText style={[styles.qrBtnText, { color: primaryBtnText }]}>Show Pass</AppText>
                    </TouchableOpacity>
                )}
                {['pending', 'approved'].includes(visitor.status) && (
                    <TouchableOpacity style={styles.cancelBtn} onPress={() => handleCancelVisitor(visitor)}>
                        <AppText style={styles.cancelBtnText}>Cancel</AppText>
                    </TouchableOpacity>
                )}
            </View>
        </View>
    );

    const AnimatedDoor = ({ isOpen }: { isOpen: boolean }) => {
        const rotateY = useSharedValue(0);
        useEffect(() => {
            rotateY.value = withTiming(isOpen ? -75 : 0, { duration: 1200, easing: Easing.inOut(Easing.ease) });
        }, [isOpen]);
        
        const rStyle = useAnimatedStyle(() => ({
            transform: [{ perspective: 500 }, { translateX: -20 }, { rotateY: `${rotateY.value}deg` }, { translateX: 20 }]
        }));
        
        return (
            <View style={{ position: 'absolute', right: 32, top: 0, width: 40, height: 60, borderLeftWidth: 2, borderTopWidth: 2, borderRightWidth: 2, borderColor: '#94A3B8' }} pointerEvents="none">
                <Animated.View style={[{ width: '100%', height: '100%', backgroundColor: '#FDBA74' }, rStyle]}>
                    <View style={{ width: 4, height: 4, borderRadius: 2, backgroundColor: '#000', position: 'absolute', right: 5, top: 30 }} />
                </Animated.View>
            </View>
        );
    };

    return (
        <View style={[styles.container, { backgroundColor: themeBg }]}>
            <Stack.Screen options={{ headerShown: false }} />
            <View style={[styles.headerActions, { paddingTop: insets.top + 16 }]}>
                <Pressable style={({ pressed }) => [styles.backBtn, pressed && { opacity: 0.5 }]} onPress={() => router.back()}>
                    <MaterialCommunityIcons name="arrow-left" size={24} color={textMain} />
                </Pressable>
            </View>

            <View style={[styles.hero, { position: 'relative' }]}>
                <AppText style={[styles.heroTitle, { color: textMain }]}>Visitors</AppText>
                <AppText style={[styles.heroSubtitle, { color: textMuted }]}>Manage your guests</AppText>
                <AnimatedDoor isOpen={visitors.some(v => v.status === 'approved')} />
            </View>

            {loading ? (
                <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}><ActivityIndicator size="large" color={textMain} /></View>
            ) : visitors.length === 0 ? (
                <View style={styles.emptyState}><AppText style={styles.emptyText}>No visitors found</AppText></View>
            ) : (
                <SectionList sections={sections} keyExtractor={(item) => item.id.toString()} renderItem={renderVisitorCard} renderSectionHeader={({ section: { title } }) => <AppText style={styles.sectionHeader}>{title}</AppText>} contentContainerStyle={styles.visitorsList} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={textMain} />} stickySectionHeadersEnabled={false} showsVerticalScrollIndicator={false} />
            )}

            <Pressable style={({ pressed }) => [styles.fab, { backgroundColor: fabBg }, pressed && { opacity: 0.8 }]} onPress={() => router.push('/visitor-request')}>
                <MaterialIcons name="add" size={24} color={fabText} />
            </Pressable>

            {selectedVisitor && <VisitorPassModal visible={showPassModal} visitor={selectedVisitor} onClose={() => { setShowPassModal(false); setSelectedVisitor(null); }} />}
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    headerActions: { paddingHorizontal: 24, paddingBottom: 16 },
    backBtn: { width: 40, height: 40, justifyContent: 'center', alignItems: 'flex-start' },
    hero: { paddingHorizontal: 24, marginBottom: 32 },
    heroTitle: { fontSize: 40, fontWeight: '800', letterSpacing: -1.5, lineHeight: 44, marginBottom: 8 },
    heroSubtitle: { fontSize: 16, fontWeight: '600' },
    sectionHeader: { fontSize: 11, fontWeight: '700', color: '#666666', letterSpacing: 1.5, marginTop: 16, marginBottom: 12 },
    visitorsList: { paddingHorizontal: 24, paddingBottom: 120 },
    historyRow: { flexDirection: 'row', paddingVertical: 24, borderBottomWidth: 1, justifyContent: 'space-between' },
    visitorName: { fontSize: 18, fontWeight: '700', marginBottom: 2 },
    visitorPhone: { fontSize: 14, fontWeight: '500', marginBottom: 2 },
    visitorRelation: { fontSize: 13, color: '#666666', fontStyle: 'italic', marginBottom: 8 },
    purpose: { fontSize: 14, lineHeight: 20, marginBottom: 12 },
    dateInfo: { flexDirection: 'row', alignItems: 'center' },
    historyDate: { fontSize: 13, fontWeight: '700' },
    durationText: { fontSize: 12, color: '#888888', fontWeight: '600' },
    remarksBox: { marginTop: 12, padding: 12, borderRadius: 12 },
    remarksLabel: { fontSize: 10, fontWeight: '700', color: '#888888', letterSpacing: 1, marginBottom: 4 },
    remarksText: { fontSize: 13 },
    statusText: { fontSize: 12, fontWeight: '800', letterSpacing: 0.5, marginBottom: 16, textAlign: 'right' },
    qrBtn: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 100, gap: 6, marginBottom: 12 },
    qrBtnText: { fontSize: 12, fontWeight: '800' },
    cancelBtn: { paddingVertical: 8, paddingHorizontal: 12 },
    cancelBtnText: { color: '#EF4444', fontSize: 12, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1 },
    emptyState: { alignItems: 'center', justifyContent: 'center', paddingVertical: 60 },
    emptyText: { color: '#666666', fontStyle: 'italic', fontSize: 14 },
    fab: { position: 'absolute', bottom: 32, right: 24, width: 64, height: 64, borderRadius: 32, justifyContent: 'center', alignItems: 'center' },
});
