import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as Notifications from 'expo-notifications';
import { useRouter } from 'expo-router';
import React, { useRef, useState, useEffect } from 'react';
import { Dimensions, Pressable, StyleSheet, Switch, View, Image, Animated, Easing } from 'react-native';
import PagerView from 'react-native-pager-view';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuthStore } from '../store/useAuthStore';
import { Language, useSettingsStore } from '../store/useSettingsStore';
import { useThemeStore } from '../store/useThemeStore';
import AppText from '../components/AppText';
import { isAdmin } from '../utils/authUtils';

const { width, height } = Dimensions.get('window');

const SLIDES = [
    { title: 'Welcome to SmartStay', subtitle: 'Experience the future of hostel living with digitized management and real-time alerts.', useImage: true, type: 'welcome' },
    { title: 'Select Language', subtitle: 'Choose your preferred language for the application interface.', type: 'language' },
    { title: 'Stay Updated', subtitle: 'Enable notifications to get real-time alerts for mess, laundry, and notices.', icon: 'bell-outline', type: 'notifications' },
    { title: 'All Ready!', subtitle: 'Your SmartStay experience is personalized and ready for use.', icon: 'check-decagram-outline', type: 'finish' },
];

export default function Onboarding() {
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const pagerRef = useRef<PagerView>(null);
    const [currentPage, setCurrentPage] = useState(0);
    const [notificationsEnabled, setNotificationsEnabled] = useState(false);

    const { language, setLanguage, completeOnboarding } = useSettingsStore();
    // Keep theme hook but we force the UI to black & white aesthetic
    const { setTheme } = useThemeStore();

    // Entrance Animation
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const slideAnim = useRef(new Animated.Value(20)).current;

    // Default force dark mode since user wants black & white aesthetic globally
    useEffect(() => {
        setTheme('dark');
        
        Animated.parallel([
            Animated.timing(fadeAnim, {
                toValue: 1,
                duration: 800,
                easing: Easing.out(Easing.cubic),
                useNativeDriver: true,
            }),
            Animated.timing(slideAnim, {
                toValue: 0,
                duration: 800,
                easing: Easing.out(Easing.cubic),
                useNativeDriver: true,
            })
        ]).start();
    }, []);

    const handleNext = async () => {
        if (currentPage < SLIDES.length - 1) {
            pagerRef.current?.setPage(currentPage + 1);
        } else {
            await completeOnboarding();

            // Navigate based on role
            const user = useAuthStore.getState().user;
            if (isAdmin(user)) {
                router.replace('/admin');
            } else {
                router.replace('/(tabs)');
            }
        }
    };

    const toggleNotifications = async (value: boolean) => {
        setNotificationsEnabled(value);
        if (value) {
            const { status } = await Notifications.requestPermissionsAsync();
            if (status !== 'granted') {
                setNotificationsEnabled(false);
            }
        }
    };

    const renderSlideContent = (slide: typeof SLIDES[0]) => {
        switch (slide.type) {
            case 'language':
                return (
                    <View style={styles.optionContainer}>
                        {(['en', 'hi'] as Language[]).map((lang) => {
                            const isSelected = language === lang;
                            return (
                                <Pressable
                                    key={lang}
                                    style={({ pressed }) => [
                                        styles.choiceCard,
                                        { 
                                            borderColor: isSelected ? '#ffffff' : '#333333',
                                            backgroundColor: isSelected ? '#111111' : '#000000',
                                            transform: [{ scale: pressed ? 0.98 : 1 }]
                                        }
                                    ]}
                                    onPress={() => setLanguage(lang)}
                                >
                                    <AppText style={[styles.choiceText, { color: isSelected ? '#ffffff' : '#888888' }]}>
                                        {lang === 'en' ? 'English' : 'हिन्दी (Hindi)'}
                                    </AppText>
                                    {isSelected && <MaterialCommunityIcons name="check-circle" size={20} color="#ffffff" />}
                                </Pressable>
                            );
                        })}
                    </View>
                );
            case 'notifications':
                return (
                    <View style={styles.notificationToggleContainer}>
                        <View style={[styles.choiceCard, { borderColor: notificationsEnabled ? '#ffffff' : '#333333', backgroundColor: notificationsEnabled ? '#111111' : '#000000', width: '100%' }]}>
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                                <MaterialCommunityIcons name="bell-outline" size={24} color={notificationsEnabled ? '#ffffff' : '#888888'} />
                                <AppText style={[styles.choiceText, { color: notificationsEnabled ? '#ffffff' : '#888888' }]}>Enable Notifications</AppText>
                            </View>
                            <Switch
                                value={notificationsEnabled}
                                onValueChange={toggleNotifications}
                                trackColor={{ false: '#333333', true: '#555555' }}
                                thumbColor={notificationsEnabled ? '#ffffff' : '#888888'}
                            />
                        </View>
                        <AppText style={styles.infoText}>
                            You can always change this later in settings.
                        </AppText>
                    </View>
                );
            default:
                return (
                    <View style={styles.iconContainer}>
                        {slide.useImage ? (
                            <Image 
                                source={require('../assets/smartstay_logo.png')} 
                                style={styles.appIconImage} 
                                resizeMode="cover"
                            />
                        ) : (
                            <MaterialCommunityIcons name={(slide.icon as any) || 'rocket-launch-outline'} size={100} color="#ffffff" />
                        )}
                    </View>
                );
        }
    };

    return (
        <Animated.View style={[styles.container, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
            <PagerView
                style={styles.pagerView}
                initialPage={0}
                ref={pagerRef}
                onPageSelected={(e) => setCurrentPage(e.nativeEvent.position)}
                scrollEnabled={true}
            >
                {SLIDES.map((slide, index) => (
                    <View key={index} style={styles.slide}>
                        <View style={[styles.content, { paddingTop: insets.top + 80 }]}>
                            <AppText style={styles.title}>{slide.title}</AppText>
                            <View style={styles.dividerAccent} />
                            <AppText style={styles.subtitle}>{slide.subtitle}</AppText>
                            {renderSlideContent(slide)}
                        </View>
                    </View>
                ))}
            </PagerView>

            {/* Pagination Dots & Next Button */}
            <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom + 20, 40) }]}>
                <View style={styles.dotContainer}>
                    {SLIDES.map((_, i) => (
                        <View 
                            key={i} 
                            style={[
                                styles.dot, 
                                i === currentPage ? styles.dotActive : styles.dotInactive
                            ]} 
                        />
                    ))}
                </View>

                <Pressable
                    style={({ pressed }) => [
                        styles.nextButton,
                        { transform: [{ scale: pressed ? 0.97 : 1 }], opacity: pressed ? 0.8 : 1 }
                    ]}
                    onPress={handleNext}
                >
                    <AppText style={styles.nextButtonText}>
                        {currentPage === SLIDES.length - 1 ? 'Get Started' : 'Next Step'}
                    </AppText>
                    <MaterialCommunityIcons name="arrow-right" size={20} color="#000000" />
                </Pressable>
            </View>
        </Animated.View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#000000',
    },
    pagerView: {
        flex: 1,
    },
    slide: {
        flex: 1,
        alignItems: 'center',
    },
    content: {
        width: '100%',
        paddingHorizontal: 32,
        alignItems: 'center',
    },
    title: {
        fontSize: 32,
        fontWeight: '700',
        color: '#ffffff',
        textAlign: 'center',
        letterSpacing: 0.5,
    },
    dividerAccent: {
        width: 40,
        height: 2,
        backgroundColor: '#ffffff',
        marginTop: 16,
        marginBottom: 16,
        borderRadius: 1,
    },
    subtitle: {
        fontSize: 15,
        color: '#888888',
        textAlign: 'center',
        lineHeight: 22,
        marginBottom: 60,
    },
    iconContainer: {
        marginTop: 20,
        alignItems: 'center',
        justifyContent: 'center',
        width: 160,
        height: 160,
        borderRadius: 80,
        borderWidth: 1,
        borderColor: '#333333',
        backgroundColor: '#111111',
        overflow: 'hidden',
    },
    appIconImage: {
        width: '100%',
        height: '100%',
        borderRadius: 80, // Match parent
    },
    optionContainer: {
        width: '100%',
        gap: 16,
    },
    choiceCard: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 24,
        paddingVertical: 18,
        borderRadius: 16,
        borderWidth: 1,
    },
    choiceText: {
        fontSize: 16,
        fontWeight: '600',
        letterSpacing: 0.5,
    },
    notificationToggleContainer: {
        width: '100%',
        alignItems: 'center',
        gap: 16,
    },
    infoText: {
        fontSize: 13,
        color: '#666666',
        textAlign: 'center',
        marginTop: 8,
    },
    footer: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        paddingHorizontal: 32,
        gap: 32,
    },
    dotContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        gap: 8,
    },
    dot: {
        height: 4,
        borderRadius: 2,
    },
    dotActive: {
        width: 24,
        backgroundColor: '#ffffff',
    },
    dotInactive: {
        width: 12,
        backgroundColor: '#333333',
    },
    nextButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#ffffff',
        paddingVertical: 16,
        borderRadius: 16,
        gap: 12,
    },
    nextButtonText: {
        color: '#000000',
        fontSize: 16,
        fontWeight: '700',
        letterSpacing: 0.5,
    },
});
