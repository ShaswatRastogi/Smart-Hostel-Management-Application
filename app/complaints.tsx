import { MaterialCommunityIcons, MaterialIcons } from '@expo/vector-icons';
import { Stack, useRouter } from 'expo-router';
import { useEffect } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withRepeat, withTiming, Easing, withSequence } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { faqData } from '../utils/complaintsUtils';
import { useTheme } from '../utils/ThemeContext';
import AppText from '../components/AppText';

export default function Complaints() {
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const { isDark } = useTheme();

    // Dynamic Theme Variables
    const themeBg = isDark ? '#000000' : '#F8FAFC';
    const textMain = isDark ? '#FFFFFF' : '#111111';
    const textMuted = isDark ? '#888888' : '#64748B';
    const textSecondary = isDark ? '#CCCCCC' : '#475569';
    const borderSubtle = isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)';
    const iconBg = isDark ? '#FFFFFF' : '#111111';
    const iconText = isDark ? '#000000' : '#FFFFFF';
    const iconBgSecondary = isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)';
    const iconTextSecondary = isDark ? '#FFFFFF' : '#111111';

    const AnimatedWrench = () => {
        const rotation = useSharedValue(0);
        useEffect(() => {
            rotation.value = withRepeat(
                withSequence(
                    withTiming(-45, { duration: 600, easing: Easing.inOut(Easing.ease) }),
                    withTiming(0, { duration: 600, easing: Easing.inOut(Easing.ease) })
                ), -1, true
            );
        }, []);
        
        const rStyle = useAnimatedStyle(() => ({ transform: [{ rotateZ: `${rotation.value}deg` }] }));
        
        return (
            <View style={{ position: 'absolute', right: 24, top: -10 }} pointerEvents="none">
                <Animated.View style={[{ width: 80, height: 80, justifyContent: 'center', alignItems: 'center' }, rStyle]}>
                    <MaterialCommunityIcons name="wrench" size={60} color="#94A3B8" />
                </Animated.View>
                <MaterialCommunityIcons name="nut" size={24} color="#64748B" style={{ position: 'absolute', bottom: 10, left: 30 }} />
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

            <ScrollView style={styles.content} contentContainerStyle={{ paddingBottom: 80 }} showsVerticalScrollIndicator={false}>
                <View style={[styles.hero, { position: 'relative' }]}>
                    <AppText style={[styles.heroTitle, { color: textMain }]}>Complaints</AppText>
                    <AppText style={[styles.heroSubtitle, { color: textMuted }]}>Resolve Issues & Queries</AppText>
                    <AnimatedWrench />
                </View>

                <View style={styles.section}>
                    <AppText style={styles.sectionTitle}>ACTIONS</AppText>
                    <View style={styles.actionsList}>
                        <Pressable style={({ pressed }) => [styles.actionRow, { borderColor: borderSubtle }, pressed && { opacity: 0.7 }]} onPress={() => router.push('/new-complaint')}>
                            <View style={[styles.actionIconBox, { backgroundColor: iconBg }]}>
                                <MaterialIcons name="add" size={24} color={iconText} />
                            </View>
                            <View style={styles.actionTextContent}>
                                <AppText style={[styles.actionTitle, { color: textMain }]}>Raise New Complaint</AppText>
                                <AppText style={styles.actionSubtitle}>Report a maintenance or service issue</AppText>
                            </View>
                            <MaterialCommunityIcons name="chevron-right" size={24} color={textMuted} />
                        </Pressable>

                        <Pressable style={({ pressed }) => [styles.actionRow, { borderColor: borderSubtle }, pressed && { opacity: 0.7 }]} onPress={() => router.push('/my-complaints')}>
                            <View style={[styles.actionIconBoxSecondary, { backgroundColor: iconBgSecondary }]}>
                                <MaterialIcons name="history" size={24} color={iconTextSecondary} />
                            </View>
                            <View style={styles.actionTextContent}>
                                <AppText style={[styles.actionTitleSecondary, { color: textMain }]}>Track Past Complaints</AppText>
                                <AppText style={styles.actionSubtitle}>View status and updates</AppText>
                            </View>
                            <MaterialCommunityIcons name="chevron-right" size={24} color={textMuted} />
                        </Pressable>
                    </View>
                </View>

                <View style={styles.section}>
                    <AppText style={styles.sectionTitle}>FREQUENTLY ASKED QUESTIONS</AppText>
                    <View style={styles.faqList}>
                        {faqData.map((faq, index) => (
                            <View key={index} style={[styles.faqRow, { borderColor: borderSubtle }]}>
                                <View style={styles.faqHeader}>
                                    <AppText style={[styles.question, { color: textMain }]}>{faq.question}</AppText>
                                </View>
                                <AppText style={[styles.answer, { color: textSecondary }]}>{faq.answer}</AppText>
                            </View>
                        ))}
                    </View>
                </View>
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    headerActions: { paddingHorizontal: 24, paddingBottom: 16 },
    backBtn: { width: 40, height: 40, justifyContent: 'center', alignItems: 'flex-start' },
    content: { flex: 1 },
    hero: { paddingHorizontal: 24, marginBottom: 48 },
    heroTitle: { fontSize: 40, fontWeight: '800', letterSpacing: -1.5, lineHeight: 44, marginBottom: 8 },
    heroSubtitle: { fontSize: 16, fontWeight: '600' },
    section: { marginBottom: 48 },
    sectionTitle: { paddingHorizontal: 24, fontSize: 11, fontWeight: '700', color: '#666666', letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 16 },
    actionsList: { },
    actionRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 20, paddingHorizontal: 24, borderBottomWidth: 1 },
    actionIconBox: { width: 48, height: 48, borderRadius: 24, justifyContent: 'center', alignItems: 'center' },
    actionIconBoxSecondary: { width: 48, height: 48, borderRadius: 24, justifyContent: 'center', alignItems: 'center' },
    actionTextContent: { flex: 1, paddingLeft: 16 },
    actionTitle: { fontSize: 18, fontWeight: '700', marginBottom: 4 },
    actionSubtitle: { fontSize: 13, color: '#888888', fontWeight: '500' },
    actionTitleSecondary: { fontSize: 18, fontWeight: '700', marginBottom: 4 },
    faqList: { paddingHorizontal: 24 },
    faqRow: { paddingVertical: 24, borderBottomWidth: 1 },
    faqHeader: { flexDirection: 'row', marginBottom: 8 },
    question: { fontSize: 18, fontWeight: '700', flex: 1, lineHeight: 24 },
    answer: { lineHeight: 22, fontSize: 14 },
});