import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import React from 'react';
import { Dimensions, Modal, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../utils/ThemeContext';

interface StudentDetailsModalProps {
    visible: boolean;
    student: any;
    onClose: () => void;
    onEdit: (student: any) => void;
    onDelete: (id: string, name: string, room: string) => void;
}

import { API_BASE_URL } from '../utils/api';
import AttendanceHistory from './AttendanceHistory';
import { isWardenOrOwner, useUser } from '../utils/authUtils';


export default function StudentDetailsModal({ visible, student, onClose, onEdit, onDelete, viewMode = 'full' }: StudentDetailsModalProps & { viewMode?: 'full' | 'attendance' }) {
    const { colors, theme } = useTheme();
    const insets = useSafeAreaInsets();
    const router = useRouter();
    const user = useUser();

    if (!visible || !student) return null;

    const getStatusColor = (status: string) => {
        return status === 'active' ? '#4CAF50' : '#F44336';
    };

    const styles = StyleSheet.create({
        centeredView: {
            flex: 1,
            justifyContent: 'center',
            alignItems: 'center',
            backgroundColor: 'rgba(15, 23, 42, 0.6)',
        },
        modalContent: {
            backgroundColor: colors.card,
            borderRadius: 24,
            width: '90%',
            maxHeight: Dimensions.get('window').height * 0.85,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 20 },
            shadowOpacity: 0.3,
            shadowRadius: 20,
            elevation: 20,
            overflow: 'hidden',
        },
        modalHeader: {
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: 24,
            borderBottomWidth: 1,
            borderBottomColor: colors.border,
        },
        modalTitle: {
            fontSize: 20,
            fontWeight: '800',
            color: colors.text,
        },
        closeBtn: {
            padding: 4,
            backgroundColor: colors.background,
            borderRadius: 20,
        },
        modalBody: {
            padding: 24,
        },
        infoSection: {
            marginBottom: 16,
            backgroundColor: colors.background,
            borderRadius: 16,
            padding: 16,
            borderWidth: 1,
            borderColor: colors.border,
        },
        sectionTitle: {
            fontSize: 14,
            fontWeight: '700',
            color: colors.textSecondary,
            marginBottom: 12,
            textTransform: 'uppercase',
        },
        pill: {
            paddingHorizontal: 10,
            paddingVertical: 4,
            borderRadius: 8,
        },
        detailSmall: {
            fontSize: 11,
            fontWeight: '700',
        },
        detailRow: {
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            paddingVertical: 8,
            borderBottomWidth: 1,
            borderBottomColor: colors.border,
        },
        detailLeft: {
            flexDirection: 'row',
            alignItems: 'center',
            gap: 10,
        },
        detailLabel: {
            fontSize: 12,
            fontWeight: '600',
            color: colors.textSecondary,
        },
        detailValue: {
            fontSize: 13,
            fontWeight: '600',
            color: colors.text,
            textAlign: 'right',
            flex: 1,
            marginLeft: 16,
        },

        actionButtons: {
            flexDirection: 'row',
            gap: 12,
            marginTop: 8,
        },
        actionBtn: {
            flex: 1,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            paddingVertical: 12,
            borderRadius: 12,
            gap: 8,
        },
        editBtn: {
            backgroundColor: colors.primary,
        },
        deleteBtn: {
            backgroundColor: '#EF4444',
        },
        actionBtnText: {
            color: '#fff',
            fontSize: 13,
            fontWeight: '700',
        },
    });

    return (
        <Modal
            animationType="slide"
            transparent={true}
            visible={visible}
            onRequestClose={onClose}
            statusBarTranslucent
        >
            <View style={styles.centeredView}>
                <View style={styles.modalContent}>
                    <View style={styles.modalHeader}>
                        <Text style={styles.modalTitle}>
                            {viewMode === 'attendance' ? 'Attendance Details' : 'Student Details'}
                        </Text>
                        <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
                            <MaterialCommunityIcons name="close" size={24} color="#64748B" />
                        </TouchableOpacity>
                    </View>

                    <ScrollView contentContainerStyle={styles.modalBody} showsVerticalScrollIndicator={false}>
                        {/* Profile Header */}
                        <View style={{ alignItems: 'center', marginBottom: 20 }}>
                            {student.profilePhoto ? (
                                <Image
                                    source={{ uri: student.profilePhoto.startsWith('http') ? student.profilePhoto : `${API_BASE_URL}${student.profilePhoto}` }}
                                    style={{ width: 100, height: 100, borderRadius: 50, marginBottom: 8 }}
                                    contentFit="cover"
                                />
                            ) : (
                                <View style={{ width: 100, height: 100, borderRadius: 50, backgroundColor: colors.primary, justifyContent: 'center', alignItems: 'center', marginBottom: 8 }}>
                                    <Text style={{ fontSize: 36, fontWeight: '800', color: '#fff' }}>
                                        {(student.name || student.fullName) ? (student.name || student.fullName).split(' ').map((n: string) => n[0]).join('').toUpperCase() : '?'}
                                    </Text>
                                </View>
                            )}
                            <Text style={{ fontSize: 18, fontWeight: '700', color: colors.text, marginTop: 4 }}>{student.name || student.fullName}</Text>
                            <Text style={{ fontSize: 14, color: colors.textSecondary }}>{student.rollNo} • Room {student.room || student.roomNo}</Text>

                            {viewMode === 'full' && (
                                <>
                                    {isWardenOrOwner(user) && (
                                        <View style={[styles.actionButtons, { marginTop: 16, width: '100%' }]}>
                                            <TouchableOpacity
                                                style={[styles.actionBtn, styles.editBtn]}
                                                onPress={() => {
                                                    onClose();
                                                    onEdit(student);
                                                }}
                                            >
                                                <MaterialCommunityIcons name="pencil" size={16} color="#fff" />
                                                <Text style={styles.actionBtnText}>Edit</Text>
                                            </TouchableOpacity>
                                            <TouchableOpacity
                                                style={[styles.actionBtn, styles.deleteBtn]}
                                                onPress={() => {
                                                    onDelete(student.id || student._id, student.name, student.room);
                                                }}
                                            >
                                                <MaterialCommunityIcons name="delete" size={16} color="#fff" />
                                                <Text style={styles.actionBtnText}>Delete</Text>
                                            </TouchableOpacity>
                                        </View>
                                    )}

                                    <TouchableOpacity
                                        style={[styles.actionBtn, { backgroundColor: '#8B5CF6', marginTop: 12, width: '100%' }]}
                                        onPress={() => {
                                            onClose();
                                            router.push({
                                                pathname: '/admin/visitors' as any,
                                                params: { studentId: student.id, studentName: student.name }
                                            });
                                        }}
                                    >
                                        <MaterialCommunityIcons name="account-multiple-check" size={18} color="#fff" />
                                        <Text style={styles.actionBtnText}>View Visitors</Text>
                                    </TouchableOpacity>
                                </>
                            )}
                        </View>

                        {viewMode === 'attendance' ? (
                            <AttendanceHistory studentId={student.studentId || student.id} />
                        ) : (
                            <>
                                {/* Basic Information */}
                                <View style={styles.infoSection}>
                                    <Text style={styles.sectionTitle}>Basic Information</Text>
                                    <View style={styles.detailRow}>
                                        <View style={styles.detailLeft}>
                                            <MaterialCommunityIcons name="card-account-details" size={16} color="#6366F1" />
                                            <Text style={styles.detailLabel}>Roll No</Text>
                                        </View>
                                        <Text style={styles.detailValue}>{student.rollNo}</Text>
                                    </View>
                                    <View style={styles.detailRow}>
                                        <View style={styles.detailLeft}>
                                            <MaterialCommunityIcons name="school" size={16} color="#8B5CF6" />
                                            <Text style={styles.detailLabel}>College</Text>
                                        </View>
                                        <Text style={styles.detailValue}>{student.collegeName || 'N/A'}</Text>
                                    </View>
                                    <View style={styles.detailRow}>
                                        <View style={styles.detailLeft}>
                                            <MaterialCommunityIcons name="office-building" size={16} color="#8B5CF6" />
                                            <Text style={styles.detailLabel}>Hostel</Text>
                                        </View>
                                        <Text style={styles.detailValue}>{student.hostelName || 'N/A'}</Text>
                                    </View>
                                    <View style={styles.detailRow}>
                                        <View style={styles.detailLeft}>
                                            <MaterialCommunityIcons name="phone" size={16} color="#EC4899" />
                                            <Text style={styles.detailLabel}>Phone</Text>
                                        </View>
                                        <Text style={styles.detailValue}>{student.phone}</Text>
                                    </View>
                                    <View style={styles.detailRow}>
                                        <View style={styles.detailLeft}>
                                            <MaterialCommunityIcons name="email-lock" size={16} color="#06B6D4" />
                                            <Text style={styles.detailLabel}>Login Email</Text>
                                        </View>
                                        <Text style={styles.detailValue}>{student.email}</Text>
                                    </View>
                                    <View style={styles.detailRow}>
                                        <View style={styles.detailLeft}>
                                            <MaterialCommunityIcons name="google" size={16} color="#EA4335" />
                                            <Text style={styles.detailLabel}>Google Email</Text>
                                        </View>
                                        <Text style={styles.detailValue}>{student.googleEmail || 'N/A'}</Text>
                                    </View>
                                    <View style={styles.detailRow}>
                                        <View style={styles.detailLeft}>
                                            <MaterialCommunityIcons name="email-outline" size={16} color="#06B6D4" />
                                            <Text style={styles.detailLabel}>College Email</Text>
                                        </View>
                                        <Text style={styles.detailValue}>{student.collegeEmail || 'N/A'}</Text>
                                    </View>
                                    <View style={[styles.detailRow, { borderBottomWidth: 0, backgroundColor: theme === 'dark' ? 'rgba(245, 158, 11, 0.1)' : '#FFFBEB', marginHorizontal: -16, paddingHorizontal: 16, marginTop: 8, paddingVertical: 12 }]}>
                                        <View style={styles.detailLeft}>
                                            <MaterialCommunityIcons name="key" size={16} color="#F59E0B" />
                                            <Text style={styles.detailLabel}>Password</Text>
                                        </View>
                                        <Text style={[styles.detailValue, { fontFamily: 'monospace', color: '#D97706', fontSize: 14 }]}>
                                            {student.password || student.tempPassword || 'N/A'}
                                        </Text>
                                    </View>
                                </View>

                                {/* Room & Configuration */}
                                <View style={styles.infoSection}>
                                    <Text style={styles.sectionTitle}>Room Configuration</Text>
                                    <View style={styles.detailRow}>
                                        <View style={styles.detailLeft}>
                                            <MaterialCommunityIcons name="door-closed" size={16} color="#8B5CF6" />
                                            <Text style={styles.detailLabel}>Room No</Text>
                                        </View>
                                        <Text style={styles.detailValue}>{student.room}</Text>
                                    </View>
                                    <View style={styles.detailRow}>
                                        <View style={styles.detailLeft}>
                                            <MaterialCommunityIcons name="door-open" size={16} color="#06B6D4" />
                                            <Text style={styles.detailLabel}>Room Type</Text>
                                        </View>
                                        <Text style={styles.detailValue}>{student.roomType || 'N/A'}</Text>
                                    </View>
                                    <View style={styles.detailRow}>
                                        <View style={styles.detailLeft}>
                                            <MaterialCommunityIcons name="wifi" size={16} color="#06B6D4" />
                                            <Text style={styles.detailLabel}>WiFi SSID</Text>
                                        </View>
                                        <Text style={styles.detailValue}>{student.wifiSSID || 'N/A'}</Text>
                                    </View>
                                    <View style={styles.detailRow}>
                                        <View style={styles.detailLeft}>
                                            <MaterialCommunityIcons name="lock-outline" size={16} color="#06B6D4" />
                                            <Text style={styles.detailLabel}>WiFi Password</Text>
                                        </View>
                                        <Text style={styles.detailValue}>{student.wifiPassword || 'N/A'}</Text>
                                    </View>

                                    <Text style={[styles.detailLabel, { marginTop: 12, marginBottom: 8 }]}>Facilities</Text>
                                    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
                                        {(() => {
                                            let facilities = [];
                                            try {
                                                facilities = typeof student.facilities === 'string'
                                                    ? JSON.parse(student.facilities)
                                                    : (Array.isArray(student.facilities) ? student.facilities : []);
                                            } catch (e) { console.log(e); }

                                            if (facilities.length === 0) return <Text style={styles.detailValue}>No facilities configured</Text>;

                                            return facilities.map((f: any, i: number) => (
                                                <View key={i} style={[
                                                    styles.pill,
                                                    {
                                                        backgroundColor: f.status === 'Included'
                                                            ? 'rgba(6, 182, 212, 0.1)'
                                                            : 'rgba(156, 163, 175, 0.1)',
                                                        flexDirection: 'row',
                                                        alignItems: 'center',
                                                        gap: 4
                                                    }
                                                ]}>
                                                    <MaterialCommunityIcons
                                                        name={f.icon || 'star'}
                                                        size={12}
                                                        color={f.status === 'Included' ? '#06B6D4' : '#9BA3AF'}
                                                    />
                                                    <Text style={[
                                                        styles.detailSmall,
                                                        { color: f.status === 'Included' ? '#06B6D4' : '#9BA3AF' }
                                                    ]}>{f.name}</Text>
                                                </View>
                                            ));
                                        })()}
                                    </View>
                                </View>

                                {/* Family & Personal */}
                                <View style={styles.infoSection}>
                                    <Text style={styles.sectionTitle}>Family & Personal</Text>
                                    <View style={styles.detailRow}>
                                        <View style={styles.detailLeft}>
                                            <MaterialCommunityIcons name="account-tie" size={16} color="#6366F1" />
                                            <Text style={styles.detailLabel}>Father</Text>
                                        </View>
                                        <View style={{ flex: 1, alignItems: 'flex-end' }}>
                                            <Text style={styles.detailValue}>{student.fatherName || 'N/A'}</Text>
                                            {student.fatherPhone && student.fatherPhone !== 'N/A' && (
                                                <Text style={[styles.detailValue, { fontSize: 12, color: colors.textSecondary }]}>{student.fatherPhone}</Text>
                                            )}
                                        </View>
                                    </View>
                                    <View style={styles.detailRow}>
                                        <View style={styles.detailLeft}>
                                            <MaterialCommunityIcons name="face-woman" size={16} color="#EC4899" />
                                            <Text style={styles.detailLabel}>Mother</Text>
                                        </View>
                                        <View style={{ flex: 1, alignItems: 'flex-end' }}>
                                            <Text style={styles.detailValue}>{student.motherName || 'N/A'}</Text>
                                            {student.motherPhone && student.motherPhone !== 'N/A' && (
                                                <Text style={[styles.detailValue, { fontSize: 12, color: colors.textSecondary }]}>{student.motherPhone}</Text>
                                            )}
                                        </View>
                                    </View>
                                    <View style={styles.detailRow}>
                                        <View style={styles.detailLeft}>
                                            <MaterialCommunityIcons name="map-marker" size={16} color="#F59E0B" />
                                            <Text style={styles.detailLabel}>Address</Text>
                                        </View>
                                        <Text style={styles.detailValue}>{student.address || 'N/A'}</Text>
                                    </View>
                                    <View style={[styles.detailRow, { borderBottomWidth: 0 }]}>
                                        <View style={styles.detailLeft}>
                                            <MaterialCommunityIcons name="calendar" size={16} color="#6366F1" />
                                            <Text style={styles.detailLabel}>DOB</Text>
                                        </View>
                                        <Text style={styles.detailValue}>
                                            {student.dob ? new Date(student.dob).toLocaleDateString('en-IN', {
                                                day: '2-digit', month: 'short', year: 'numeric'
                                            }) : 'N/A'}
                                        </Text>
                                    </View>
                                </View>

                                {/* Fees & Status */}
                                <View style={styles.infoSection}>
                                    <Text style={styles.sectionTitle}>Fees & Status</Text>
                                    <View style={styles.detailRow}>
                                        <View style={styles.detailLeft}>
                                            <MaterialCommunityIcons name="cash-multiple" size={16} color="#6366F1" />
                                            <Text style={styles.detailLabel}>Total Fee</Text>
                                        </View>
                                        <Text style={styles.detailValue}>₹{student.totalFee || 0}</Text>
                                    </View>
                                    <View style={styles.detailRow}>
                                        <View style={styles.detailLeft}>
                                            <MaterialCommunityIcons name="calendar-clock" size={16} color="#8B5CF6" />
                                            <Text style={styles.detailLabel}>Frequency</Text>
                                        </View>
                                        <Text style={styles.detailValue}>{student.feeFrequency || 'Monthly'}</Text>
                                    </View>
                                    <View style={styles.detailRow}>
                                        <View style={styles.detailLeft}>
                                            <MaterialCommunityIcons name="cash-register" size={16} color="#EF4444" />
                                            <Text style={styles.detailLabel}>Current Dues</Text>
                                        </View>
                                        <Text style={[styles.detailValue, { color: student.dues > 0 ? '#EF4444' : '#10B981' }]}>
                                            {student.dues ? `₹${student.dues}` : 'No Dues'}
                                        </Text>
                                    </View>
                                    <View style={[styles.detailRow, { borderBottomWidth: 0 }]}>
                                        <View style={styles.detailLeft}>
                                            <MaterialCommunityIcons name="check-circle" size={16} color={getStatusColor(student.status)} />
                                            <Text style={styles.detailLabel}>Status</Text>
                                        </View>
                                        <Text style={[styles.detailValue, { color: getStatusColor(student.status), fontWeight: '700' }]}>
                                            {student.status?.toUpperCase() || 'UNKNOWN'}
                                        </Text>
                                    </View>
                                </View>

                                {/* Medical & Emergency */}
                                <View style={styles.infoSection}>
                                    <Text style={styles.sectionTitle}>Medical & Emergency</Text>
                                    <View style={styles.detailRow}>
                                        <View style={styles.detailLeft}>
                                            <MaterialCommunityIcons name="water" size={16} color="#EF4444" />
                                            <Text style={styles.detailLabel}>Blood Group</Text>
                                        </View>
                                        <Text style={styles.detailValue}>{student.bloodGroup || 'N/A'}</Text>
                                    </View>
                                    <View style={styles.detailRow}>
                                        <View style={styles.detailLeft}>
                                            <MaterialCommunityIcons name="account-alert" size={16} color="#EC4899" />
                                            <Text style={styles.detailLabel}>Emergency Contact</Text>
                                        </View>
                                        <View style={{ flex: 1, alignItems: 'flex-end' }}>
                                            <Text style={styles.detailValue}>{student.emergencyContactName || 'N/A'}</Text>
                                            {student.emergencyContactPhone && student.emergencyContactPhone !== 'N/A' && (
                                                <Text style={[styles.detailValue, { fontSize: 12, color: colors.textSecondary }]}>{student.emergencyContactPhone}</Text>
                                            )}
                                        </View>
                                    </View>
                                    <View style={[styles.detailRow, { borderBottomWidth: 0, alignItems: 'flex-start' }]}>
                                        <View style={[styles.detailLeft, { marginTop: 2 }]}>
                                            <MaterialCommunityIcons name="medical-bag" size={16} color="#6366F1" />
                                            <Text style={styles.detailLabel}>Medical History</Text>
                                        </View>
                                        <Text style={[styles.detailValue, { flex: 1, textAlign: 'right', marginLeft: 16, lineHeight: 20 }]}>
                                            {student.medicalHistory || 'None'}
                                        </Text>
                                    </View>
                                </View>
                            </>
                        )}
                    </ScrollView>
                </View>
            </View>
        </Modal>
    );
}
