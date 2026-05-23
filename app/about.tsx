import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Stack, useFocusEffect, useRouter } from 'expo-router';
import React, { useCallback, useState } from 'react';
import { ActivityIndicator, Dimensions, Image, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../utils/ThemeContext';
import { Facility, getAllFacilities } from '../utils/facilityUtils';
import { HostelInfo, getHostelInfo as fetchHostelInfo } from '../utils/hostelUtils';
import AppText from '../components/AppText';

export default function AboutPage() {
    const { colors, theme } = useTheme();
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const [facilities, setFacilities] = useState<Facility[]>([]);
    const [hostelInfo, setHostelInfo] = useState<HostelInfo | null>(null);
    const [loading, setLoading] = useState(true);

    useFocusEffect(
        useCallback(() => {
            loadData();
        }, [])
    );

    const loadData = async () => {
        try {
            // console.log('Loading About Data...');
            const [facilitiesData, infoData] = await Promise.all([
                getAllFacilities(),
                fetchHostelInfo()
            ]);
            setFacilities(facilitiesData);
            setHostelInfo(infoData);
        } catch (error) {
            console.error('Error loading data:', error);
        } finally {
            setLoading(false);
        }
    };

    const styles = StyleSheet.create({
        container: {
            flex: 1,
            backgroundColor: colors.background,
        },
        heroContainer: {
            height: 250,
            overflow: 'hidden',
        },
        heroImage: {
            width: '100%',
            height: '100%',
        },
        heroOverlay: {
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            height: 150,
            justifyContent: 'flex-end',
            padding: 20,
        },
        heroTitle: {
            fontSize: 32,
            fontWeight: '800',
            color: '#fff',
            marginBottom: 4,
            textShadowColor: 'rgba(0,0,0,0.3)',
            textShadowOffset: { width: 0, height: 2 },
            textShadowRadius: 4,
        },
        heroSubtitle: {
            fontSize: 16,
            color: 'rgba(255,255,255,0.9)',
            fontWeight: '600',
        },
        content: {
            flex: 1,
            padding: 20,
        },
        sectionTitle: {
            fontSize: 20,
            fontWeight: '700',
            color: colors.text,
            marginBottom: 16,
        },
        introText: {
            fontSize: 15,
            color: colors.textSecondary,
            lineHeight: 24,
            marginBottom: 24,
        },
        facilityCard: {
            backgroundColor: colors.card,
            borderRadius: 16,
            marginBottom: 20,
            overflow: 'hidden',
            borderWidth: 1,
            borderColor: colors.border,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.05,
            shadowRadius: 8,
            elevation: 2,
        },
        facilityImage: {
            width: '100%',
            height: 180,
            backgroundColor: theme === 'dark' ? '#1E293B' : '#E2E8F0',
        },
        facilityContent: {
            padding: 16,
        },
        facilityTitle: {
            fontSize: 18,
            fontWeight: '700',
            color: colors.text,
            marginBottom: 6,
        },
        facilityDesc: {
            fontSize: 14,
            color: colors.textSecondary,
            lineHeight: 20,
        },
    });

    return (
        <View style={styles.container}>
            <Stack.Screen options={{ headerShown: false }} />

            <ScrollView showsVerticalScrollIndicator={false}>
                {/* Custom Hero Header */}
                <View style={styles.heroContainer}>
                    {!loading ? (
                        <Image
                            source={{ uri: hostelInfo?.image_url || 'https://images.unsplash.com/photo-1555854877-bab0e564b8d5?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80' }}
                            style={styles.heroImage}
                            resizeMode="cover"
                        />
                    ) : (
                        <View style={[styles.heroImage, { backgroundColor: theme === 'dark' ? '#1E293B' : '#E2E8F0' }]} />
                    )}
                    <LinearGradient
                        colors={['transparent', 'rgba(0,0,0,0.8)']}
                        style={styles.heroOverlay}
                    >
                        <AppText style={styles.heroTitle}>
                            {loading ? 'Loading...' : (hostelInfo?.name || 'Smart Hostel')}
                        </AppText>
                        <AppText style={styles.heroSubtitle}>
                            {loading ? 'Please wait' : (hostelInfo?.subtitle || 'no detail added right now')}
                        </AppText>
                    </LinearGradient>

                    {/* Back Button Overlay */}
                    <TouchableOpacity
                        style={{ position: 'absolute', top: insets.top + 10, left: 20, width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(0,0,0,0.3)', alignItems: 'center', justifyContent: 'center' }}
                        onPress={() => router.back()}
                    >
                        <MaterialCommunityIcons name="arrow-left" size={24} color="#fff" />
                    </TouchableOpacity>
                </View>

                <View style={styles.content}>
                    {!loading && hostelInfo?.location && (
                        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 24, padding: 12, backgroundColor: colors.card, borderRadius: 12, borderWidth: 1, borderColor: colors.border }}>
                            <MaterialCommunityIcons name="map-marker" size={20} color={colors.primary} style={{ marginRight: 8 }} />
                            <AppText style={{ color: colors.text, fontSize: 14, fontWeight: '500', flex: 1 }}>
                                {hostelInfo.location}
                            </AppText>
                        </View>
                    )}

                    <AppText style={styles.introText}>
                        {loading ? 'Loading description...' : (hostelInfo?.description || 'no detail added right now')}
                    </AppText>

                    <AppText style={styles.sectionTitle}>Our Facilities</AppText>

                    {loading ? (
                        <ActivityIndicator color={colors.primary} size="large" />
                    ) : (
                        facilities.map((item) => (
                            <View key={item.id} style={styles.facilityCard}>
                                {item.images && item.images.length > 0 ? (
                                    <View>
                                        <ScrollView
                                            horizontal
                                            pagingEnabled
                                            showsHorizontalScrollIndicator={false}
                                            style={{ width: '100%', height: 180 }}
                                        >
                                            {item.images.map((img, index) => (
                                                <Image
                                                    key={index}
                                                    source={{ uri: img }}
                                                    style={{ width: Dimensions.get('window').width - 42, height: 180 }} // width - padding (40) - border (2)
                                                    resizeMode="cover"
                                                />
                                            ))}
                                        </ScrollView>
                                        {item.images.length > 1 && (
                                            <View style={{ position: 'absolute', bottom: 10, left: 0, right: 0, flexDirection: 'row', justifyContent: 'center', gap: 6 }}>
                                                {item.images.map((_, index) => (
                                                    <View key={index} style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: 'rgba(255,255,255,0.8)' }} />
                                                ))}
                                            </View>
                                        )}
                                    </View>
                                ) : item.image_url ? (
                                    <Image source={{ uri: item.image_url }} style={styles.facilityImage} resizeMode="cover" />
                                ) : null}
                                <View style={styles.facilityContent}>
                                    <AppText style={styles.facilityTitle}>{item.title}</AppText>
                                    <AppText style={styles.facilityDesc}>{item.description}</AppText>
                                </View>
                            </View>
                        ))
                    )}

                    {!loading && facilities.length === 0 && (
                        <AppText style={{ textAlign: 'center', color: colors.textSecondary, marginTop: 20 }}>
                            no detail added right now
                        </AppText>
                    )}

                    {!loading && hostelInfo?.footer_text && (
                        <View style={{ marginTop: 24, marginBottom: 40 }}>
                            <AppText style={{ textAlign: 'center', color: colors.textSecondary, fontSize: 15, lineHeight: 24 }}>
                                {hostelInfo.footer_text}
                            </AppText>
                        </View>
                    )}
                </View>
            </ScrollView>
        </View>
    );
}
