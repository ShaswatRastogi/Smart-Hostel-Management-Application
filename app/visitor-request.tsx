import { MaterialCommunityIcons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { LinearGradient } from 'expo-linear-gradient';
import { Stack, useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
    ActivityIndicator,
    KeyboardAvoidingView,
    Platform,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAlert } from '../context/AlertContext';
import { useTheme } from '../utils/ThemeContext';
import { registerVisitor } from '../utils/visitorUtils';

export default function VisitorRequest() {
    const { colors, isDark } = useTheme();
    const router = useRouter();
    const { showAlert } = useAlert();

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
    const [loading, setLoading] = useState(false);

    const handleSubmit = async () => {
        // Validation
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
            setLoading(true);

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

            showAlert(
                'Success',
                'Visitor request submitted successfully. You will be notified once approved.',
                [
                    {
                        text: 'View My Visitors',
                        onPress: () => router.push('/my-visitors')
                    },
                    {
                        text: 'OK',
                        onPress: () => router.back()
                    }
                ],
                'success'
            );

            // Reset form
            setVisitorName('');
            setVisitorPhone('');
            setVisitorRelation('');
            setPurpose('');
            setExpectedDate(new Date());
            setExpectedTimeIn(new Date());
            setExpectedTimeOut(new Date());

        } catch (error: any) {
            console.error('Error submitting visitor request:', error);
            showAlert(
                'Error',
                error.response?.data?.error || 'Failed to submit visitor request',
                [],
                'error'
            );
        } finally {
            setLoading(false);
        }
    };

    const formatDate = (date: Date) => {
        return date.toLocaleDateString('en-IN', {
            day: '2-digit',
            month: 'short',
            year: 'numeric'
        });
    };

    const formatTime = (date: Date) => {
        return date.toLocaleTimeString('en-IN', {
            hour: '2-digit',
            minute: '2-digit',
            hour12: true
        });
    };

    const styles = StyleSheet.create({
        container: {
            flex: 1,
            backgroundColor: colors.background
        },
        header: {
            paddingBottom: 24,
            borderBottomLeftRadius: 32,
            borderBottomRightRadius: 32
        },
        headerContent: {
            paddingHorizontal: 24,
            paddingTop: 12,
            paddingBottom: 8
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
        content: {
            flex: 1
        },
        formContainer: {
            padding: 24
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
            marginTop: 8,
            marginBottom: 32
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
        disabledButton: {
            opacity: 0.6
        }
    });

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
                        <TouchableOpacity onPress={() => router.back()} style={{ marginBottom: 16 }}>
                            <MaterialCommunityIcons name="arrow-left" size={24} color="#fff" />
                        </TouchableOpacity>
                        <Text style={styles.headerTitle}>Register Visitor</Text>
                        <Text style={styles.headerSubtitle}>Submit visitor details for approval</Text>
                    </View>
                </SafeAreaView>
            </LinearGradient>

            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={{ flex: 1 }}
            >
                <ScrollView
                    style={styles.content}
                    contentContainerStyle={{ paddingBottom: 40 }}
                    showsVerticalScrollIndicator={false}
                >
                    <View style={styles.formContainer}>
                        {/* Visitor Name */}
                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>
                                Visitor Name <Text style={styles.required}>*</Text>
                            </Text>
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
                            <Text style={styles.label}>
                                Visitor Phone <Text style={styles.required}>*</Text>
                            </Text>
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
                            <Text style={styles.label}>
                                Purpose of Visit <Text style={styles.required}>*</Text>
                            </Text>
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
                            <Text style={styles.label}>
                                Expected Date <Text style={styles.required}>*</Text>
                            </Text>
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
                            style={[styles.submitButton, loading && styles.disabledButton]}
                            onPress={handleSubmit}
                            disabled={loading}
                            activeOpacity={0.8}
                        >
                            <LinearGradient
                                colors={['#000428', '#004e92']}
                                style={styles.submitGradient}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 0 }}
                            >
                                {loading ? (
                                    <ActivityIndicator color="#fff" />
                                ) : (
                                    <>
                                        <MaterialCommunityIcons name="send" size={20} color="#fff" />
                                        <Text style={styles.submitButtonText}>Submit Request</Text>
                                    </>
                                )}
                            </LinearGradient>
                        </TouchableOpacity>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
        </View>
    );
}
