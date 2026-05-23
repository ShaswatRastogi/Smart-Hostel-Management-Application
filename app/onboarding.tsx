import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Notifications from 'expo-notifications';
import { useRouter } from 'expo-router';
import React, { useRef, useState } from 'react';
import { Dimensions, Pressable, StyleSheet, Switch, View } from 'react-native';
import PagerView from 'react-native-pager-view';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuthStore } from '../store/useAuthStore';
import { Language, useSettingsStore } from '../store/useSettingsStore';
import { useThemeStore } from '../store/useThemeStore';
import AppText from '../components/AppText';
import { isAdmin } from '../utils/authUtils';

const { width, height } = Dimensions.get('window');

const SLIDES = [
    { title: 'Welcome to SmartStay', subtitle: 'Experience the future of hostel living with digitized management and real-time alerts.', icon: 'home-variant', type: 'welcome' },
    { title: 'Select Language', subtitle: 'Choose your preferred language for the application interface.', type: 'language' },
    { title: 'Pick Your Theme', subtitle: 'Dark mode or Light mode? Choose what suits you best.', type: 'theme' },
    { title: 'Stay Updated', subtitle: 'Enable notifications to get real-time alerts for mess, laundry, and notices.', icon: 'bell-ring', type: 'notifications' },
    { title: 'All Ready!', subtitle: 'Your SmartStay experience is personalized and ready for use.', icon: 'check-decagram', type: 'finish' },
];

export default function Onboarding() {
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const pagerRef = useRef<PagerView>(null);
    const [currentPage, setCurrentPage] = useState(0);
    const [notificationsEnabled, setNotificationsEnabled] = useState(false);

    const { language, setLanguage, completeOnboarding } = useSettingsStore();
    const { theme, setTheme, colors, isDark } = useThemeStore();

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
                        {(['en', 'hi'] as Language[]).map((lang) => (
                            <Pressable
                                key={lang}
                                style={[styles.choiceCard, { backgroundColor: colors.card, borderColor: language === lang ? colors.primary : colors.border }]}
                                onPress={() => setLanguage(lang)}
                            >
                                <AppText style={[styles.choiceText, { color: language === lang ? colors.primary : colors.text }]}>
                                    {lang === 'en' ? 'English' : 'हिन्दी (Hindi)'}
                                </AppText>
                                {language === lang && <MaterialCommunityIcons name="check-circle" size={24} color={colors.primary} />}
                            </Pressable>
                        ))}
                    </View>
                );
            case 'theme':
                return (
                    <View style={styles.optionContainer}>
                        {(['light', 'dark'] as const).map((t) => (
                            <Pressable
                                key={t}
                                style={[styles.choiceCard, { backgroundColor: colors.card, borderColor: theme === t ? colors.primary : colors.border }]}
                                onPress={() => setTheme(t)}
                            >
                                <MaterialCommunityIcons name={t === 'dark' ? 'weather-night' : 'weather-sunny'} size={24} color={theme === t ? colors.primary : colors.textSecondary} />
                                <AppText style={[styles.choiceText, { color: theme === t ? colors.primary : colors.text }]}>
                                    {t.charAt(0).toUpperCase() + t.slice(1)} Mode
                                </AppText>
                                {theme === t && <MaterialCommunityIcons name="check-circle" size={24} color={colors.primary} />}
                            </Pressable>
                        ))}
                    </View>
                );
            case 'notifications':
                return (
                    <View style={styles.notificationToggleContainer}>
                        <View style={[styles.choiceCard, { backgroundColor: colors.card, borderColor: notificationsEnabled ? colors.primary : colors.border, width: '100%' }]}>
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                                <MaterialCommunityIcons name="bell-outline" size={24} color={notificationsEnabled ? colors.primary : colors.textSecondary} />
                                <AppText style={[styles.choiceText, { color: colors.text }]}>Enable Notifications</AppText>
                            </View>
                            <Switch
                                value={notificationsEnabled}
                                onValueChange={toggleNotifications}
                                trackColor={{ false: '#767577', true: colors.primary + '80' }}
                                thumbColor={notificationsEnabled ? colors.primary : '#f4f3f4'}
                            />
                        </View>
                        <AppText style={[styles.infoText, { color: colors.textSecondary }]}>
                            You can always change this later in settings.
                        </AppText>
                    </View>
                );
            default:
                return (
                    <View style={styles.iconContainer}>
                        <MaterialCommunityIcons name={(slide.icon as any) || 'rocket-launch'} size={120} color={colors.primary} />
                    </View>
                );
        }
    };

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            {/* Dynamic Background Gradient */}
            <LinearGradient
                colors={isDark ? ['#000310', '#000924', '#001e50'] : ['#F8FAFC', '#F1F5F9', '#E2E8F0']}
                style={StyleSheet.absoluteFill}
            />

            <PagerView
                style={styles.pagerView}
                initialPage={0}
                ref={pagerRef}
                onPageSelected={(e) => setCurrentPage(e.nativeEvent.position)}
                scrollEnabled={true}
            >
                {SLIDES.map((slide, index) => (
                    <View key={index} style={styles.slide}>
                        <View style={[styles.content, { paddingTop: insets.top + 60 }]}>
                            <AppText style={[styles.title, { color: colors.text }]}>{slide.title}</AppText>
                            <AppText style={[styles.subtitle, { color: colors.textSecondary }]}>{slide.subtitle}</AppText>
                            {renderSlideContent(slide)}
                        </View>
                    </View>
                ))}
            </PagerView>

            {/* Pagination Dots & Next Button */}
            <View style={styles.footer}>
                <View style={styles.dotContainer}>
                    {SLIDES.map((_, i) => (
                        <View key={i} style={[styles.dot, { backgroundColor: isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.1)' }, i === currentPage && { width: 24, backgroundColor: colors.primary }]} />
                    ))}
                </View>

                <Pressable
                    style={[styles.nextButton, { backgroundColor: colors.primary }]}
                    onPress={handleNext}
                >
                    <AppText style={styles.nextButtonText}>
                        {currentPage === SLIDES.length - 1 ? 'Get Started' : 'Next Step'}
                    </AppText>
                    <MaterialCommunityIcons name="arrow-right" size={20} color="#fff" />
                </Pressable>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
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
        paddingHorizontal: 40,
        alignItems: 'center',
    },
    title: {
        fontSize: 32,
        fontWeight: '700',
        textAlign: 'center',
        marginBottom: 16,
    },
    subtitle: {
        fontSize: 16,
        textAlign: 'center',
        lineHeight: 24,
        marginBottom: 60,
    },
    iconContainer: {
        marginTop: 40,
    },
    optionContainer: {
        width: '100%',
        gap: 16,
    },
    choiceCard: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 20,
        borderRadius: 20,
        borderWidth: 2,
    },
    choiceText: {
        fontSize: 18,
        fontWeight: '600',
    },
    notificationToggleContainer: {
        width: '100%',
        alignItems: 'center',
        gap: 16,
    },
    infoText: {
        fontSize: 14,
        textAlign: 'center',
    },
    footer: {
        position: 'absolute',
        bottom: 50,
        left: 0,
        right: 0,
        paddingHorizontal: 40,
        gap: 24,
    },
    dotContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        gap: 8,
    },
    dot: {
        width: 8,
        height: 8,
        borderRadius: 4,
    },
    nextButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 18,
        borderRadius: 20,
        gap: 8,
    },
    nextButtonText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: '700',
    },
});
