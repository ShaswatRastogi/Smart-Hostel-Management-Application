import { MaterialCommunityIcons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { useTheme } from '../utils/ThemeContext';
import { formatDate, getStatusColor, getStatusLabel, getVisitorsByStudentEmail, Visitor } from '../utils/visitorUtils';
import AppText from './AppText';

interface StudentVisitorsProps {
    studentEmail: string;
}

export default function StudentVisitors({ studentEmail }: StudentVisitorsProps) {
    const { colors } = useTheme();
    const [visitors, setVisitors] = useState<Visitor[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadVisitors();
    }, [studentEmail]);

    async function loadVisitors() {
        try {
            setLoading(true);
            const data = await getVisitorsByStudentEmail(studentEmail);
            // Show only recent 5 visitors
            setVisitors(data.slice(0, 5));
        } catch (error) {
            console.error('Error loading visitors:', error);
        } finally {
            setLoading(false);
        }
    }

    const styles = StyleSheet.create({
        container: {
            marginTop: 16
        },
        sectionTitle: {
            fontSize: 14,
            fontWeight: '700',
            color: colors.text,
            marginBottom: 12,
            flexDirection: 'row',
            alignItems: 'center',
            gap: 8
        },
        visitorCard: {
            backgroundColor: colors.background,
            borderRadius: 12,
            padding: 12,
            marginBottom: 8,
            borderWidth: 1,
            borderColor: colors.border
        },
        visitorHeader: {
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 6
        },
        visitorName: {
            fontSize: 14,
            fontWeight: '600',
            color: colors.text
        },
        statusBadge: {
            paddingHorizontal: 8,
            paddingVertical: 4,
            borderRadius: 8
        },
        statusText: {
            fontSize: 10,
            fontWeight: '700'
        },
        visitorDetail: {
            fontSize: 12,
            color: colors.textSecondary,
            marginTop: 2
        },
        emptyText: {
            fontSize: 13,
            color: colors.textSecondary,
            textAlign: 'center',
            paddingVertical: 16,
            fontStyle: 'italic'
        },
        loadingContainer: {
            paddingVertical: 20,
            alignItems: 'center'
        }
    });

    if (loading) {
        return (
            <View style={styles.container}>
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="small" color={colors.primary} />
                </View>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                <MaterialCommunityIcons name="account-group" size={18} color={colors.text} />
                <AppText style={{ fontSize: 14, fontWeight: '700', color: colors.text }}>
                    Recent Visitors ({visitors.length})
                </AppText>
            </View>

            {visitors.length === 0 ? (
                <AppText style={styles.emptyText}>No visitor requests yet</AppText>
            ) : (
                visitors.map((visitor) => (
                    <View key={visitor.id} style={styles.visitorCard}>
                        <View style={styles.visitorHeader}>
                            <AppText style={styles.visitorName}>{visitor.visitor_name}</AppText>
                            <View style={[styles.statusBadge, { backgroundColor: getStatusColor(visitor.status) + '20' }]}>
                                <AppText style={[styles.statusText, { color: getStatusColor(visitor.status) }]}>
                                    {getStatusLabel(visitor.status)}
                                </AppText>
                            </View>
                        </View>
                        <AppText style={styles.visitorDetail}>📞 {visitor.visitor_phone}</AppText>
                        <AppText style={styles.visitorDetail}>📅 {formatDate(visitor.expected_date)}</AppText>
                        <AppText style={styles.visitorDetail} numberOfLines={1}>💬 {visitor.purpose}</AppText>
                    </View>
                ))
            )}
        </View>
    );
}
