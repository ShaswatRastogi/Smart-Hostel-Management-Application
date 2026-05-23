import { MaterialCommunityIcons, MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Stack, useRouter } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { faqData } from '../utils/complaintsUtils';

import { useTheme } from '../utils/ThemeContext';
import AppText from '../components/AppText';

export default function Complaints() {
    const router = useRouter();
    const { colors, isDark } = useTheme();

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            <Stack.Screen options={{ headerShown: false }} />

            {/* Header */}
            <LinearGradient
                colors={['#000428', '#004e92']}
                style={styles.header}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
            >
                <SafeAreaView edges={['top', 'left', 'right']}>
                    <View style={styles.headerContent}>
                        <View>
                            <AppText style={styles.headerTitle}>Complaints and FAQs</AppText>
                            <AppText style={styles.headerSubtitle}>Resolve Issues & Queries</AppText>
                        </View>
                        <View style={styles.headerIcon}>
                            <MaterialIcons name="support-agent" size={24} color="#fff" />
                        </View>
                    </View>
                </SafeAreaView>
            </LinearGradient>

            <ScrollView
                style={styles.content}
                contentContainerStyle={{ paddingBottom: 40 }}
                showsVerticalScrollIndicator={false}
            >

                {/* Complaints Actions */}
                <View style={styles.section}>
                    <AppText style={[styles.sectionTitle, { color: colors.textSecondary }]}>COMPLAINTS</AppText>
                    <View style={styles.actionsGrid}>
                        <Pressable
                            style={[styles.actionButton, styles.shadowProp, { backgroundColor: colors.card }]}
                            onPress={() => router.push('/new-complaint')}
                        >
                            <LinearGradient
                                colors={isDark ? ['#1e293b', '#0f172a'] : ['#EFF6FF', '#DBEAFE']}
                                style={styles.actionGradient}
                            >
                                <View style={[styles.actionIconBox, { backgroundColor: isDark ? '#334155' : '#fff' }]}>
                                    <MaterialIcons name="add-circle-outline" size={28} color={isDark ? '#60A5FA' : '#004e92'} />
                                </View>
                                <AppText style={[styles.actionText, { color: isDark ? '#93C5FD' : '#1E3A8A' }]}>Raise New{"\n"}Complaint</AppText>
                            </LinearGradient>
                        </Pressable>

                        <Pressable
                            style={[styles.actionButton, styles.shadowProp, { backgroundColor: colors.card }]}
                            onPress={() => router.push('/my-complaints')}
                        >
                            <LinearGradient
                                colors={isDark ? ['#14532D', '#064E3B'] : ['#F0FDF4', '#DCFCE7']}
                                style={styles.actionGradient}
                            >
                                <View style={[styles.actionIconBox, { backgroundColor: isDark ? '#166534' : '#fff' }]}>
                                    <MaterialIcons name="history" size={28} color={isDark ? '#4ADE80' : '#16A34A'} />
                                </View>
                                <AppText style={[styles.actionText, { color: isDark ? '#86EFAC' : '#14532D' }]}>Track Past{"\n"}Complaints</AppText>
                            </LinearGradient>
                        </Pressable>
                    </View>
                </View>

                {/* FAQ Section */}
                <View style={styles.section}>
                    <AppText style={[styles.sectionTitle, { color: colors.textSecondary }]}>FREQUENTLY ASKED QUESTIONS</AppText>
                    <View style={styles.faqContainer}>
                        {faqData.map((faq, index) => (
                            <View
                                key={index}
                                style={[styles.faqCard, styles.shadowProp, { backgroundColor: colors.card, borderColor: colors.border }]}
                            >
                                <View style={styles.faqHeader}>
                                    <MaterialCommunityIcons name="help-circle-outline" size={20} color={colors.primary} style={{ marginTop: 2 }} />
                                    <AppText style={[styles.question, { color: colors.text }]}>{faq.question}</AppText>
                                </View>
                                <AppText style={[styles.answer, { color: colors.textSecondary }]}>{faq.answer}</AppText>
                            </View>
                        ))}
                    </View>
                </View>

            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        paddingBottom: 24,
        borderBottomLeftRadius: 32,
        borderBottomRightRadius: 32,
        shadowColor: "#004e92",
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.2,
        shadowRadius: 16,
        elevation: 8,
    },
    headerContent: {
        paddingHorizontal: 24,
        paddingTop: 12,
        paddingBottom: 8,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    headerTitle: {
        fontSize: 28,
        fontWeight: '700',
        color: '#fff',
        letterSpacing: 0.5,
    },
    headerSubtitle: {
        fontSize: 14,
        color: 'rgba(255,255,255,0.8)',
        fontWeight: '500',
        marginTop: 4,
    },
    headerIcon: {
        width: 40,
        height: 40,
        backgroundColor: 'rgba(255,255,255,0.2)',
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
    },
    content: {
        flex: 1,
        padding: 20,
    },
    section: {
        marginBottom: 24,
    },
    sectionTitle: {
        fontSize: 14,
        fontWeight: '700',
        color: '#64748B',
        marginBottom: 12,
        marginLeft: 4,
        letterSpacing: 0.5,
    },
    contactsContainer: {
        gap: 12,
    },
    contactCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'white',
        padding: 12,
        borderRadius: 16,
        gap: 16,
        borderWidth: 1,
        borderColor: '#F1F5F9',
    },
    iconBox: {
        width: 40,
        height: 40,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
    },
    contactInfo: {
        flex: 1,
    },
    contactName: {
        fontSize: 16,
        fontWeight: '600',
        color: '#1E293B',
        marginBottom: 2,
    },
    contactNumber: {
        fontSize: 13,
        color: '#64748B',
        fontWeight: '500',
    },
    callBtn: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: '#10B981',
        justifyContent: 'center',
        alignItems: 'center',
    },
    actionsGrid: {
        flexDirection: 'row',
        gap: 16,
    },
    actionButton: {
        flex: 1,
        borderRadius: 20,
        overflow: 'hidden',
        height: 140,
    },
    actionGradient: {
        flex: 1,
        padding: 16,
        justifyContent: 'space-between',
        alignItems: 'flex-start',
    },
    actionIconBox: {
        width: 48,
        height: 48,
        borderRadius: 14,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
    },
    actionText: {
        fontSize: 15,
        fontWeight: '600',
        color: '#1E3A8A',
        lineHeight: 20,
    },
    faqContainer: {
        gap: 12,
    },
    faqCard: {
        padding: 16,
        borderRadius: 16,
        borderWidth: 1,
    },
    faqHeader: {
        flexDirection: 'row',
        gap: 10,
        marginBottom: 8,
    },
    question: {
        fontSize: 15,
        fontWeight: '600',
        color: '#1E293B',
        flex: 1,
        lineHeight: 22,
    },
    answer: {
        color: '#64748B',
        lineHeight: 20,
        fontSize: 14,
        paddingLeft: 30, // Indent for cleanliness
    },
    shadowProp: {
        shadowColor: '#64748B',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.06,
        shadowRadius: 12,
        elevation: 3,
    },
});