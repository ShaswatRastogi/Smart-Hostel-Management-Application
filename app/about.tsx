import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Stack, useFocusEffect, useRouter } from 'expo-router';
import React, { useCallback, useState } from 'react';
import { ActivityIndicator, Dimensions, Image, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Facility, getAllFacilities } from '../utils/facilityUtils';
import { HostelInfo, getHostelInfo as fetchHostelInfo } from '../utils/hostelUtils';
import { useTheme } from '../utils/ThemeContext';
import AppText from '../components/AppText';

export default function AboutPage() {
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const { isDark } = useTheme();

    const [facilities, setFacilities] = useState<Facility[]>([]);
    const [hostelInfo, setHostelInfo] = useState<HostelInfo | null>(null);
    const [loading, setLoading] = useState(true);

    // Dynamic Theme Map
    const themeBg = isDark ? '#000000' : '#F8FAFC';
    const textMain = isDark ? '#FFFFFF' : '#111111';
    const textMuted = isDark ? '#888888' : '#64748B';
    const textSecondary = isDark ? '#CCCCCC' : '#475569';
    const borderSubtle = isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)';
    const dotBg = isDark ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.3)';

    useFocusEffect(useCallback(() => { loadData(); }, []));

    const loadData = async () => {
        try {
            const [facilitiesData, infoData] = await Promise.all([getAllFacilities(), fetchHostelInfo()]);
            setFacilities(facilitiesData); setHostelInfo(infoData);
        } catch (error) {} finally { setLoading(false); }
    };

    return (
        <View style={[styles.container, { backgroundColor: themeBg }]}>
            <Stack.Screen options={{ headerShown: false }} />
            <View style={[styles.headerActions, { paddingTop: insets.top + 16 }]}>
                <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
                    <MaterialCommunityIcons name="arrow-left" size={24} color={textMain} />
                </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 60 }}>
                <View style={styles.heroSection}>
                    <AppText style={[styles.heroTitle, { color: textMain }]}>{loading ? 'Loading...' : (hostelInfo?.name || 'Smart Hostel')}</AppText>
                    <AppText style={[styles.heroSubtitle, { color: textMuted }]}>{loading ? 'Please wait' : (hostelInfo?.subtitle || 'no detail added right now')}</AppText>

                    {!loading && (
                        <View style={[styles.heroImageContainer, { borderColor: borderSubtle }]}>
                            <Image source={{ uri: hostelInfo?.image_url || 'https://images.unsplash.com/photo-1555854877-bab0e564b8d5?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80' }} style={styles.heroImage} resizeMode="cover" />
                        </View>
                    )}
                </View>

                <View style={styles.infoSection}>
                    {!loading && hostelInfo?.location && (
                        <View style={[styles.locationBlock, { borderColor: borderSubtle }]}>
                            <MaterialCommunityIcons name="map-marker-outline" size={20} color={textMuted} />
                            <AppText style={[styles.locationText, { color: textMain }]}>{hostelInfo.location}</AppText>
                        </View>
                    )}
                    <AppText style={[styles.introText, { color: textSecondary }]}>{loading ? 'Loading description...' : (hostelInfo?.description || 'no detail added right now')}</AppText>
                </View>

                <View style={styles.facilitiesSection}>
                    <AppText style={styles.sectionTitle}>OUR FACILITIES</AppText>
                    {loading ? (
                        <ActivityIndicator color={textMain} size="large" />
                    ) : (
                        facilities.map((item) => (
                            <View key={item.id} style={[styles.facilityRow, { borderColor: borderSubtle }]}>
                                <View style={styles.facilityContent}>
                                    <AppText style={[styles.facilityTitle, { color: textMain }]}>{item.title}</AppText>
                                    <AppText style={[styles.facilityDesc, { color: textMuted }]}>{item.description}</AppText>
                                </View>

                                {item.images && item.images.length > 0 ? (
                                    <View style={[styles.facilityImageGallery, { borderColor: borderSubtle }]}>
                                        <ScrollView horizontal pagingEnabled showsHorizontalScrollIndicator={false} style={styles.galleryScroll}>
                                            {item.images.map((img, index) => <Image key={index} source={{ uri: img }} style={styles.facilityGalleryImage} resizeMode="cover" />)}
                                        </ScrollView>
                                        {item.images.length > 1 && (
                                            <View style={styles.galleryDots}>
                                                {item.images.map((_, index) => <View key={index} style={[styles.dot, { backgroundColor: dotBg }]} />)}
                                            </View>
                                        )}
                                    </View>
                                ) : item.image_url ? (
                                    <Image source={{ uri: item.image_url }} style={[styles.facilitySingleImage, { borderColor: borderSubtle }]} resizeMode="cover" />
                                ) : null}
                            </View>
                        ))
                    )}
                    {!loading && facilities.length === 0 && (
                        <View style={styles.emptyState}><AppText style={styles.emptyText}>No facilities added yet.</AppText></View>
                    )}
                </View>

                {!loading && hostelInfo?.footer_text && (
                    <View style={styles.footerSection}>
                        <AppText style={styles.footerText}>{hostelInfo.footer_text}</AppText>
                    </View>
                )}
            </ScrollView>
        </View>
    );
}

const { width } = Dimensions.get('window');

const styles = StyleSheet.create({
    container: { flex: 1 },
    headerActions: { paddingHorizontal: 24, paddingBottom: 16 },
    backBtn: { width: 40, height: 40, justifyContent: 'center', alignItems: 'flex-start' },
    heroSection: { paddingHorizontal: 24, marginBottom: 40 },
    heroTitle: { fontSize: 40, fontWeight: '800', letterSpacing: -1.5, lineHeight: 44, marginBottom: 8 },
    heroSubtitle: { fontSize: 16, fontWeight: '600', marginBottom: 32 },
    heroImageContainer: { width: '100%', height: 240, borderRadius: 16, overflow: 'hidden', borderWidth: 1 },
    heroImage: { width: '100%', height: '100%' },
    infoSection: { paddingHorizontal: 24, marginBottom: 48 },
    locationBlock: { flexDirection: 'row', alignItems: 'center', paddingVertical: 16, borderBottomWidth: 1, marginBottom: 24, gap: 8 },
    locationText: { fontSize: 14, fontWeight: '600', flex: 1 },
    introText: { fontSize: 15, lineHeight: 24 },
    facilitiesSection: { paddingHorizontal: 24, marginBottom: 48 },
    sectionTitle: { fontSize: 11, fontWeight: '700', color: '#666666', letterSpacing: 1.5, marginBottom: 24 },
    facilityRow: { marginBottom: 40, borderBottomWidth: 1, paddingBottom: 40 },
    facilityContent: { marginBottom: 20 },
    facilityTitle: { fontSize: 24, fontWeight: '800', letterSpacing: -0.5, marginBottom: 8 },
    facilityDesc: { fontSize: 14, lineHeight: 22 },
    facilityImageGallery: { width: '100%', height: 200, borderRadius: 12, overflow: 'hidden', borderWidth: 1 },
    galleryScroll: { width: '100%', height: '100%' },
    facilityGalleryImage: { width: width - 48, height: 200 },
    galleryDots: { position: 'absolute', bottom: 12, left: 0, right: 0, flexDirection: 'row', justifyContent: 'center', gap: 6 },
    dot: { width: 6, height: 6, borderRadius: 3 },
    facilitySingleImage: { width: '100%', height: 200, borderRadius: 12, borderWidth: 1 },
    emptyState: { paddingVertical: 24 },
    emptyText: { color: '#666666', fontStyle: 'italic', fontSize: 14 },
    footerSection: { paddingHorizontal: 24, alignItems: 'center' },
    footerText: { fontSize: 12, color: '#666666', textAlign: 'center', lineHeight: 18 }
});
