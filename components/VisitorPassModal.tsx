import { MaterialCommunityIcons } from '@expo/vector-icons';
import React from 'react';
import {
    Modal,
    Pressable,
    ScrollView,
    Share,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import { useTheme } from '../utils/ThemeContext';
import { formatDate, formatTime, Visitor } from '../utils/visitorUtils';

interface VisitorPassModalProps {
    visible: boolean;
    visitor: Visitor;
    onClose: () => void;
}

export default function VisitorPassModal({ visible, visitor, onClose }: VisitorPassModalProps) {
    const { colors, isDark } = useTheme();

    const handleShare = async () => {
        try {
            const message = `
🎫 VISITOR PASS - Smart Hostel

Visitor: ${visitor.visitor_name}
Phone: ${visitor.visitor_phone}
${visitor.visitor_relation ? `Relation: ${visitor.visitor_relation}` : ''}

Meeting: Student in Room ${visitor.room_number}
Date: ${formatDate(visitor.expected_date)}
Time: ${visitor.expected_time_in ? formatTime(visitor.expected_time_in) : 'N/A'} - ${visitor.expected_time_out ? formatTime(visitor.expected_time_out) : 'N/A'}

Purpose: ${visitor.purpose}

Status: ✅ APPROVED
Pass Code: ${visitor.qr_code}

Please show this pass at the gate.
            `.trim();

            await Share.share({
                message,
                title: 'Visitor Pass'
            });
        } catch (error) {
            console.error('Error sharing:', error);
        }
    };

    const styles = StyleSheet.create({
        overlay: {
            flex: 1,
            backgroundColor: 'rgba(0,0,0,0.7)',
            justifyContent: 'center',
            alignItems: 'center',
            padding: 24
        },
        container: {
            backgroundColor: colors.card,
            borderRadius: 24,
            width: '100%',
            maxWidth: 400,
            maxHeight: '90%',
            overflow: 'hidden'
        },
        header: {
            backgroundColor: '#004e92',
            padding: 20,
            alignItems: 'center'
        },
        headerTitle: {
            fontSize: 20,
            fontWeight: '700',
            color: '#fff',
            marginBottom: 4
        },
        headerSubtitle: {
            fontSize: 14,
            color: 'rgba(255,255,255,0.8)'
        },
        content: {
            padding: 24
        },
        qrContainer: {
            alignItems: 'center',
            padding: 24,
            backgroundColor: isDark ? '#1E293B' : '#F0F9FF',
            borderRadius: 16,
            marginBottom: 24,
            borderWidth: 2,
            borderColor: '#004e92',
            borderStyle: 'dashed'
        },
        passCode: {
            fontSize: 24,
            fontWeight: '700',
            color: '#004e92',
            letterSpacing: 2,
            fontFamily: 'monospace'
        },
        qrLabel: {
            fontSize: 12,
            color: colors.textSecondary,
            marginTop: 12,
            fontWeight: '600'
        },
        section: {
            marginBottom: 20
        },
        sectionTitle: {
            fontSize: 12,
            fontWeight: '700',
            color: colors.textSecondary,
            marginBottom: 12,
            letterSpacing: 1
        },
        infoRow: {
            flexDirection: 'row',
            marginBottom: 12
        },
        infoLabel: {
            fontSize: 14,
            color: colors.textSecondary,
            width: 100,
            fontWeight: '500'
        },
        infoValue: {
            fontSize: 14,
            color: colors.text,
            flex: 1,
            fontWeight: '600'
        },
        statusBadge: {
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 6,
            backgroundColor: '#10B981',
            paddingVertical: 12,
            paddingHorizontal: 20,
            borderRadius: 12,
            marginBottom: 20
        },
        statusText: {
            fontSize: 16,
            fontWeight: '700',
            color: '#fff'
        },
        actionsRow: {
            flexDirection: 'row',
            gap: 12,
            marginTop: 8
        },
        actionButton: {
            flex: 1,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
            paddingVertical: 14,
            borderRadius: 12,
            borderWidth: 1
        },
        shareButton: {
            backgroundColor: '#3B82F6',
            borderColor: '#3B82F6'
        },
        closeButton: {
            backgroundColor: 'transparent',
            borderColor: colors.border
        },
        actionButtonText: {
            fontSize: 14,
            fontWeight: '600'
        }
    });

    return (
        <Modal
            visible={visible}
            transparent
            animationType="fade"
            onRequestClose={onClose}
        >
            <Pressable style={styles.overlay} onPress={onClose}>
                <Pressable onPress={e => e.stopPropagation()}>
                    <View style={styles.container}>
                        {/* Header */}
                        <View style={styles.header}>
                            <MaterialCommunityIcons name="ticket-confirmation" size={32} color="#fff" />
                            <Text style={styles.headerTitle}>VISITOR PASS</Text>
                            <Text style={styles.headerSubtitle}>Smart Hostel Management</Text>
                        </View>

                        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
                            {/* Pass Code */}
                            {visitor.qr_code && (
                                <View style={styles.qrContainer}>
                                    <MaterialCommunityIcons name="ticket-confirmation-outline" size={48} color="#004e92" />
                                    <Text style={styles.passCode}>{visitor.qr_code}</Text>
                                    <Text style={styles.qrLabel}>Show this code at gate</Text>
                                </View>
                            )}

                            {/* Status */}
                            <View style={styles.statusBadge}>
                                <MaterialCommunityIcons name="check-circle" size={20} color="#fff" />
                                <Text style={styles.statusText}>✓ APPROVED</Text>
                            </View>

                            {/* Visitor Details */}
                            <View style={styles.section}>
                                <Text style={styles.sectionTitle}>VISITOR DETAILS</Text>
                                <View style={styles.infoRow}>
                                    <Text style={styles.infoLabel}>Name:</Text>
                                    <Text style={styles.infoValue}>{visitor.visitor_name}</Text>
                                </View>
                                <View style={styles.infoRow}>
                                    <Text style={styles.infoLabel}>Phone:</Text>
                                    <Text style={styles.infoValue}>{visitor.visitor_phone}</Text>
                                </View>
                                {visitor.visitor_relation && (
                                    <View style={styles.infoRow}>
                                        <Text style={styles.infoLabel}>Relation:</Text>
                                        <Text style={styles.infoValue}>{visitor.visitor_relation}</Text>
                                    </View>
                                )}
                            </View>

                            {/* Visit Details */}
                            <View style={styles.section}>
                                <Text style={styles.sectionTitle}>VISIT DETAILS</Text>
                                <View style={styles.infoRow}>
                                    <Text style={styles.infoLabel}>Room:</Text>
                                    <Text style={styles.infoValue}>{visitor.room_number}</Text>
                                </View>
                                <View style={styles.infoRow}>
                                    <Text style={styles.infoLabel}>Date:</Text>
                                    <Text style={styles.infoValue}>{formatDate(visitor.expected_date)}</Text>
                                </View>
                                <View style={styles.infoRow}>
                                    <Text style={styles.infoLabel}>Time In:</Text>
                                    <Text style={styles.infoValue}>
                                        {visitor.expected_time_in ? formatTime(visitor.expected_time_in) : 'N/A'}
                                    </Text>
                                </View>
                                <View style={styles.infoRow}>
                                    <Text style={styles.infoLabel}>Time Out:</Text>
                                    <Text style={styles.infoValue}>
                                        {visitor.expected_time_out ? formatTime(visitor.expected_time_out) : 'N/A'}
                                    </Text>
                                </View>
                                <View style={styles.infoRow}>
                                    <Text style={styles.infoLabel}>Purpose:</Text>
                                    <Text style={styles.infoValue}>{visitor.purpose}</Text>
                                </View>
                            </View>

                            {/* Actions */}
                            <View style={styles.actionsRow}>
                                <TouchableOpacity
                                    style={[styles.actionButton, styles.shareButton]}
                                    onPress={handleShare}
                                >
                                    <MaterialCommunityIcons name="share-variant" size={18} color="#fff" />
                                    <Text style={[styles.actionButtonText, { color: '#fff' }]}>Share</Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={[styles.actionButton, styles.closeButton]}
                                    onPress={onClose}
                                >
                                    <MaterialCommunityIcons name="close" size={18} color={colors.text} />
                                    <Text style={[styles.actionButtonText, { color: colors.text }]}>Close</Text>
                                </TouchableOpacity>
                            </View>
                        </ScrollView>
                    </View>
                </Pressable>
            </Pressable>
        </Modal>
    );
}
