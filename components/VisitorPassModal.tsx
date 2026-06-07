import { MaterialCommunityIcons } from '@expo/vector-icons';
import React from 'react';
import { Modal, Pressable, ScrollView, Share, StyleSheet, TouchableOpacity, View } from 'react-native';
import { formatDate, formatTime, Visitor } from '../utils/visitorUtils';
import AppText from './AppText';

interface VisitorPassModalProps {
    visible: boolean;
    visitor: Visitor;
    onClose: () => void;
}

export default function VisitorPassModal({ visible, visitor, onClose }: VisitorPassModalProps) {

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

    return (
        <Modal
            visible={visible}
            transparent
            animationType="fade"
            onRequestClose={onClose}
        >
            <Pressable style={styles.overlay} onPress={onClose}>
                <Pressable onPress={e => e.stopPropagation()} style={{ width: '100%' }}>
                    <View style={styles.container}>
                        <View style={styles.header}>
                            <AppText style={styles.headerTitle}>VISITOR PASS</AppText>
                        </View>

                        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
                            {visitor.qr_code && (
                                <View style={styles.qrContainer}>
                                    <AppText style={styles.passCode}>{visitor.qr_code}</AppText>
                                    <AppText style={styles.qrLabel}>SHOW AT GATE</AppText>
                                </View>
                            )}

                            <View style={styles.statusBadge}>
                                <AppText style={styles.statusText}>APPROVED</AppText>
                            </View>

                            <View style={styles.section}>
                                <AppText style={styles.sectionTitle}>VISITOR DETAILS</AppText>
                                <View style={styles.infoRow}>
                                    <AppText style={styles.infoLabel}>Name:</AppText>
                                    <AppText style={styles.infoValue}>{visitor.visitor_name}</AppText>
                                </View>
                                <View style={styles.infoRow}>
                                    <AppText style={styles.infoLabel}>Phone:</AppText>
                                    <AppText style={styles.infoValue}>{visitor.visitor_phone}</AppText>
                                </View>
                                {visitor.visitor_relation ? (
                                    <View style={styles.infoRow}>
                                        <AppText style={styles.infoLabel}>Relation:</AppText>
                                        <AppText style={styles.infoValue}>{visitor.visitor_relation}</AppText>
                                    </View>
                                ) : null}
                            </View>

                            <View style={styles.section}>
                                <AppText style={styles.sectionTitle}>VISIT DETAILS</AppText>
                                <View style={styles.infoRow}>
                                    <AppText style={styles.infoLabel}>Room:</AppText>
                                    <AppText style={styles.infoValue}>{visitor.room_number}</AppText>
                                </View>
                                <View style={styles.infoRow}>
                                    <AppText style={styles.infoLabel}>Date:</AppText>
                                    <AppText style={styles.infoValue}>{formatDate(visitor.expected_date)}</AppText>
                                </View>
                                <View style={styles.infoRow}>
                                    <AppText style={styles.infoLabel}>Time In:</AppText>
                                    <AppText style={styles.infoValue}>
                                        {visitor.expected_time_in ? formatTime(visitor.expected_time_in) : 'N/A'}
                                    </AppText>
                                </View>
                                <View style={styles.infoRow}>
                                    <AppText style={styles.infoLabel}>Time Out:</AppText>
                                    <AppText style={styles.infoValue}>
                                        {visitor.expected_time_out ? formatTime(visitor.expected_time_out) : 'N/A'}
                                    </AppText>
                                </View>
                                <View style={styles.infoRow}>
                                    <AppText style={styles.infoLabel}>Purpose:</AppText>
                                    <AppText style={styles.infoValue}>{visitor.purpose}</AppText>
                                </View>
                            </View>

                            <View style={styles.actionsRow}>
                                <TouchableOpacity style={[styles.actionButton, styles.shareButton]} onPress={handleShare}>
                                    <AppText style={styles.shareText}>SHARE</AppText>
                                </TouchableOpacity>
                                <TouchableOpacity style={[styles.actionButton, styles.closeButton]} onPress={onClose}>
                                    <AppText style={styles.closeText}>CLOSE</AppText>
                                </TouchableOpacity>
                            </View>
                        </ScrollView>
                    </View>
                </Pressable>
            </Pressable>
        </Modal>
    );
}

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.8)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 24
    },
    container: {
        backgroundColor: '#111111',
        borderRadius: 24,
        width: '100%',
        maxWidth: 400,
        maxHeight: '90%',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
        overflow: 'hidden'
    },
    header: {
        padding: 24,
        paddingBottom: 0,
        alignItems: 'center'
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: '800',
        color: '#FFFFFF',
        letterSpacing: 1.5
    },
    content: {
        padding: 24
    },
    qrContainer: {
        alignItems: 'center',
        padding: 24,
        backgroundColor: 'rgba(255,255,255,0.05)',
        borderRadius: 16,
        marginBottom: 24,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
    },
    passCode: {
        fontSize: 28,
        fontWeight: '800',
        color: '#FFFFFF',
        letterSpacing: 4,
        fontFamily: 'monospace'
    },
    qrLabel: {
        fontSize: 11,
        color: '#888888',
        marginTop: 12,
        fontWeight: '700',
        letterSpacing: 1.5
    },
    statusBadge: {
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#FFFFFF',
        paddingVertical: 12,
        borderRadius: 12,
        marginBottom: 32
    },
    statusText: {
        fontSize: 14,
        fontWeight: '800',
        color: '#000000',
        letterSpacing: 1
    },
    section: {
        marginBottom: 24
    },
    sectionTitle: {
        fontSize: 11,
        fontWeight: '700',
        color: '#666666',
        marginBottom: 16,
        letterSpacing: 1.5
    },
    infoRow: {
        flexDirection: 'row',
        marginBottom: 12
    },
    infoLabel: {
        fontSize: 13,
        color: '#888888',
        width: 100,
        fontWeight: '600'
    },
    infoValue: {
        fontSize: 13,
        color: '#FFFFFF',
        flex: 1,
        fontWeight: '600'
    },
    actionsRow: {
        flexDirection: 'row',
        gap: 12,
        marginTop: 16
    },
    actionButton: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 16,
        borderRadius: 100,
        borderWidth: 1
    },
    shareButton: {
        backgroundColor: '#FFFFFF',
        borderColor: '#FFFFFF'
    },
    closeButton: {
        backgroundColor: 'transparent',
        borderColor: 'rgba(255,255,255,0.2)'
    },
    shareText: {
        fontSize: 14,
        fontWeight: '800',
        color: '#000000',
        letterSpacing: 1
    },
    closeText: {
        fontSize: 14,
        fontWeight: '800',
        color: '#FFFFFF',
        letterSpacing: 1
    }
});
