import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Stack, useFocusEffect, useRouter } from 'expo-router';
import React, { useCallback, useState } from 'react';
import {
    ActivityIndicator,
    Image,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../utils/ThemeContext';
import { Facility, getAllFacilities } from '../utils/facilityUtils';
import { HostelInfo, getHostelInfo as fetchHostelInfo } from '../utils/hostelUtils';

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
                    <Image
                        source={{ uri: hostelInfo?.image_url || 'https://images.unsplash.com/photo-1555854877-bab0e564b8d5?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80' }}
                        style={styles.heroImage}
                        resizeMode="cover"
                    />
                    <LinearGradient
                        colors={['transparent', 'rgba(0,0,0,0.8)']}
                        style={styles.heroOverlay}
                    >
                        <Text style={styles.heroTitle}>{hostelInfo?.name || 'Smart Hostel'}</Text>
                        <Text style={styles.heroSubtitle}>{hostelInfo?.subtitle || 'Home Away From Home'}</Text>
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
                    {hostelInfo?.location && (
                        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 24, padding: 12, backgroundColor: colors.card, borderRadius: 12, borderWidth: 1, borderColor: colors.border }}>
                            <MaterialCommunityIcons name="map-marker" size={20} color={colors.primary} style={{ marginRight: 8 }} />
                            <Text style={{ color: colors.text, fontSize: 14, fontWeight: '500', flex: 1 }}>
                                {hostelInfo.location}
                            </Text>
                        </View>
                    )}

                    <Text style={styles.introText}>
                        {hostelInfo?.description || 'Welcome to Smart Hostel, a premium living space designed for comfort, community, and convenience. We offer state-of-the-art facilities to ensure a productive and enjoyable stay.'}
                    </Text>

                    <Text style={styles.sectionTitle}>Our Facilities</Text>

                    {loading ? (
                        <ActivityIndicator color={colors.primary} size="large" />
                    ) : (
                        facilities.map((item) => (
                            <View key={item.id} style={styles.facilityCard}>
                                {item.image_url && (
                                    <Image source={{ uri: item.image_url }} style={styles.facilityImage} resizeMode="cover" />
                                )}
                                <View style={styles.facilityContent}>
                                    <Text style={styles.facilityTitle}>{item.title}</Text>
                                    <Text style={styles.facilityDesc}>{item.description}</Text>
                                </View>
                            </View>
                        ))
                    )}

                    {!loading && facilities.length === 0 && (
                        <Text style={{ textAlign: 'center', color: colors.textSecondary, marginTop: 20 }}>
                            No facilities listed yet.
                        </Text>
                    )}

                    {hostelInfo?.footer_text && (
                        <View style={{ marginTop: 24, marginBottom: 40 }}>
                            <Text style={{ textAlign: 'center', color: colors.textSecondary, fontSize: 15, lineHeight: 24 }}>
                                {hostelInfo.footer_text}
                            </Text>
                        </View>
                    )}
                </View>
            </ScrollView>
        </View>
    );
}
