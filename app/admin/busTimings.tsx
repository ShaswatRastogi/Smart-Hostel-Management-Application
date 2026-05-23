
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, Modal, RefreshControl, ScrollView, StyleSheet, TextInput, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import InputField from '../../components/InputField';
import { useAlert } from '../../context/AlertContext';
import { useTheme } from '../../utils/ThemeContext';
import { isAdmin, useUser } from '../../utils/authUtils';
import { addBusRoute, BusRoute, deleteBusRoute, subscribeToBusTimings, updateBusRoute } from '../../utils/busTimingsSyncUtils';
import AppText from '../../components/AppText';

export default function ManageBusTimingsPage() {
    const { colors, theme } = useTheme();
    const insets = useSafeAreaInsets();
    const user = useUser();
    const router = useRouter();
    const { showAlert } = useAlert();

    const [routes, setRoutes] = useState<BusRoute[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    // Modal State
    const [modalVisible, setModalVisible] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);

    // Route logic split
    // Route logic split
    const [startPoint, setStartPoint] = useState('');
    const [endPoint, setEndPoint] = useState('');
    const [stops, setStops] = useState<string[]>([]);
    const [message, setMessage] = useState('');

    const [newTimes, setNewTimes] = useState<{ time: string, period: 'AM' | 'PM' }[]>([{ time: '', period: 'AM' }]);
    const [scheduleType, setScheduleType] = useState('everyday');

    useEffect(() => {
        if (!isAdmin(user)) return;
        const unsubscribe = subscribeToBusTimings((data) => {
            setRoutes(data);
            setLoading(false);
        });
        return () => unsubscribe();
    }, [user]);

    const onRefresh = () => {
        setRefreshing(true);
        setTimeout(() => setRefreshing(false), 1000);
    };

    const handleAddTimeSlot = () => {
        setNewTimes([...newTimes, { time: '', period: 'AM' }]);
    };

    const handleTimeChange = (text: string, index: number) => {
        const updatedTimes = [...newTimes];
        updatedTimes[index].time = text;
        setNewTimes(updatedTimes);
    };

    const setPeriod = (index: number, period: 'AM' | 'PM') => {
        const updatedTimes = [...newTimes];
        updatedTimes[index].period = period;
        setNewTimes(updatedTimes);
    };

    const handleRemoveTimeSlot = (index: number) => {
        const updatedTimes = newTimes.filter((_, i) => i !== index);
        setNewTimes(updatedTimes);
    };

    const handleSwapPoints = () => {
        const temp = startPoint;
        setStartPoint(endPoint);
        setEndPoint(temp);
        setStops(prev => [...prev].reverse());
    };

    const handleAddStop = () => {
        setStops([...stops, '']);
    };

    const handleRemoveStop = (index: number) => {
        setStops(stops.filter((_, i) => i !== index));
    };

    const handleStopChange = (text: string, index: number) => {
        const updatedStops = [...stops];
        updatedStops[index] = text;
        setStops(updatedStops);
    };

    const openCreateModal = () => {
        setEditingId(null);
        setStartPoint('');
        setEndPoint('');
        setStops([]);
        setMessage('');
        setNewTimes([{ time: '', period: 'AM' }]);
        setScheduleType('everyday');
        setModalVisible(true);
    };

    const openEditModal = (item: BusRoute) => {
        setEditingId(item.id);
        setMessage(item.message || '');
        setScheduleType(item.schedule_type || 'everyday');

        // Parse Route String: "A -> B -> C"
        const parts = item.route.split(' -> ').map(s => s.trim());
        if (parts.length >= 2) {
            setStartPoint(parts[0]);
            setEndPoint(parts[parts.length - 1]);
            setStops(parts.slice(1, parts.length - 1));
        } else {
            // Fallback for non-standard strings
            setStartPoint(item.route);
            setEndPoint('');
            setStops([]);
        }

        const parsedTimes = item.times.map(t => {
            // Basic parsing logic: "14:30" -> "2:30" "PM"
            // or "09:00" -> "9:00" "AM"
            const [hStr, mStr] = t.split(':');
            let h = parseInt(hStr || '0', 10);
            const m = mStr || '00';
            const period = h >= 12 ? 'PM' : 'AM';

            if (h > 12) h -= 12;
            if (h === 0) h = 12;

            return { time: `${h}:${m}`, period: period as 'AM' | 'PM' };
        });

        setNewTimes(parsedTimes.length > 0 ? parsedTimes : [{ time: '', period: 'AM' }]);
        setModalVisible(true);
    };

    const handleSubmit = async () => {
        if (!startPoint.trim() || !endPoint.trim()) {
            showAlert("Error", "Start and Destination are required");
            return;
        }

        // Construct Route Name
        const cleanStops = stops.filter(s => s.trim().length > 0);
        const routeComponents = [startPoint.trim(), ...cleanStops.map(s => s.trim()), endPoint.trim()];
        const finalRouteName = routeComponents.join(' -> ');

        const validTimes = newTimes
            .filter(t => t.time.trim().length > 0)
            .map(t => `${t.time.trim()} ${t.period}`);

        if (validTimes.length === 0) {
            showAlert("Error", "At least one time is required");
            return;
        }

        try {
            if (editingId) {
                // Update Logic
                await updateBusRoute(editingId, finalRouteName, validTimes[0], message, scheduleType);

                // 2. If there are EXTRA time slots added in the modal (index > 0), create them as NEW routes
                if (validTimes.length > 1) {
                    const extraTimes = validTimes.slice(1);
                    await addBusRoute(finalRouteName, extraTimes, message, scheduleType);
                }

                showAlert("Success", "Route updated successfully");
            } else {
                // Create Logic
                await addBusRoute(finalRouteName, validTimes, message, scheduleType);
                showAlert("Success", "Bus route added successfully");
            }
            setModalVisible(false);
            setStartPoint('');
            setEndPoint('');
            setStops([]);
            setMessage('');
            setNewTimes([{ time: '', period: 'AM' }]);
            setScheduleType('everyday');
        } catch (error) {
            console.error(error);
            showAlert("Error", `Failed to ${editingId ? 'update' : 'add'} route`);
        }
    };

    const handleDelete = (id: string) => {
        showAlert(
            "Confirm Delete",
            "Are you sure you want to delete this route?",
            [
                { text: "Cancel", style: "cancel" },
                {
                    text: "Delete",
                    style: "destructive",
                    onPress: async () => {
                        try {
                            await deleteBusRoute(id);
                        } catch (error) {
                            console.error(error);
                            showAlert("Error", "Failed to delete route");
                        }
                    }
                }
            ]
        );
    };

    const styles = React.useMemo(() => StyleSheet.create({
        container: {
            flex: 1,
            backgroundColor: colors.background,
        },
        header: {
            paddingVertical: 24,
            paddingHorizontal: 24,
            flexDirection: 'row',
            alignItems: 'center',
            gap: 12,
        },
        backBtn: {
            width: 40,
            height: 40,
            borderRadius: 20,
            backgroundColor: 'rgba(255,255,255,0.2)',
            justifyContent: 'center',
            alignItems: 'center',
        },
        headerContent: {
            flex: 1,
        },
        headerTitle: {
            fontSize: 22,
            fontWeight: '800',
            color: '#fff',
            letterSpacing: 0.5,
        },
        createBtn: {
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: colors.primary,
            marginHorizontal: 20,
            marginTop: 20,
            paddingVertical: 16,
            borderRadius: 16,
            gap: 8,
            marginBottom: 20,
            shadowColor: colors.primary,
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.2,
            shadowRadius: 8,
            elevation: 4,
        },
        createBtnText: {
            color: '#fff',
            fontSize: 16,
            fontWeight: '700',
        },
        list: {
            padding: 20,
            paddingBottom: 100,
        },
        card: {
            backgroundColor: colors.card,
            borderRadius: 16,
            padding: 16,
            marginBottom: 16,
            flexDirection: 'row',
            alignItems: 'flex-start',
            gap: 16,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.05,
            shadowRadius: 8,
            elevation: 2,
        },
        cardIcon: {
            width: 48,
            height: 48,
            borderRadius: 12,
            backgroundColor: theme === 'dark' ? 'rgba(59,130,246,0.2)' : '#EFF6FF',
            justifyContent: 'center',
            alignItems: 'center',
        },
        cardContent: {
            flex: 1,
        },
        routeTitle: {
            fontSize: 18,
            fontWeight: '700',
            color: colors.text,
            marginBottom: 8,
        },
        timesContainer: {
            flexDirection: 'row',
            flexWrap: 'wrap',
            gap: 8,
        },
        timeBadge: {
            backgroundColor: theme === 'dark' ? '#334155' : '#F1F5F9',
            paddingHorizontal: 10,
            paddingVertical: 4,
            borderRadius: 8,
        },
        timeText: {
            fontSize: 13,
            color: colors.textSecondary,
            fontWeight: '600',
        },
        deleteBtn: {
            padding: 8,
        },
        modalOverlay: {
            flex: 1,
            backgroundColor: 'rgba(0,0,0,0.5)',
            justifyContent: 'flex-end',
        },
        modalContent: {
            backgroundColor: colors.card,
            borderTopLeftRadius: 24,
            borderTopRightRadius: 24,
            padding: 24,
            maxHeight: '80%',
        },
        modalHeader: {
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 24,
        },
        modalTitle: {
            fontSize: 20,
            fontWeight: '700',
            color: colors.text,
        },
        modalScroll: {
            marginBottom: 24,
        },
        label: {
            fontSize: 14,
            fontWeight: '600',
            color: colors.textSecondary,
            marginBottom: 8,
            marginTop: 16,
        },
        timeInputRow: {
            flexDirection: 'row',
            alignItems: 'center',
            gap: 8,
            marginBottom: 12,
        },
        timeInput: {
            flex: 1,
            height: 50,
            backgroundColor: colors.background,
            borderRadius: 12,
            paddingHorizontal: 16,
            color: colors.text,
            borderWidth: 1,
            borderColor: colors.border,
        },
        removeTimeBtn: {
            width: 40,
            height: 50,
            justifyContent: 'center',
            alignItems: 'center',
            backgroundColor: theme === 'dark' ? 'rgba(239, 68, 68, 0.2)' : '#FEF2F2',
            borderRadius: 12,
        },
        addTimeBtn: {
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 12,
            borderWidth: 1,
            borderColor: colors.primary,
            borderRadius: 12,
            borderStyle: 'dashed',
            marginTop: 8,
            gap: 8,
        },
        addTimeText: {
            color: colors.primary,
            fontWeight: '600',
        },
        submitBtn: {
            backgroundColor: colors.primary,
            paddingVertical: 16,
            borderRadius: 16,
            alignItems: 'center',
            marginBottom: 12,
        },
        submitBtnText: {
            color: '#fff',
            fontSize: 16,
            fontWeight: '700',
        },
        periodToggleContainer: {
            flexDirection: 'row',
            backgroundColor: colors.background,
            borderWidth: 1,
            borderColor: colors.border,
            borderRadius: 12,
            height: 50,
            padding: 4,
            gap: 4,
        },
        periodOption: {
            paddingHorizontal: 12,
            justifyContent: 'center',
            alignItems: 'center',
            borderRadius: 8,
        },
        periodText: {
            fontSize: 14,
            fontWeight: '700',
        },
        modernBadge: {
            paddingHorizontal: 8,
            paddingVertical: 4,
            borderRadius: 6,
            justifyContent: 'center',
            alignItems: 'center',
        },
        modernBadgeText: {
            fontSize: 10,
            fontWeight: '800',
        },
    }), [colors, theme]);

    if (!isAdmin(user)) return null;

    return (
        <View style={styles.container}>
            <LinearGradient colors={['#000428', '#004e92']} style={[styles.header, { paddingTop: 24 + insets.top }]}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                    <MaterialCommunityIcons name="chevron-left" size={32} color="#fff" />
                </TouchableOpacity>
                <View style={styles.headerContent}>
                    <AppText style={styles.headerTitle}>Manage Bus Timings</AppText>
                </View>
            </LinearGradient>

            {loading ? (
                <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: 50 }} />
            ) : (
                <FlatList
                    data={routes}
                    keyExtractor={(item) => item.id}
                    contentContainerStyle={styles.list}
                    refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
                    ListHeaderComponent={
                        <TouchableOpacity style={styles.createBtn} onPress={openCreateModal}>
                            <MaterialCommunityIcons name="plus" size={24} color="#fff" />
                            <AppText style={styles.createBtnText}>Add New Route</AppText>
                        </TouchableOpacity>
                    }
                    renderItem={({ item }) => (
                        <View style={styles.card}>
                            <View style={styles.cardIcon}>
                                <MaterialCommunityIcons name="bus" size={24} color={colors.primary} />
                            </View>
                            <View style={styles.cardContent}>
                                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6, flexWrap: 'wrap' }}>
                                    <AppText style={styles.routeTitle}>{item.route}</AppText>
                                    <View style={[styles.modernBadge, {
                                        backgroundColor: item.schedule_type === 'everyday' ? (theme === 'dark' ? 'rgba(59,130,246,0.15)' : '#EFF6FF') :
                                            item.schedule_type === 'once' ? (theme === 'dark' ? 'rgba(239, 68, 68, 0.15)' : '#FEF2F2') :
                                                (theme === 'dark' ? 'rgba(34,197,94,0.15)' : '#F0FDF4'),
                                        paddingHorizontal: 8,
                                        paddingVertical: 3,
                                        borderRadius: 6
                                    }]}>
                                        <AppText style={{
                                            fontSize: 9,
                                            fontWeight: '800',
                                            color: item.schedule_type === 'everyday' ? '#2563EB' :
                                                item.schedule_type === 'once' ? '#EF4444' :
                                                    '#16A34A'
                                        }}>
                                            {item.schedule_type === 'everyday' ? 'EVERYDAY' :
                                                item.schedule_type === 'once' ? (item.valid_date ? `ONCE: ${new Date(item.valid_date).toLocaleDateString()}` : 'ONCE') :
                                                    item.schedule_type?.toUpperCase() || 'BUS'}
                                        </AppText>
                                    </View>
                                </View>
                                <View style={styles.timesContainer}>
                                    {item.times.map((time, idx) => (
                                        <View key={idx} style={styles.timeBadge}>
                                            <AppText style={styles.timeText}>{time}</AppText>
                                        </View>
                                    ))}
                                </View>
                            </View>
                            <View style={{ gap: 8 }}>
                                <TouchableOpacity onPress={() => openEditModal(item)} style={[styles.deleteBtn, { backgroundColor: theme === 'dark' ? 'rgba(59,130,246,0.2)' : '#EFF6FF' }]}>
                                    <MaterialCommunityIcons name="pencil" size={20} color={colors.primary} />
                                </TouchableOpacity>
                                <TouchableOpacity onPress={() => handleDelete(item.id)} style={[styles.deleteBtn, { backgroundColor: theme === 'dark' ? 'rgba(239, 68, 68, 0.2)' : '#FEF2F2' }]}>
                                    <MaterialCommunityIcons name="trash-can-outline" size={20} color="#EF4444" />
                                </TouchableOpacity>
                            </View>
                        </View>
                    )}
                    ListEmptyComponent={
                        <AppText style={{ textAlign: 'center', color: colors.textSecondary, marginTop: 40 }}>
                            No bus routes found. Add one above.
                        </AppText>
                    }
                />
            )}

            {/* Create Modal */}
            <Modal
                visible={modalVisible}
                transparent
                animationType="slide"
                onRequestClose={() => setModalVisible(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <AppText style={styles.modalTitle}>{editingId ? 'Edit Bus Route' : 'Add Bus Route'}</AppText>
                            <TouchableOpacity onPress={() => setModalVisible(false)}>
                                <MaterialCommunityIcons name="close" size={24} color={colors.text} />
                            </TouchableOpacity>
                        </View>

                        <ScrollView style={styles.modalScroll}>
                            <View style={{ marginBottom: 20 }}>
                                <AppText style={styles.label}>Route Path</AppText>

                                <View style={{ flexDirection: 'row', gap: 12 }}>
                                    {/* Timeline Visuals */}
                                    <View style={{ alignItems: 'center', paddingTop: 18 }}>
                                        {/* Start Dot */}
                                        <View style={{ width: 12, height: 12, borderRadius: 6, backgroundColor: colors.primary, borderWidth: 2, borderColor: colors.card, shadowColor: colors.primary, shadowOpacity: 0.5, shadowRadius: 4, elevation: 4 }} />

                                        {/* Connecting Line */}
                                        <View style={{ flex: 1, width: 2, backgroundColor: colors.border, marginVertical: 4 }} />

                                        {/* Dest Pin */}
                                        <MaterialCommunityIcons name="map-marker" size={16} color="#EF4444" />
                                    </View>

                                    {/* Inputs Container */}
                                    <View style={{ flex: 1, gap: 12 }}>
                                        {/* Start Input */}
                                        <View>
                                            <AppText style={{ fontSize: 11, color: colors.textSecondary, fontWeight: '600', marginBottom: 4, marginLeft: 4 }}>START POINT</AppText>
                                            <TextInput
                                                style={[styles.timeInput, { height: 44 }]}
                                                placeholder="e.g. Hostel"
                                                placeholderTextColor={colors.textSecondary}
                                                value={startPoint}
                                                onChangeText={setStartPoint}
                                            />
                                        </View>

                                        {/* Stops List */}
                                        {stops.map((stop, index) => (
                                            <View key={index} style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                                                <TextInput
                                                    style={[styles.timeInput, { height: 40, flex: 1, fontSize: 13 }]}
                                                    placeholder={`Stop ${index + 1}`}
                                                    placeholderTextColor={colors.textSecondary}
                                                    value={stop}
                                                    onChangeText={(text: string) => handleStopChange(text, index)}
                                                />
                                                <TouchableOpacity onPress={() => handleRemoveStop(index)} style={{ padding: 6 }}>
                                                    <MaterialCommunityIcons name="close" size={18} color={colors.textSecondary} />
                                                </TouchableOpacity>
                                            </View>
                                        ))}

                                        {/* Add Stop Button */}
                                        <TouchableOpacity
                                            onPress={handleAddStop}
                                            style={{ alignSelf: 'flex-start', marginLeft: 4, paddingVertical: 4 }}
                                        >
                                            <AppText style={{ color: colors.primary, fontSize: 12, fontWeight: '700' }}>+ ADD STOP</AppText>
                                        </TouchableOpacity>

                                        {/* Destination Input */}
                                        <View>
                                            <AppText style={{ fontSize: 11, color: colors.textSecondary, fontWeight: '600', marginBottom: 4, marginLeft: 4 }}>DESTINATION</AppText>
                                            <TextInput
                                                style={[styles.timeInput, { height: 44 }]}
                                                placeholder="e.g. College"
                                                placeholderTextColor={colors.textSecondary}
                                                value={endPoint}
                                                onChangeText={setEndPoint}
                                            />
                                        </View>
                                    </View>

                                    {/* Swap Button (Vertical Centered) */}
                                    <View style={{ justifyContent: 'center' }}>
                                        <TouchableOpacity
                                            onPress={handleSwapPoints}
                                            style={{
                                                width: 36,
                                                height: 36,
                                                borderRadius: 18,
                                                backgroundColor: theme === 'dark' ? '#334155' : '#F1F5F9',
                                                justifyContent: 'center',
                                                alignItems: 'center',
                                                borderWidth: 1,
                                                borderColor: colors.border
                                            }}
                                        >
                                            <MaterialCommunityIcons name="swap-vertical" size={20} color={colors.text} />
                                        </TouchableOpacity>
                                    </View>
                                </View>
                            </View>

                            <AppText style={styles.label}>Note / Message (Optional)</AppText>
                            <InputField
                                icon="message-text-outline"
                                placeholder="E.g. Route via Main Market"
                                value={message}
                                onChangeText={setMessage}
                            />
                            <View style={{ height: 12 }} />

                            <View style={{ backgroundColor: theme === 'dark' ? 'rgba(59,130,246,0.05)' : '#F8FAFC', padding: 16, borderRadius: 16, marginBottom: 20, borderWidth: 1, borderColor: colors.border }}>
                                <AppText style={[styles.label, { marginBottom: 12, marginTop: 0 }]}>Schedule Frequency</AppText>
                                <View style={{ flexDirection: 'row', gap: 8 }}>
                                    <TouchableOpacity
                                        style={[styles.periodOption, { flex: 1, height: 44, backgroundColor: scheduleType === 'everyday' ? colors.primary : colors.background, borderWidth: 1, borderColor: scheduleType === 'everyday' ? colors.primary : colors.border }]}
                                        onPress={() => setScheduleType('everyday')}
                                    >
                                        <AppText style={{ color: scheduleType === 'everyday' ? '#fff' : colors.textSecondary, fontWeight: '700', fontSize: 13 }}>Everyday</AppText>
                                    </TouchableOpacity>
                                    <TouchableOpacity
                                        style={[styles.periodOption, { flex: 1, height: 44, backgroundColor: scheduleType === 'today' ? colors.primary : colors.background, borderWidth: 1, borderColor: scheduleType === 'today' ? colors.primary : colors.border }]}
                                        onPress={() => setScheduleType('today')}
                                    >
                                        <AppText style={{ color: scheduleType === 'today' ? '#fff' : colors.textSecondary, fontWeight: '700', fontSize: 13 }}>Today</AppText>
                                    </TouchableOpacity>
                                    <TouchableOpacity
                                        style={[styles.periodOption, { flex: 1, height: 44, backgroundColor: scheduleType === 'tomorrow' ? colors.primary : colors.background, borderWidth: 1, borderColor: scheduleType === 'tomorrow' ? colors.primary : colors.border }]}
                                        onPress={() => setScheduleType('tomorrow')}
                                    >
                                        <AppText style={{ color: scheduleType === 'tomorrow' ? '#fff' : colors.textSecondary, fontWeight: '700', fontSize: 13 }}>Tomorrow</AppText>
                                    </TouchableOpacity>
                                </View>
                            </View>

                            <AppText style={styles.label}>Timings</AppText>
                            {newTimes.map((item, index) => (
                                <View key={index} style={styles.timeInputRow}>
                                    <View style={{ flex: 1, flexDirection: 'row', gap: 8 }}>
                                        <TextInput
                                            style={styles.timeInput}
                                            placeholder="e.g. 08:30"
                                            placeholderTextColor={colors.textSecondary}
                                            value={item.time}
                                            onChangeText={(text) => handleTimeChange(text, index)}
                                            keyboardType="numbers-and-punctuation"
                                        />
                                        <View style={styles.periodToggleContainer}>
                                            <TouchableOpacity
                                                style={[styles.periodOption, item.period === 'AM' && { backgroundColor: colors.primary }]}
                                                onPress={() => setPeriod(index, 'AM')}
                                            >
                                                <AppText style={[styles.periodText, { color: item.period === 'AM' ? '#fff' : colors.textSecondary }]}>AM</AppText>
                                            </TouchableOpacity>
                                            <TouchableOpacity
                                                style={[styles.periodOption, item.period === 'PM' && { backgroundColor: colors.primary }]}
                                                onPress={() => setPeriod(index, 'PM')}
                                            >
                                                <AppText style={[styles.periodText, { color: item.period === 'PM' ? '#fff' : colors.textSecondary }]}>PM</AppText>
                                            </TouchableOpacity>
                                        </View>
                                    </View>

                                    {newTimes.length > 1 && (
                                        <TouchableOpacity onPress={() => handleRemoveTimeSlot(index)} style={styles.removeTimeBtn}>
                                            <MaterialCommunityIcons name="minus" size={20} color="#EF4444" />
                                        </TouchableOpacity>
                                    )}
                                </View>
                            ))}

                            <TouchableOpacity onPress={handleAddTimeSlot} style={styles.addTimeBtn}>
                                <MaterialCommunityIcons name="plus" size={20} color={colors.primary} />
                                <AppText style={styles.addTimeText}>Add Another Time</AppText>
                            </TouchableOpacity>
                        </ScrollView>

                        <TouchableOpacity onPress={handleSubmit} style={styles.submitBtn}>
                            <AppText style={styles.submitBtnText}>{editingId ? 'Update Route' : 'Create Route'}</AppText>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
        </View>
    );
}
