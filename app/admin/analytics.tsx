import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Dimensions, RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { BarChart, LineChart, PieChart } from 'react-native-chart-kit';
import PagerView from 'react-native-pager-view';
import api from '../../utils/api';
import { useTheme } from '../../utils/ThemeContext';

const { width } = Dimensions.get('window');

// Modern metric card with trend
const MetricCard = ({ icon, value, label, trend, colors, isDark }: any) => {
    const trendStr = typeof trend === 'string' ? trend : '';
    const isPositive = trendStr.startsWith('+');
    const isNegative = trendStr.startsWith('-');
    const trendColor = isPositive ? '#10B981' : isNegative ? '#EF4444' : '#9CA3AF';
    const trendBg = isPositive ? '#10B98120' : isNegative ? '#EF444420' : '#E5E7EB20';
    const trendIcon = isPositive ? 'trending-up' : isNegative ? 'trending-down' : 'minus';

    return (
        <View style={[styles.metricCard, { backgroundColor: isDark ? '#1F2937' : '#FFFFFF' }]}>
            <View style={styles.metricHeader}>
                <View style={[styles.metricIconBg, { backgroundColor: colors[0] + '20' }]}>
                    <MaterialCommunityIcons name={icon} size={24} color={colors[0]} />
                </View>
                {trendStr && trendStr !== '0%' && (
                    <View style={[styles.trendBadge, { backgroundColor: trendBg }]}>
                        <MaterialCommunityIcons name={trendIcon} size={14} color={trendColor} />
                        <Text style={[styles.trendText, { color: trendColor }]}>{trendStr}</Text>
                    </View>
                )}
            </View>
            <Text style={[styles.metricValue, { color: isDark ? '#F3F4F6' : '#111827' }]}>{value}</Text>
            <Text style={[styles.metricLabel, { color: isDark ? '#9CA3AF' : '#6B7280' }]}>{label}</Text>
        </View>
    );
};

// Section header component
const SectionHeader = ({ title, icon, isDark }: any) => (
    <View style={styles.sectionHeader}>
        <MaterialCommunityIcons
            name={icon}
            size={20}
            color={isDark ? '#60A5FA' : '#3B82F6'}
        />
        <Text style={[styles.sectionTitle, { color: isDark ? '#F3F4F6' : '#111827' }]}>
            {title}
        </Text>
    </View>
);

// Info row component for data tables
const InfoRow = ({ label, value, isDark }: any) => (
    <View style={styles.infoRow}>
        <Text style={[styles.infoLabel, { color: isDark ? '#9CA3AF' : '#6B7280' }]}>{label}</Text>
        <Text style={[styles.infoValue, { color: isDark ? '#F3F4F6' : '#111827' }]}>{value}</Text>
    </View>
);

export default function Analytics() {
    const router = useRouter();
    const { colors, isDark } = useTheme();
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [selectedTab, setSelectedTab] = useState<'overview' | 'payments' | 'complaints' | 'attendance'>('overview');
    const [selectedPeriod, setSelectedPeriod] = useState('30');

    // Data states
    const [overviewStats, setOverviewStats] = useState<any>(null);
    const [paymentData, setPaymentData] = useState<any>(null);
    const [complaintData, setComplaintData] = useState<any>(null);
    const [attendanceData, setAttendanceData] = useState<any>(null);
    const [roomOccupancy, setRoomOccupancy] = useState<any[]>([]);
    const [recentActivity, setRecentActivity] = useState<any[]>([]);
    const pagerRef = useRef<PagerView>(null);

    const tabs = [
        { key: 'overview', label: 'Overview', icon: 'view-dashboard-outline' },
        { key: 'payments', label: 'Payments', icon: 'cash' },
        { key: 'complaints', label: 'Issues', icon: 'alert-circle-outline' },
        { key: 'attendance', label: 'Attendance', icon: 'clipboard-check-outline' },
    ];

    const loadAnalytics = async () => {
        try {
            const [overview, occupancy, activity] = await Promise.all([
                api.get('/analytics/overview'),
                api.get('/analytics/rooms/occupancy'),
                api.get('/analytics/activity/recent'),
            ]);

            setOverviewStats(overview.data);
            setRoomOccupancy(occupancy.data);
            setRecentActivity(activity.data);

            if (selectedTab !== 'overview') {
                await loadDetailedData();
            }
        } catch (error) {
            console.error('Error loading analytics:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const loadDetailedData = async () => {
        try {
            const [payments, complaints, attendance] = await Promise.all([
                api.get(`/analytics/payments/detailed?period=${selectedPeriod}`),
                api.get(`/analytics/complaints/detailed?period=${selectedPeriod}`),
                api.get(`/analytics/attendance/detailed?period=${selectedPeriod}`),
            ]);

            setPaymentData(payments.data);
            setComplaintData(complaints.data);
            setAttendanceData(attendance.data);
        } catch (error) {
            console.error('Error loading detailed data:', error);
        }
    };

    useEffect(() => {
        loadAnalytics();
    }, [selectedPeriod]);

    useEffect(() => {
        if (selectedTab !== 'overview' && !loading) {
            loadDetailedData();
        }
    }, [selectedTab]);

    const onRefresh = () => {
        setRefreshing(true);
        loadAnalytics();
    };

    if (loading) {
        return (
            <View style={[styles.container, { backgroundColor: colors.background }]}>
                <LinearGradient
                    colors={['#000428', '#004e92']}
                    style={styles.modernHeader}
                >
                    <TouchableOpacity onPress={() => router.back()} style={styles.headerButton}>
                        <MaterialCommunityIcons name="arrow-left" size={24} color="#FFFFFF" />
                    </TouchableOpacity>
                    <Text style={[styles.modernHeaderTitle, { color: '#FFFFFF' }]}>Analytics</Text>
                    <View style={styles.headerButton} />
                </LinearGradient>
                <ActivityIndicator size="large" color="#3B82F6" style={{ marginTop: 100 }} />
            </View>
        );
    }

    const chartConfig = {
        backgroundColor: 'transparent',
        backgroundGradientFrom: isDark ? '#1F2937' : '#F9FAFB',
        backgroundGradientTo: isDark ? '#1F2937' : '#F9FAFB',
        decimalPlaces: 0,
        color: (opacity = 1) => `rgba(59, 130, 246, ${opacity})`,
        labelColor: (opacity = 1) => isDark ? `rgba(156, 163, 175, ${opacity})` : `rgba(107, 114, 128, ${opacity})`,
        style: { borderRadius: 16 },
        propsForDots: {
            r: '4',
            strokeWidth: '2',
            stroke: '#3B82F6',
        },
        propsForBackgroundLines: {
            strokeDasharray: '',
            stroke: isDark ? '#374151' : '#E5E7EB',
            strokeWidth: 1,
        },
    };

    return (
        <View style={[styles.container, { backgroundColor: isDark ? '#111827' : '#F3F4F6' }]}>
            {/* Modern Gradient Header */}
            <LinearGradient
                colors={['#000428', '#004e92']}
                style={styles.modernHeader}
            >
                <TouchableOpacity onPress={() => router.back()} style={styles.headerButton}>
                    <MaterialCommunityIcons name="arrow-left" size={24} color="#FFFFFF" />
                </TouchableOpacity>
                <Text style={[styles.modernHeaderTitle, { color: '#FFFFFF' }]}>Analytics Dashboard</Text>
                <TouchableOpacity onPress={onRefresh} style={styles.headerButton}>
                    <MaterialCommunityIcons name="refresh" size={24} color="#FFFFFF" />
                </TouchableOpacity>
            </LinearGradient>

            {/* Period Filter Pills */}
            <View style={[styles.filterContainer, { backgroundColor: isDark ? '#1F2937' : '#FFFFFF' }]}>
                {[
                    { label: '7 Days', value: '7' },
                    { label: '30 Days', value: '30' },
                    { label: '90 Days', value: '90' },
                ].map((period) => (
                    <TouchableOpacity
                        key={period.value}
                        style={[
                            styles.filterPill,
                            selectedPeriod === period.value && styles.filterPillActive,
                            { borderColor: isDark ? '#374151' : '#E5E7EB' }
                        ]}
                        onPress={() => setSelectedPeriod(period.value)}
                    >
                        <Text style={[
                            styles.filterText,
                            { color: selectedPeriod === period.value ? '#FFFFFF' : (isDark ? '#9CA3AF' : '#6B7280') }
                        ]}>
                            {period.label}
                        </Text>
                    </TouchableOpacity>
                ))}
            </View>

            {/* Tab Bar (Pill style like Manage Complaints) */}
            <View style={styles.modernTabBar}>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabScrollContent}>
                    {tabs.map((tab, index) => (
                        <TouchableOpacity
                            key={tab.key}
                            style={[
                                styles.modernTab,
                                { backgroundColor: selectedTab === tab.key ? '#3B82F6' : (isDark ? '#1F2937' : '#FFFFFF') },
                                { borderColor: selectedTab === tab.key ? '#3B82F6' : (isDark ? '#374151' : '#E5E7EB') }
                            ]}
                            onPress={() => {
                                setSelectedTab(tab.key as any);
                                pagerRef.current?.setPage(index);
                            }}
                        >
                            <MaterialCommunityIcons
                                name={tab.icon as any}
                                size={18}
                                color={selectedTab === tab.key ? '#FFFFFF' : (isDark ? '#9CA3AF' : '#6B7280')}
                            />
                            <Text style={[
                                styles.modernTabText,
                                { color: selectedTab === tab.key ? '#FFFFFF' : (isDark ? '#9CA3AF' : '#6B7280') }
                            ]}>
                                {tab.label}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </ScrollView>
            </View>

            <PagerView
                style={styles.pagerView}
                initialPage={0}
                ref={pagerRef}
                onPageSelected={(e) => {
                    const index = e.nativeEvent.position;
                    setSelectedTab(tabs[index].key as any);
                }}
            >
                <View key="1">
                    <ScrollView
                        style={styles.scrollView}
                        contentContainerStyle={styles.modernScrollContent}
                        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#3B82F6']} tintColor="#3B82F6" />}
                    >
                        <OverviewTab stats={overviewStats} roomOccupancy={roomOccupancy} recentActivity={recentActivity} isDark={isDark} chartConfig={chartConfig} colors={colors} />
                    </ScrollView>
                </View>
                <View key="2">
                    <ScrollView
                        style={styles.scrollView}
                        contentContainerStyle={styles.modernScrollContent}
                        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#3B82F6']} tintColor="#3B82F6" />}
                    >
                        {paymentData && <PaymentsTab data={paymentData} isDark={isDark} chartConfig={chartConfig} colors={colors} />}
                    </ScrollView>
                </View>
                <View key="3">
                    <ScrollView
                        style={styles.scrollView}
                        contentContainerStyle={styles.modernScrollContent}
                        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#3B82F6']} tintColor="#3B82F6" />}
                    >
                        {complaintData && <ComplaintsTab data={complaintData} isDark={isDark} chartConfig={chartConfig} colors={colors} />}
                    </ScrollView>
                </View>
                <View key="4">
                    <ScrollView
                        style={styles.scrollView}
                        contentContainerStyle={styles.modernScrollContent}
                        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#3B82F6']} tintColor="#3B82F6" />}
                    >
                        {attendanceData && <AttendanceTab data={attendanceData} isDark={isDark} chartConfig={chartConfig} colors={colors} />}
                    </ScrollView>
                </View>
            </PagerView>
        </View>
    );
}

// ========================
// OVERVIEW TAB
// ========================
function OverviewTab({ stats, roomOccupancy, recentActivity, isDark, chartConfig, colors }: any) {
    const pieData = roomOccupancy.map((item: any) => ({
        name: item.status,
        count: parseInt(item.count),
        color: item.status === 'Occupied' ? '#10B981' : '#F59E0B',
        legendFontColor: isDark ? '#9CA3AF' : '#6B7280',
        legendFontSize: 12,
    }));

    const hasData = pieData.length > 0 && pieData.some((d: any) => d.count > 0);

    return (
        <View>
            {/* Key Metrics Grid */}
            <View style={styles.metricsGrid}>
                <MetricCard
                    icon="account-group"
                    value={stats?.totalStudents || 0}
                    label="Total Students"
                    trend={stats?.studentGrowth}
                    colors={['#3B82F6', '#2563EB']}
                    isDark={isDark}
                />
                <MetricCard
                    icon="home-variant"
                    value={`${stats?.occupancyRate || 0}%`}
                    label="Occupancy Rate"
                    colors={['#10B981', '#059669']}
                    isDark={isDark}
                />
                <MetricCard
                    icon="alert-circle"
                    value={stats?.pendingComplaints || 0}
                    label="Pending Issues"
                    trend={stats?.complaintGrowth}
                    colors={['#EF4444', '#DC2626']}
                    isDark={isDark}
                />
                <MetricCard
                    icon="calendar-clock"
                    value={stats?.activeLeaveRequests || 0}
                    label="Active Leaves"
                    colors={['#F59E0B', '#D97706']}
                    isDark={isDark}
                />
            </View>

            {/* Room Distribution */}
            {hasData && (
                <View style={[styles.chartSection, { backgroundColor: isDark ? '#1F2937' : '#FFFFFF' }]}>
                    <SectionHeader title="Room Distribution" icon="door" isDark={isDark} />
                    <PieChart
                        data={pieData}
                        width={width - 84}
                        height={200}
                        chartConfig={chartConfig}
                        accessor="count"
                        backgroundColor="transparent"
                        paddingLeft="15"
                        absolute
                    />
                    <View style={styles.statsRow}>
                        <View style={styles.statItem}>
                            <Text style={[styles.statItemValue, { color: isDark ? '#F3F4F6' : '#111827' }]}>
                                {roomOccupancy.find((r: any) => r.status === 'Occupied')?.count || 0}
                            </Text>
                            <Text style={[styles.statItemLabel, { color: isDark ? '#9CA3AF' : '#6B7280' }]}>Occupied</Text>
                        </View>
                        <View style={styles.statItem}>
                            <Text style={[styles.statItemValue, { color: isDark ? '#F3F4F6' : '#111827' }]}>
                                {roomOccupancy.find((r: any) => r.status === 'Vacant')?.count || 0}
                            </Text>
                            <Text style={[styles.statItemLabel, { color: isDark ? '#9CA3AF' : '#6B7280' }]}>Available</Text>
                        </View>
                    </View>
                </View>
            )}
        </View>
    );
}

// ========================
// PAYMENTS TAB
// ========================
function PaymentsTab({ data, isDark, chartConfig, colors }: any) {
    const revenueTrendData = {
        labels: data.revenueTrend?.slice(-6).map((item: any) => item.month) || [],
        datasets: [{ data: data.revenueTrend?.slice(-6).map((item: any) => parseFloat(item.revenue)) || [0] }]
    };

    const statusPieData = data.statusBreakdown?.map((item: any) => ({
        name: item.status,
        count: parseInt(item.count),
        color: item.status === 'paid' ? '#10B981' : item.status === 'pending' ? '#F59E0B' : '#EF4444',
        legendFontColor: isDark ? '#9CA3AF' : '#6B7280',
        legendFontSize: 12,
    })) || [];

    return (
        <View>
            {/* Financial Metrics */}
            <View style={styles.metricsGrid}>
                <MetricCard
                    icon="currency-inr"
                    value={`₹${(data.totalRevenue / 1000).toFixed(1)}K`}
                    label="Total Revenue"
                    trend={data.revenueGrowth}
                    colors={['#10B981', '#059669']}
                    isDark={isDark}
                />
                <MetricCard
                    icon="cash-remove"
                    value={`₹${(data.outstandingDues / 1000).toFixed(1)}K`}
                    label="Outstanding"
                    colors={['#EF4444', '#DC2626']}
                    isDark={isDark}
                />
                <MetricCard
                    icon="percent"
                    value={`${data.collectionRate}%`}
                    label="Collection Rate"
                    trend={data.collectionGrowth}
                    colors={['#3B82F6', '#2563EB']}
                    isDark={isDark}
                />
                <MetricCard
                    icon="account-cash"
                    value={data.topDefaulters?.length || 0}
                    label="Defaulters"
                    colors={['#8B5CF6', '#7C3AED']}
                    isDark={isDark}
                />
            </View>

            {/* Revenue Trend */}
            {revenueTrendData.labels.length > 0 && (
                <View style={[styles.chartSection, { backgroundColor: isDark ? '#1F2937' : '#FFFFFF' }]}>
                    <SectionHeader title="Revenue Trend (6 Months)" icon="chart-line" isDark={isDark} />
                    <LineChart
                        data={revenueTrendData}
                        width={width - 84}
                        height={200}
                        chartConfig={chartConfig}
                        bezier
                        style={{ marginTop: 10 }}
                    />
                </View>
            )}

            {/* Payment Status */}
            {statusPieData.length > 0 && (
                <View style={[styles.chartSection, { backgroundColor: isDark ? '#1F2937' : '#FFFFFF' }]}>
                    <SectionHeader title="Payment Status" icon="cash-check" isDark={isDark} />
                    <PieChart
                        data={statusPieData}
                        width={width - 84}
                        height={180}
                        chartConfig={chartConfig}
                        accessor="count"
                        backgroundColor="transparent"
                        paddingLeft="15"
                        absolute
                    />
                </View>
            )}

            {/* Top Defaulters */}
            {data.topDefaulters && data.topDefaulters.length > 0 && (
                <View style={[styles.dataTable, { backgroundColor: isDark ? '#1F2937' : '#FFFFFF' }]}>
                    <SectionHeader title="Top Defaulters" icon="alert" isDark={isDark} />
                    {data.topDefaulters.slice(0, 5).map((item: any, index: number) => (
                        <InfoRow
                            key={index}
                            label={`${item.full_name} (${item.roll_no})`}
                            value={`₹${parseFloat(item.dues).toFixed(0)}`}
                            isDark={isDark}
                        />
                    ))}
                </View>
            )}
        </View>
    );
}

// ========================
// COMPLAINTS TAB
// ========================
function ComplaintsTab({ data, isDark, chartConfig, colors }: any) {
    const categoryData = {
        labels: data.categoryBreakdown?.slice(0, 5).map((item: any) => item.category.substring(0, 8)) || [],
        datasets: [{ data: data.categoryBreakdown?.slice(0, 5).map((item: any) => parseInt(item.count)) || [0] }]
    };

    const statusPieData = data.statusBreakdown?.map((item: any) => ({
        name: item.status,
        count: parseInt(item.count),
        color: item.status === 'resolved' ? '#10B981' : item.status === 'in-progress' ? '#F59E0B' : '#EF4444',
        legendFontColor: isDark ? '#9CA3AF' : '#6B7280',
        legendFontSize: 12,
    })) || [];

    return (
        <View>
            {/* Complaint Metrics */}
            <View style={styles.metricsGrid}>
                <MetricCard
                    icon="alert-circle"
                    value={data.totalComplaints}
                    label="Total Issues"
                    trend={data.totalGrowth}
                    colors={['#EF4444', '#DC2626']}
                    isDark={isDark}
                />
                <MetricCard
                    icon="check-circle"
                    value={`${data.resolutionRate}%`}
                    label="Resolution Rate"
                    trend={data.resolutionGrowth}
                    colors={['#10B981', '#059669']}
                    isDark={isDark}
                />
                <MetricCard
                    icon="clock-fast"
                    value={`${data.avgResolutionTime}h`}
                    label="Avg Resolution"
                    trend={data.timeGrowth}
                    colors={['#3B82F6', '#2563EB']}
                    isDark={isDark}
                />
                <MetricCard
                    icon="format-list-bulleted"
                    value={data.categoryBreakdown?.length || 0}
                    label="Categories"
                    colors={['#F59E0B', '#D97706']}
                    isDark={isDark}
                />
            </View>

            {/* Category Breakdown */}
            {categoryData.labels.length > 0 && (
                <View style={[styles.chartSection, { backgroundColor: isDark ? '#1F2937' : '#FFFFFF' }]}>
                    <SectionHeader title="Top 5 Categories" icon="tag-multiple" isDark={isDark} />
                    <BarChart
                        data={categoryData}
                        width={width - 84}
                        height={200}
                        chartConfig={chartConfig}
                        yAxisLabel=""
                        yAxisSuffix=""
                        style={{ marginTop: 10 }}
                    />
                </View>
            )}

            {/* Status Distribution */}
            {statusPieData.length > 0 && (
                <View style={[styles.chartSection, { backgroundColor: isDark ? '#1F2937' : '#FFFFFF' }]}>
                    <SectionHeader title="Status Distribution" icon="chart-donut" isDark={isDark} />
                    <PieChart
                        data={statusPieData}
                        width={width - 84}
                        height={180}
                        chartConfig={chartConfig}
                        accessor="count"
                        backgroundColor="transparent"
                        paddingLeft="15"
                        absolute
                    />
                </View>
            )}

            {/* Category Details */}
            {data.categoryBreakdown && data.categoryBreakdown.length > 0 && (
                <View style={[styles.dataTable, { backgroundColor: isDark ? '#1F2937' : '#FFFFFF' }]}>
                    <SectionHeader title="All Categories" icon="format-list-checks" isDark={isDark} />
                    {data.categoryBreakdown.map((item: any, index: number) => (
                        <InfoRow
                            key={index}
                            label={item.category}
                            value={`${item.count} issues`}
                            isDark={isDark}
                        />
                    ))}
                </View>
            )}
        </View>
    );
}

// ========================
// ATTENDANCE TAB
// ========================
function AttendanceTab({ data, isDark, chartConfig, colors }: any) {
    const trendData = {
        labels: data.dailyTrend?.slice(-7).map((item: any) => new Date(item.date).getDate().toString()) || [],
        datasets: [{ data: data.dailyTrend?.slice(-7).map((item: any) => item.rate) || [0] }]
    };

    return (
        <View>
            {/* Attendance Metrics */}
            <View style={styles.metricsGrid}>
                <MetricCard
                    icon="account-check"
                    value={data.todayPresent}
                    label="Present Today"
                    trend={data.attendanceGrowth}
                    colors={['#10B981', '#059669']}
                    isDark={isDark}
                />
                <MetricCard
                    icon="percent"
                    value={`${data.todayRate}%`}
                    label="Today's Rate"
                    colors={['#3B82F6', '#2563EB']}
                    isDark={isDark}
                />
                <MetricCard
                    icon="chart-line"
                    value={`${data.weeklyAvgRate}%`}
                    label="Weekly Average"
                    trend={data.weeklyGrowth}
                    colors={['#8B5CF6', '#7C3AED']}
                    isDark={isDark}
                />
                <MetricCard
                    icon="account-remove"
                    value={data.todayTotal - data.todayPresent}
                    label="Absent Today"
                    colors={['#EF4444', '#DC2626']}
                    isDark={isDark}
                />
            </View>

            {/* Attendance Trend */}
            {trendData.labels.length > 0 && (
                <View style={[styles.chartSection, { backgroundColor: isDark ? '#1F2937' : '#FFFFFF' }]}>
                    <SectionHeader title="7-Day Attendance Trend" icon="chart-areaspline" isDark={isDark} />
                    <LineChart
                        data={trendData}
                        width={width - 84}
                        height={200}
                        chartConfig={chartConfig}
                        bezier
                        style={{ marginTop: 10 }}
                        yAxisSuffix="%"
                    />
                </View>
            )}

            {/* Daily Breakdown */}
            {data.dailyTrend && data.dailyTrend.length > 0 && (
                <View style={[styles.dataTable, { backgroundColor: isDark ? '#1F2937' : '#FFFFFF' }]}>
                    <SectionHeader title="Daily Breakdown" icon="calendar-range" isDark={isDark} />
                    {data.dailyTrend.slice(-7).reverse().map((item: any, index: number) => (
                        <InfoRow
                            key={index}
                            label={new Date(item.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                            value={`${item.present}/${item.total} (${item.rate}%)`}
                            isDark={isDark}
                        />
                    ))}
                </View>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },

    // Modern Header
    modernHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingTop: 50,
        paddingBottom: 16,
        borderBottomWidth: 1,
        marginBottom: 2,
    },
    headerButton: {
        width: 40,
        height: 40,
        justifyContent: 'center',
        alignItems: 'center',
    },
    modernHeaderTitle: {
        fontSize: 20,
        fontWeight: '700',
        letterSpacing: -0.5,
    },

    // Filter Pills
    filterContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        paddingHorizontal: 20,
        paddingVertical: 16,
        gap: 10,
        marginBottom: 2,
    },
    filterPill: {
        paddingVertical: 10,
        paddingHorizontal: 18,
        borderRadius: 20,
        borderWidth: 1.5,
    },
    filterPillActive: {
        backgroundColor: '#3B82F6',
        borderColor: '#3B82F6',
    },
    filterText: {
        fontSize: 13,
        fontWeight: '600',
    },

    // Modern Tab Bar
    modernTabBar: {
        paddingVertical: 8,
        marginBottom: 2,
    },
    tabScrollContent: {
        paddingHorizontal: 12,
        gap: 6,
    },
    modernTab: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 6,
        paddingHorizontal: 10,
        borderRadius: 16,
        borderWidth: 1,
        gap: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.03,
        shadowRadius: 1,
        elevation: 1,
    },
    modernTabText: {
        fontSize: 11,
        fontWeight: '700',
    },

    // Pager View
    pagerView: { flex: 1 },
    scrollView: { flex: 1 },
    modernScrollContent: {
        padding: 20,
        paddingTop: 10,
        paddingBottom: 40,
    },

    // Metrics Grid
    metricsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 14,
        marginBottom: 24,
    },
    metricCard: {
        flex: 1,
        minWidth: (width - 54) / 2,
        padding: 18,
        borderRadius: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 8,
        elevation: 2,
    },
    metricHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 14,
    },
    metricIconBg: {
        width: 44,
        height: 44,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
    },
    trendBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12,
        gap: 4,
    },
    trendText: {
        fontSize: 11,
        fontWeight: '700',
    },
    metricValue: {
        fontSize: 28,
        fontWeight: '800',
        marginBottom: 6,
        letterSpacing: -1,
    },
    metricLabel: {
        fontSize: 12,
        fontWeight: '600',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },

    // Section Header
    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 18,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: '700',
        letterSpacing: -0.3,
    },

    // Chart Section
    chartSection: {
        padding: 22,
        borderRadius: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 8,
        elevation: 2,
        marginBottom: 20,
    },

    // Stats Row
    statsRow: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        marginTop: 24,
        paddingTop: 20,
        borderTopWidth: 1,
        borderTopColor: '#E5E7EB',
    },
    statItem: {
        alignItems: 'center',
    },
    statItemValue: {
        fontSize: 24,
        fontWeight: '700',
        marginBottom: 6,
    },
    statItemLabel: {
        fontSize: 12,
        fontWeight: '600',
        textTransform: 'uppercase',
    },

    // Data Table
    dataTable: {
        padding: 22,
        borderRadius: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 8,
        elevation: 2,
        marginBottom: 20,
    },
    infoRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 14,
        borderBottomWidth: 1,
        borderBottomColor: '#F3F4F6',
    },
    infoLabel: {
        fontSize: 14,
        fontWeight: '500',
        flex: 1,
        marginRight: 12,
    },
    infoValue: {
        fontSize: 14,
        fontWeight: '700',
    },
});
