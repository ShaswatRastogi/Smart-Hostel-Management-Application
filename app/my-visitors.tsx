import { MaterialCommunityIcons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { LinearGradient } from 'expo-linear-gradient';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import {
    ActivityIndicator,
    Dimensions,
    KeyboardAvoidingView,
    Platform,
    Pressable,
    RefreshControl,
    ScrollView,
    SectionList,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import PagerView from 'react-native-pager-view';
import { SafeAreaView } from 'react-native-safe-area-context';
import VisitorPassModal from '../components/VisitorPassModal';
import { useAlert } from '../context/AlertContext';
import { useRefresh } from '../hooks/useRefresh';
import { useTheme } from '../utils/ThemeContext';
import {
    cancelVisitor,
    formatDate,
    formatTime,
    getMyVisitors,
    getStatusColor,
    getStatusIcon,
    getStatusLabel,
    registerVisitor,
    Visitor
} from '../utils/visitorUtils';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export default function MyVisitors() {
    const { colors, isDark, theme } = useTheme();
    const router = useRouter();
    const { showAlert } = useAlert();
    const params = useLocalSearchParams();

    // Tab State
    const [activeTab, setActiveTab] = useState(0); // 0: My Visitors, 1: New Request
    const pagerRef = useRef<PagerView>(null);

    // List State
    const [visitors, setVisitors] = useState<Visitor[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedVisitor, setSelectedVisitor] = useState<Visitor | null>(null);
    const [showPassModal, setShowPassModal] = useState(false);

    // Form State
    const [visitorName, setVisitorName] = useState('');
    const [visitorPhone, setVisitorPhone] = useState('');
    const [visitorRelation, setVisitorRelation] = useState('');
    const [purpose, setPurpose] = useState('');
    const [expectedDate, setExpectedDate] = useState(new Date());
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [expectedTimeIn, setExpectedTimeIn] = useState(new Date());
    const [showTimeInPicker, setShowTimeInPicker] = useState(false);
    const [expectedTimeOut, setExpectedTimeOut] = useState(new Date());
    const [showTimeOutPicker, setShowTimeOutPicker] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    const { refreshing, onRefresh } = useRefresh(loadVisitors);

    // Initial Load
    useEffect(() => {
        loadVisitors();
    }, []);

    // Tab Handling
    useEffect(() => {
        if (params.tab === 'history') {
            handleTabChange(1);
        } else if (params.tab === 'new') {
            handleTabChange(0);
        }
    }, [params.tab]);

    const handleTabChange = (index: number) => {
        setActiveTab(index);
        pagerRef.current?.setPage(index);
    };

    async function loadVisitors() {
        try {
            setLoading(true);
            const data = await getMyVisitors();
            setVisitors(data);
        } catch (error) {
            console.error('Error loading visitors:', error);
            // Silent error or simple alert
        } finally {
            setLoading(false);
        }
    }

    // --- Actions ---

    const handleCancelVisitor = (visitor: Visitor) => {
        showAlert(
            'Cancel Visitor',
            `Are you sure you want to cancel the visitor request for ${visitor.visitor_name}?`,
            [
                { text: 'No', style: 'cancel' },
                {
                    text: 'Yes, Cancel',
                    onPress: async () => {
                        try {
                            await cancelVisitor(visitor.id);
                            showAlert('Success', 'Visitor request cancelled', [], 'success');
                            loadVisitors();
                        } catch (error) {
                            showAlert('Error', 'Failed to cancel visitor', [], 'error');
                        }
                    }
                }
            ],
            'warning'
        );
    };

    const handleViewPass = (visitor: Visitor) => {
        setSelectedVisitor(visitor);
        setShowPassModal(true);
    };

    const handleSubmitRequest = async () => {
        if (!visitorName.trim()) {
            showAlert('Missing Information', 'Please enter visitor name', [], 'error');
            return;
        }
        if (!visitorPhone.trim() || !/^\d{10}$/.test(visitorPhone)) {
            showAlert('Invalid Phone', 'Please enter a valid 10-digit phone number', [], 'error');
            return;
        }
        if (!purpose.trim()) {
            showAlert('Missing Information', 'Please enter purpose of visit', [], 'error');
            return;
        }

        try {
            setSubmitting(true);
            const formattedDate = expectedDate.toISOString().split('T')[0];
            const formattedTimeIn = expectedTimeIn.toTimeString().split(' ')[0].substring(0, 5);
            const formattedTimeOut = expectedTimeOut.toTimeString().split(' ')[0].substring(0, 5);

            await registerVisitor({
                visitorName: visitorName.trim(),
                visitorPhone: visitorPhone.trim(),
                visitorRelation: visitorRelation.trim(),
                purpose: purpose.trim(),
                expectedDate: formattedDate,
                expectedTimeIn: formattedTimeIn,
                expectedTimeOut: formattedTimeOut
            });

            showAlert('Success', 'Visitor request submitted successfully.', [], 'success');

            // Reset form
            setVisitorName('');
            setVisitorPhone('');
            setVisitorRelation('');
            setPurpose('');
            setExpectedDate(new Date());

            // Switch to list tab and reload
            handleTabChange(0);
            loadVisitors();

        } catch (error: any) {
            console.error('Error submitting visitor request:', error);
            showAlert('Error', error.response?.data?.error || 'Failed to submit visitor request', [], 'error');
        } finally {
            setSubmitting(false);
        }
    };

    // --- Sections ---

    const getSections = () => {
        const active = visitors.filter(v => ['pending', 'approved', 'checked_in'].includes(v.status));
        const history = visitors.filter(v => ['checked_out', 'rejected', 'cancelled'].includes(v.status));

        const sections = [];
        if (active.length > 0) sections.push({ title: 'Active & Upcoming', data: active });
        if (history.length > 0) sections.push({ title: 'History', data: history });
        return sections;
    };

    const sections = getSections();

    // --- Styles ---

    const styles = StyleSheet.create({
        container: {
            flex: 1,
            backgroundColor: colors.background
        },
        header: {
            paddingBottom: 24,
            borderBottomLeftRadius: 32,
            borderBottomRightRadius: 32,
            marginBottom: 0
        },
        headerContent: {
            paddingHorizontal: 24,
            paddingTop: 12,
            paddingBottom: 8
        },
        headerTop: {
            flexDirection: 'row',
            alignItems: 'center',
            marginBottom: 8
        },
        headerTitle: {
            fontSize: 28,
            fontWeight: '700',
            color: '#fff',
            letterSpacing: 0.5
        },
        headerSubtitle: {
            fontSize: 14,
            color: 'rgba(255,255,255,0.8)',
            fontWeight: '500',
            marginTop: 4
        },
        navBar: {
            flexDirection: 'row',
            backgroundColor: colors.card,
            marginHorizontal: 20,
            marginTop: 20,
            marginBottom: 20,
            borderRadius: 16,
            padding: 6,
            shadowColor: colors.textSecondary,
            shadowOpacity: 0.08,
            shadowRadius: 8,
            shadowOffset: { width: 0, height: 4 },
            elevation: 3,
        },
        navItem: {
            flex: 1,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
            paddingVertical: 12,
            borderRadius: 12,
        },
        navItemActive: {
            backgroundColor: isDark ? 'rgba(59, 130, 246, 0.15)' : '#EFF6FF',
        },
        navItemLabel: {
            fontSize: 13,
            fontWeight: '600',
            color: colors.textSecondary,
        },
        navItemLabelActive: {
            color: colors.primary,
            fontWeight: '700',
        },
        pagerView: {
            flex: 1,
        },
        pageContent: {
            flex: 1,
        },
        sectionHeader: {
            fontSize: 18,
            fontWeight: '700',
            color: colors.text,
            marginTop: 8,
            marginBottom: 16,
            paddingHorizontal: 4
        },
        visitorsList: {
            padding: 24,
            paddingTop: 0
        },
        visitorCard: {
            backgroundColor: colors.card,
            borderRadius: 20,
            padding: 16,
            marginBottom: 16,
            borderWidth: 1,
            borderColor: colors.border,
            elevation: 2,
            shadowColor: colors.textSecondary,
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.05,
            shadowRadius: 8
        },
        visitorHeader: {
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            marginBottom: 12
        },
        visitorInfo: {
            flex: 1
        },
        visitorName: {
            fontSize: 18,
            fontWeight: '700',
            color: colors.text,
            marginBottom: 4
        },
        visitorPhone: {
            fontSize: 14,
            color: colors.textSecondary,
            marginBottom: 2
        },
        statusBadge: {
            flexDirection: 'row',
            alignItems: 'center',
            gap: 4,
            paddingHorizontal: 12,
            paddingVertical: 6,
            borderRadius: 12
        },
        statusText: {
            fontSize: 12,
            fontWeight: '700'
        },
        detailsRow: {
            flexDirection: 'row',
            alignItems: 'center',
            gap: 8,
            marginBottom: 8
        },
        detailText: {
            fontSize: 14,
            color: colors.textSecondary,
            flex: 1
        },
        purpose: {
            fontSize: 14,
            color: colors.text,
            lineHeight: 20,
            marginTop: 8,
            paddingTop: 12,
            borderTopWidth: 1,
            borderTopColor: colors.border
        },
        actionsRow: {
            flexDirection: 'row',
            gap: 8,
            marginTop: 12
        },
        actionButton: {
            flex: 1,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 6,
            paddingVertical: 10,
            borderRadius: 12,
            borderWidth: 1
        },
        viewPassButton: {
            backgroundColor: '#10B981',
            borderColor: '#10B981'
        },
        cancelButton: {
            backgroundColor: 'transparent',
            borderColor: '#EF4444'
        },
        actionButtonText: {
            fontSize: 14,
            fontWeight: '600'
        },
        emptyState: {
            alignItems: 'center',
            justifyContent: 'center',
            paddingVertical: 60
        },
        emptyText: {
            fontSize: 16,
            color: colors.textSecondary,
            fontWeight: '500',
            marginTop: 12
        },
        // Form Styles
        formContainer: {
            padding: 24,
        },
        inputGroup: {
            marginBottom: 20
        },
        label: {
            fontSize: 14,
            fontWeight: '600',
            color: colors.text,
            marginBottom: 8,
            marginLeft: 4
        },
        required: {
            color: '#EF4444'
        },
        input: {
            backgroundColor: isDark ? colors.card : '#F8FAFC',
            borderRadius: 16,
            padding: 16,
            fontSize: 16,
            color: colors.text,
            borderWidth: 1,
            borderColor: colors.border
        },
        textArea: {
            height: 100,
            textAlignVertical: 'top'
        },
        dateButton: {
            backgroundColor: isDark ? colors.card : '#F8FAFC',
            borderRadius: 16,
            padding: 16,
            borderWidth: 1,
            borderColor: colors.border,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between'
        },
        dateButtonText: {
            fontSize: 16,
            color: colors.text
        },
        timeRow: {
            flexDirection: 'row',
            gap: 12
        },
        timeGroup: {
            flex: 1
        },
        submitButton: {
            borderRadius: 16,
            overflow: 'hidden',
            marginTop: 12,
            marginBottom: 40,
            shadowColor: colors.primary,
            shadowOffset: { width: 0, height: 8 },
            shadowOpacity: 0.3,
            shadowRadius: 10,
            elevation: 8,
        },
        submitGradient: {
            paddingVertical: 18,
            alignItems: 'center',
            flexDirection: 'row',
            justifyContent: 'center',
            gap: 8
        },
        submitButtonText: {
            color: '#fff',
            fontSize: 16,
            fontWeight: '700',
            letterSpacing: 0.5
        },
    });

    // --- Render Items ---

    const renderVisitorCard = ({ item: visitor }: { item: Visitor }) => (
        <View style={styles.visitorCard}>
            <View style={styles.visitorHeader}>
                <View style={styles.visitorInfo}>
                    <Text style={styles.visitorName}>{visitor.visitor_name}</Text>
                    <Text style={styles.visitorPhone}>📞 {visitor.visitor_phone}</Text>
                    {visitor.visitor_relation && (
                        <Text style={[styles.detailText, { fontSize: 13, fontStyle: 'italic', marginTop: 2 }]}>{visitor.visitor_relation}</Text>
                    )}
                </View>
                <View style={[styles.statusBadge, { backgroundColor: getStatusColor(visitor.status) + '20' }]}>
                    <MaterialCommunityIcons name={getStatusIcon(visitor.status) as any} size={14} color={getStatusColor(visitor.status)} />
                    <Text style={[styles.statusText, { color: getStatusColor(visitor.status) }]}>{getStatusLabel(visitor.status)}</Text>
                </View>
            </View>

            <View style={styles.detailsRow}>
                <MaterialCommunityIcons name="calendar" size={16} color={colors.textSecondary} />
                <Text style={styles.detailText}>{formatDate(visitor.expected_date)}</Text>
            </View>

            <View style={styles.detailsRow}>
                <MaterialCommunityIcons name="clock-outline" size={16} color={colors.textSecondary} />
                <Text style={styles.detailText}>
                    {visitor.expected_time_in ? formatTime(visitor.expected_time_in) : 'N/A'} - {visitor.expected_time_out ? formatTime(visitor.expected_time_out) : 'N/A'}
                </Text>
            </View>

            <Text style={styles.purpose}>{visitor.purpose}</Text>

            {visitor.admin_remarks && (
                <View style={{ marginTop: 8, padding: 12, backgroundColor: isDark ? '#1E293B' : '#FEF2F2', borderRadius: 12 }}>
                    <Text style={{ fontSize: 12, color: colors.textSecondary, marginBottom: 4, fontWeight: '600' }}>Admin Remarks:</Text>
                    <Text style={{ fontSize: 13, color: colors.text }}>{visitor.admin_remarks}</Text>
                </View>
            )}

            {/* Actions */}
            {visitor.status === 'approved' && (
                <View style={styles.actionsRow}>
                    <TouchableOpacity style={[styles.actionButton, styles.viewPassButton]} onPress={() => handleViewPass(visitor)}>
                        <MaterialCommunityIcons name="qrcode" size={18} color="#fff" />
                        <Text style={[styles.actionButtonText, { color: '#fff' }]}>View Pass</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={[styles.actionButton, styles.cancelButton]} onPress={() => handleCancelVisitor(visitor)}>
                        <MaterialCommunityIcons name="close-circle-outline" size={18} color="#EF4444" />
                        <Text style={[styles.actionButtonText, { color: '#EF4444' }]}>Cancel</Text>
                    </TouchableOpacity>
                </View>
            )}

            {visitor.status === 'pending' && (
                <View style={styles.actionsRow}>
                    <TouchableOpacity style={[styles.actionButton, styles.cancelButton, { flex: 1 }]} onPress={() => handleCancelVisitor(visitor)}>
                        <MaterialCommunityIcons name="close-circle-outline" size={18} color="#EF4444" />
                        <Text style={[styles.actionButtonText, { color: '#EF4444' }]}>Cancel Request</Text>
                    </TouchableOpacity>
                </View>
            )}
        </View>
    );

    return (
        <View style={styles.container}>
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
                        <View style={styles.headerTop}>
                            <TouchableOpacity onPress={() => router.back()} style={{ marginRight: 16 }}>
                                <MaterialCommunityIcons name="arrow-left" size={24} color="#fff" />
                            </TouchableOpacity>
                            <View style={{ flex: 1 }}>
                                <Text style={styles.headerTitle}>Visitor Management</Text>
                                <Text style={styles.headerSubtitle}>Manage visits and passes</Text>
                            </View>
                        </View>
                    </View>
                </SafeAreaView>
            </LinearGradient>

            {/* Tabs */}
            <View style={styles.navBar}>
                <TouchableOpacity
                    style={[styles.navItem, activeTab === 0 && styles.navItemActive]}
                    onPress={() => handleTabChange(0)}
                >
                    <MaterialCommunityIcons name="plus-circle-outline" size={20} color={activeTab === 0 ? colors.primary : colors.textSecondary} />
                    <Text style={[styles.navItemLabel, activeTab === 0 && styles.navItemLabelActive]}>New Request</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={[styles.navItem, activeTab === 1 && styles.navItemActive]}
                    onPress={() => handleTabChange(1)}
                >
                    <MaterialCommunityIcons name="history" size={20} color={activeTab === 1 ? colors.primary : colors.textSecondary} />
                    <Text style={[styles.navItemLabel, activeTab === 1 && styles.navItemLabelActive]}>My Visitors</Text>
                </TouchableOpacity>
            </View>

            {/* Content Pages */}
            <PagerView
                ref={pagerRef}
                style={styles.pagerView}
                initialPage={0}
                onPageSelected={(e) => setActiveTab(e.nativeEvent.position)}
            >
                {/* PAGE 1: FORM (Now First) */}
                <View key="1" style={styles.pageContent}>
                    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
                        <ScrollView contentContainerStyle={styles.formContainer} showsVerticalScrollIndicator={false}>
                            {/* Visitor Name */}
                            <View style={styles.inputGroup}>
                                <Text style={styles.label}>Visitor Name <Text style={styles.required}>*</Text></Text>
                                <TextInput
                                    style={styles.input}
                                    value={visitorName}
                                    onChangeText={setVisitorName}
                                    placeholder="Enter visitor's full name"
                                    placeholderTextColor={colors.textSecondary}
                                />
                            </View>

                            {/* Visitor Phone */}
                            <View style={styles.inputGroup}>
                                <Text style={styles.label}>Visitor Phone <Text style={styles.required}>*</Text></Text>
                                <TextInput
                                    style={styles.input}
                                    value={visitorPhone}
                                    onChangeText={setVisitorPhone}
                                    placeholder="10-digit mobile number"
                                    placeholderTextColor={colors.textSecondary}
                                    keyboardType="phone-pad"
                                    maxLength={10}
                                />
                            </View>

                            {/* Relation */}
                            <View style={styles.inputGroup}>
                                <Text style={styles.label}>Relation (Optional)</Text>
                                <TextInput
                                    style={styles.input}
                                    value={visitorRelation}
                                    onChangeText={setVisitorRelation}
                                    placeholder="e.g., Father, Mother, Friend"
                                    placeholderTextColor={colors.textSecondary}
                                />
                            </View>

                            {/* Purpose */}
                            <View style={styles.inputGroup}>
                                <Text style={styles.label}>Purpose of Visit <Text style={styles.required}>*</Text></Text>
                                <TextInput
                                    style={[styles.input, styles.textArea]}
                                    value={purpose}
                                    onChangeText={setPurpose}
                                    placeholder="Describe the purpose of visit"
                                    placeholderTextColor={colors.textSecondary}
                                    multiline
                                    numberOfLines={4}
                                />
                            </View>

                            {/* Expected Date */}
                            <View style={styles.inputGroup}>
                                <Text style={styles.label}>Expected Date <Text style={styles.required}>*</Text></Text>
                                <Pressable style={styles.dateButton} onPress={() => setShowDatePicker(true)}>
                                    <Text style={styles.dateButtonText}>{formatDate(expectedDate)}</Text>
                                    <MaterialCommunityIcons name="calendar" size={20} color={colors.primary} />
                                </Pressable>
                                {showDatePicker && (
                                    <DateTimePicker
                                        value={expectedDate}
                                        mode="date"
                                        display="default"
                                        onChange={(event, date) => {
                                            setShowDatePicker(false);
                                            if (date) setExpectedDate(date);
                                        }}
                                        minimumDate={new Date()}
                                    />
                                )}
                            </View>

                            {/* Expected Time */}
                            <View style={styles.timeRow}>
                                <View style={styles.timeGroup}>
                                    <Text style={styles.label}>Time In</Text>
                                    <Pressable style={styles.dateButton} onPress={() => setShowTimeInPicker(true)}>
                                        <Text style={styles.dateButtonText}>{formatTime(expectedTimeIn)}</Text>
                                        <MaterialCommunityIcons name="clock-outline" size={20} color={colors.primary} />
                                    </Pressable>
                                    {showTimeInPicker && (
                                        <DateTimePicker
                                            value={expectedTimeIn}
                                            mode="time"
                                            display="default"
                                            onChange={(event, date) => {
                                                setShowTimeInPicker(false);
                                                if (date) setExpectedTimeIn(date);
                                            }}
                                        />
                                    )}
                                </View>

                                <View style={styles.timeGroup}>
                                    <Text style={styles.label}>Time Out</Text>
                                    <Pressable style={styles.dateButton} onPress={() => setShowTimeOutPicker(true)}>
                                        <Text style={styles.dateButtonText}>{formatTime(expectedTimeOut)}</Text>
                                        <MaterialCommunityIcons name="clock-outline" size={20} color={colors.primary} />
                                    </Pressable>
                                    {showTimeOutPicker && (
                                        <DateTimePicker
                                            value={expectedTimeOut}
                                            mode="time"
                                            display="default"
                                            onChange={(event, date) => {
                                                setShowTimeOutPicker(false);
                                                if (date) setExpectedTimeOut(date);
                                            }}
                                        />
                                    )}
                                </View>
                            </View>

                            {/* Submit Button */}
                            <TouchableOpacity
                                style={[styles.submitButton, submitting && { opacity: 0.7 }]}
                                onPress={handleSubmitRequest}
                                disabled={submitting}
                                activeOpacity={0.8}
                            >
                                <LinearGradient
                                    colors={['#000428', '#004e92']}
                                    style={styles.submitGradient}
                                    start={{ x: 0, y: 0 }}
                                    end={{ x: 1, y: 0 }}
                                >
                                    {submitting ? (
                                        <ActivityIndicator color="#fff" />
                                    ) : (
                                        <>
                                            <MaterialCommunityIcons name="send" size={20} color="#fff" />
                                            <Text style={styles.submitButtonText}>Submit Request</Text>
                                        </>
                                    )}
                                </LinearGradient>
                            </TouchableOpacity>
                        </ScrollView>
                    </KeyboardAvoidingView>
                </View>

                {/* PAGE 2: LIST (Now Second) */}
                <View key="2" style={styles.pageContent}>
                    {loading ? (
                        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                            <ActivityIndicator size="large" color={colors.primary} />
                        </View>
                    ) : visitors.length === 0 ? (
                        <View style={styles.emptyState}>
                            <MaterialCommunityIcons name="account-group-outline" size={64} color={colors.textSecondary} />
                            <Text style={styles.emptyText}>No visitor requests found</Text>
                            <TouchableOpacity style={{ marginTop: 16 }} onPress={() => handleTabChange(0)}>
                                <Text style={{ color: colors.primary, fontWeight: '700' }}>Create New Request</Text>
                            </TouchableOpacity>
                        </View>
                    ) : (
                        <SectionList
                            sections={sections}
                            keyExtractor={(item) => item.id.toString()}
                            renderItem={renderVisitorCard}
                            renderSectionHeader={({ section: { title } }) => (
                                <Text style={styles.sectionHeader}>{title}</Text>
                            )}
                            contentContainerStyle={styles.visitorsList}
                            refreshControl={
                                <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={isDark ? '#fff' : colors.primary} colors={[colors.primary]} />
                            }
                            stickySectionHeadersEnabled={false}
                            showsVerticalScrollIndicator={false}
                        />
                    )}
                </View>
            </PagerView>

            {/* Visitor Pass Modal */}
            {selectedVisitor && (
                <VisitorPassModal
                    visible={showPassModal}
                    visitor={selectedVisitor}
                    onClose={() => {
                        setShowPassModal(false);
                        setSelectedVisitor(null);
                    }}
                />
            )}
        </View>
    );
}
