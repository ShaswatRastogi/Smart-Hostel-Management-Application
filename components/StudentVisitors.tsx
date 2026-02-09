import { MaterialCommunityIcons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { useTheme } from '../utils/ThemeContext';
import { formatDate, getStatusColor, getStatusLabel, getVisitorsByStudentEmail, Visitor } from '../utils/visitorUtils';

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
                <Text style={{ fontSize: 14, fontWeight: '700', color: colors.text }}>
                    Recent Visitors ({visitors.length})
                </Text>
            </View>

            {visitors.length === 0 ? (
                <Text style={styles.emptyText}>No visitor requests yet</Text>
            ) : (
                visitors.map((visitor) => (
                    <View key={visitor.id} style={styles.visitorCard}>
                        <View style={styles.visitorHeader}>
                            <Text style={styles.visitorName}>{visitor.visitor_name}</Text>
                            <View style={[styles.statusBadge, { backgroundColor: getStatusColor(visitor.status) + '20' }]}>
                                <Text style={[styles.statusText, { color: getStatusColor(visitor.status) }]}>
                                    {getStatusLabel(visitor.status)}
                                </Text>
                            </View>
                        </View>
                        <Text style={styles.visitorDetail}>📞 {visitor.visitor_phone}</Text>
                        <Text style={styles.visitorDetail}>📅 {formatDate(visitor.expected_date)}</Text>
                        <Text style={styles.visitorDetail} numberOfLines={1}>💬 {visitor.purpose}</Text>
                    </View>
                ))
            )}
        </View>
    );
}
