
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, KeyboardAvoidingView, LayoutAnimation, Modal, Platform, ScrollView, StyleSheet, TextInput, TouchableOpacity, UIManager, View } from 'react-native';
import { Directions, Gesture, GestureDetector } from 'react-native-gesture-handler';
import { runOnJS } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAlert } from '../../context/AlertContext';
import { useTheme } from '../../utils/ThemeContext';
import { isAdmin, useUser } from '../../utils/authUtils';
import { DayMenu, initializeDay, MenuItem, MessTimings, subscribeToMenu, updateDayMenu, WeekMenu } from '../../utils/messSyncUtils';
import AppText from '../../components/AppText';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const MEALS = ['breakfast', 'lunch', 'snacks', 'dinner'];

export default function ManageMessMenuPage() {
    const { colors, theme } = useTheme();
    const insets = useSafeAreaInsets();
    const user = useUser();
    const router = useRouter();
    const { showAlert } = useAlert();

    const [fullMenu, setFullMenu] = useState<WeekMenu>({});
    const [selectedDay, setSelectedDay] = useState<string>('Monday');
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    // Local state for editing the currently selected day
    const [currentDayMenu, setCurrentDayMenu] = useState<DayMenu>({
        day: 'Monday',
        breakfast: [],
        lunch: [],
        snacks: [],
        dinner: []
    });

    // Timings State
    const [timingsModalVisible, setTimingsModalVisible] = useState(false);
    const [timings, setTimings] = useState<{
        [key: string]: { start: string, startPeriod: 'AM' | 'PM', end: string, endPeriod: 'AM' | 'PM' }
    }>({
        breakfast: { start: '08:00', startPeriod: 'AM', end: '09:30', endPeriod: 'AM' },
        lunch: { start: '12:30', startPeriod: 'PM', end: '02:30', endPeriod: 'PM' },
        snacks: { start: '05:30', startPeriod: 'PM', end: '06:30', endPeriod: 'PM' },
        dinner: { start: '08:30', startPeriod: 'PM', end: '09:30', endPeriod: 'PM' }
    });
    const [savingTimings, setSavingTimings] = useState(false);
    const dayScrollRef = React.useRef<ScrollView>(null);

    useEffect(() => {
        if (Platform.OS === 'android') {
            if (UIManager.setLayoutAnimationEnabledExperimental) {
                UIManager.setLayoutAnimationEnabledExperimental(true);
            }
        }
    }, []);

    useEffect(() => {
        if (dayScrollRef.current) {
            const index = DAYS.indexOf(selectedDay);
            dayScrollRef.current.scrollTo({ x: index * 90, animated: true });
        }
    }, [selectedDay]);

    const changeDay = (direction: number) => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);

        const currentIndex = DAYS.indexOf(selectedDay);
        let nextIndex = currentIndex + direction;
        if (nextIndex < 0) nextIndex = DAYS.length - 1;
        if (nextIndex >= DAYS.length) nextIndex = 0;
        setSelectedDay(DAYS[nextIndex]);
    };

    const swipeGestures = React.useMemo(() => {
        const left = Gesture.Fling().direction(Directions.LEFT).onEnd(() => runOnJS(changeDay)(1));
        const right = Gesture.Fling().direction(Directions.RIGHT).onEnd(() => runOnJS(changeDay)(-1));
        return Gesture.Race(left, right);
    }, [selectedDay]);

    useEffect(() => {
        if (!isAdmin(user)) return;

        // Subscribe to updates
        const unsubscribe = subscribeToMenu((data) => {
            setFullMenu(data);
            if (loading) setLoading(false);
        });

        return () => unsubscribe();
    }, [user]);

    // When selected day changes or fullMenu updates, sync local state
    const [dirtyMeals, setDirtyMeals] = useState<Set<string>>(new Set());
    const prevSelectedDayRef = React.useRef(selectedDay);

    // When selected day changes or fullMenu updates, sync local state
    useEffect(() => {
        const isDayChange = prevSelectedDayRef.current !== selectedDay;
        prevSelectedDayRef.current = selectedDay;

        // If not a day change and there are local edits, DO NOT overwrite with server updates
        if (!isDayChange && dirtyMeals.size > 0) {
            return;
        }

        if (isDayChange) {
            setDirtyMeals(new Set()); // Reset dirty state on day change
        }

        if (fullMenu[selectedDay]) {
            // Deep copy to avoid reference sharing with fullMenu
            const dayData = JSON.parse(JSON.stringify(fullMenu[selectedDay]));
            setCurrentDayMenu({
                day: selectedDay,
                breakfast: dayData.breakfast || [],
                lunch: dayData.lunch || [],
                snacks: dayData.snacks || [],
                dinner: dayData.dinner || [],
            });

            // Sync timings state
            if (dayData.timings) {
                // Parse the existing "08:00 AM - 09:30 AM" strings into our structured object
                const parsedTimings: any = {};
                MEALS.forEach(meal => {
                    const timeString = dayData.timings[meal] || '';
                    const parts = timeString.split('-');
                    if (parts.length === 2) {
                        const startParts = parts[0].trim().split(' ');
                        const endParts = parts[1].trim().split(' ');
                        parsedTimings[meal] = {
                            start: startParts[0] || '',
                            startPeriod: (startParts[1] || 'AM') as 'AM' | 'PM',
                            end: endParts[0] || '',
                            endPeriod: (endParts[1] || 'PM') as 'AM' | 'PM'
                        };
                    } else {
                        // Fallback defaults if string is malformed
                        parsedTimings[meal] = { start: '12:00', startPeriod: 'PM', end: '12:00', endPeriod: 'PM' };
                    }
                });
                setTimings(parsedTimings);
            } else {
                setTimings({
                    breakfast: { start: '08:00', startPeriod: 'AM', end: '09:30', endPeriod: 'AM' },
                    lunch: { start: '12:30', startPeriod: 'PM', end: '02:30', endPeriod: 'PM' },
                    snacks: { start: '05:30', startPeriod: 'PM', end: '06:30', endPeriod: 'PM' },
                    dinner: { start: '08:30', startPeriod: 'PM', end: '09:30', endPeriod: 'PM' }
                });
            }
        } else {
            // Initialize if missing locally (and trigger DB init)
            initializeDay(selectedDay);
            // Init empty if not found
            setCurrentDayMenu({
                day: selectedDay,
                breakfast: [],
                lunch: [],
                snacks: [],
                dinner: []
            });
            setTimings({
                breakfast: { start: '08:00', startPeriod: 'AM', end: '09:30', endPeriod: 'AM' },
                lunch: { start: '12:30', startPeriod: 'PM', end: '02:30', endPeriod: 'PM' },
                snacks: { start: '05:30', startPeriod: 'PM', end: '06:30', endPeriod: 'PM' },
                dinner: { start: '08:30', startPeriod: 'PM', end: '09:30', endPeriod: 'PM' }
            });
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selectedDay, fullMenu]);

    const handleAddItem = (mealType: string) => {
        const updatedMenu = { ...currentDayMenu };
        // @ts-ignore
        updatedMenu[mealType].push({ dish: '', type: 'veg', highlight: false });
        setCurrentDayMenu(updatedMenu);
        setDirtyMeals(prev => new Set(prev).add(mealType));
    };

    const handleUpdateItem = (mealType: string, index: number, field: keyof MenuItem, value: any) => {
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
        const updatedMenu = { ...currentDayMenu };
        // @ts-ignore
        updatedMenu[mealType][index][field] = value;
        setCurrentDayMenu(updatedMenu);
        setDirtyMeals(prev => new Set(prev).add(mealType));
    };

    const handleDeleteItem = (mealType: string, index: number) => {
        const updatedMenu = { ...currentDayMenu };
        // @ts-ignore
        updatedMenu[mealType].splice(index, 1);
        setCurrentDayMenu(updatedMenu);
        setDirtyMeals(prev => new Set(prev).add(mealType));
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            // 0. Dirty Check - fail fast if user didn't touch anything
            if (dirtyMeals.size === 0) {
                showAlert("Info", "No changes made to save.");
                setSaving(false);
                return;
            }

            // 1. Fetch FRESH server data to ignore any local staleness
            // dynamic import to ensure no circular deps
            // @ts-ignore
            const { default: api } = await import('../../utils/api');
            // @ts-ignore
            const response = await api.get('/services/mess');
            const weekData = response.data;
            let originalDayData = { breakfast: [], lunch: [], snacks: [], dinner: [] };

            // Find the current day in the fresh data
            if (Array.isArray(weekData)) {
                const found = weekData.find((d: any) => d.day === selectedDay);
                if (found) {
                    // Helper to parse potential stringified fields
                    const parseMeal = (meal: any) => {
                        if (typeof meal === 'string') {
                            try { return JSON.parse(meal); } catch (e) { return []; }
                        }
                        return meal || [];
                    };
                    originalDayData = {
                        breakfast: parseMeal(found.breakfast),
                        lunch: parseMeal(found.lunch),
                        snacks: parseMeal(found.snacks),
                        dinner: parseMeal(found.dinner)
                    };
                }
            }

            // 2. Strict Cleaning for Comparison
            const getCleanMeal = (meal: MenuItem[]) => {
                if (!meal) return [];
                return meal
                    .filter(i => i && i.dish && String(i.dish).trim())
                    .map(i => ({
                        // Normalize: Lowercase for comparison (optional, but safer)
                        // Actually, keep case but trim.
                        dish: String(i.dish).trim(),
                        // Force defaults
                        type: (i.type || 'veg') as 'veg' | 'non-veg',
                        highlight: !!i.highlight
                    }));
            };

            const hasChanged = (newMeal: MenuItem[], oldMeal: MenuItem[], label: string) => {
                const cleanNew = getCleanMeal(newMeal);
                const cleanOld = getCleanMeal(oldMeal);

                const strNew = JSON.stringify(cleanNew);
                const strOld = JSON.stringify(cleanOld);

                if (strNew !== strOld) {
                    console.log(`[MessDiff] ${label} CHANGE DETECTED`);
                    console.log(`  OLD: ${strOld}`);
                    console.log(`  NEW: ${strNew}`);
                    return true;
                }
                return false;
            };

            const cleanData: Partial<DayMenu> = {};
            let changeCount = 0;

            // 3. Compare ONLY Dirty Meals
            // If dirtyMeals has 'breakfast', we check it. If confusingly NO diff found, we still trust user intent? 
            // No, if user changed "A" to "B" then back to "A", dirty=true but hasChanged=false. We should NOT save.

            if (dirtyMeals.has('breakfast')) {
                // @ts-ignore
                if (hasChanged(currentDayMenu.breakfast, originalDayData.breakfast, 'Breakfast')) {
                    cleanData.breakfast = getCleanMeal(currentDayMenu.breakfast);
                    changeCount++;
                }
            }

            if (dirtyMeals.has('lunch')) {
                // @ts-ignore
                if (hasChanged(currentDayMenu.lunch, originalDayData.lunch, 'Lunch')) {
                    cleanData.lunch = getCleanMeal(currentDayMenu.lunch);
                    changeCount++;
                }
            }

            if (dirtyMeals.has('snacks')) {
                // @ts-ignore
                if (hasChanged(currentDayMenu.snacks, originalDayData.snacks, 'Snacks')) {
                    cleanData.snacks = getCleanMeal(currentDayMenu.snacks);
                    changeCount++;
                }
            }

            if (dirtyMeals.has('dinner')) {
                // @ts-ignore
                if (hasChanged(currentDayMenu.dinner, originalDayData.dinner, 'Dinner')) {
                    cleanData.dinner = getCleanMeal(currentDayMenu.dinner);
                    changeCount++;
                }
            }

            if (changeCount === 0) {
                // Determine message: if dirty but no diff -> "No actual changes"
                // If not dirty -> handled at top
                showAlert("Info", "No actual changes detected.");
                setSaving(false);
                setDirtyMeals(new Set()); // Clear dirty state since matches server
                return;
            }

            await updateDayMenu(selectedDay, cleanData);

            // Clear dirty state after successful save
            setDirtyMeals(new Set());
            showAlert("Success", `${selectedDay}'s menu updated successfully!`);
        } catch (error) {
            console.error(error);
            showAlert("Error", "Failed to save menu");
        } finally {
            setSaving(false);
        }
    };

    const handleSaveTimings = async () => {
        setSavingTimings(true);
        try {
            // Re-construct the string-based MessTimings from the structured input
            const stringifiedTimings: MessTimings = {
                breakfast: `${timings.breakfast.start} ${timings.breakfast.startPeriod} - ${timings.breakfast.end} ${timings.breakfast.endPeriod}`,
                lunch: `${timings.lunch.start} ${timings.lunch.startPeriod} - ${timings.lunch.end} ${timings.lunch.endPeriod}`,
                snacks: `${timings.snacks.start} ${timings.snacks.startPeriod} - ${timings.snacks.end} ${timings.snacks.endPeriod}`,
                dinner: `${timings.dinner.start} ${timings.dinner.startPeriod} - ${timings.dinner.end} ${timings.dinner.endPeriod}`
            };

            await updateDayMenu(selectedDay, { ...currentDayMenu, timings: stringifiedTimings });

            setTimingsModalVisible(false);
            showAlert("Success", `${selectedDay}'s timings updated!`);
        } catch (error) {
            console.error(error);
            showAlert("Error", "Failed to update timings");
        } finally {
            setSavingTimings(false);
        }
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
        daySelector: {
            maxHeight: 60,
            marginBottom: 10,
        },
        daySelectorContent: {
            paddingHorizontal: 20,
            paddingVertical: 10,
            gap: 8,
        },
        dayBtn: {
            paddingHorizontal: 20,
            paddingVertical: 10,
            borderRadius: 24,
            backgroundColor: colors.card,
            borderWidth: 1,
            borderColor: colors.border,
            minWidth: 70,
            alignItems: 'center',
        },
        dayBtnSelected: {
            backgroundColor: colors.primary,
            borderColor: colors.primary,
        },
        dayBtnText: {
            color: colors.textSecondary,
            fontWeight: '600',
            fontSize: 13,
        },
        dayBtnTextSelected: {
            color: '#fff',
            fontWeight: '700',
        },
        editorScroll: {
            flex: 1,
            padding: 20,
        },
        mealSection: {
            backgroundColor: colors.card,
            borderRadius: 16,
            padding: 16,
            marginBottom: 20,
            borderWidth: 1,
            borderColor: colors.border,
        },
        mealHeader: {
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 16,
        },
        mealTitle: {
            fontSize: 18,
            fontWeight: '700',
            color: colors.text,
            textTransform: 'capitalize',
        },
        addItemBtn: {
            flexDirection: 'row',
            alignItems: 'center',
            padding: 6,
            gap: 4,
        },
        addItemText: {
            color: colors.primary,
            fontWeight: '600',
            fontSize: 13,
        },
        itemRow: {
            flexDirection: 'row',
            alignItems: 'center',
            gap: 8,
            marginBottom: 12,
        },
        itemInput: {
            flex: 1,
            height: 44,
            backgroundColor: colors.background,
            borderRadius: 8,
            paddingHorizontal: 12,
            borderWidth: 1,
            borderColor: colors.border,
            color: colors.text,
        },
        typeToggle: {
            width: 36,
            height: 36,
            borderRadius: 8,
            justifyContent: 'center',
            alignItems: 'center',
            borderWidth: 1,
            borderColor: colors.border,
        },
        deleteBtn: {
            width: 36,
            height: 36,
            borderRadius: 8,
            justifyContent: 'center',
            alignItems: 'center',
            backgroundColor: theme === 'dark' ? 'rgba(239, 68, 68, 0.2)' : '#FEF2F2',
        },
        saveBtn: {
            backgroundColor: colors.primary,
            marginHorizontal: 20,
            marginBottom: insets.bottom > 0 ? insets.bottom : 20,
            marginTop: 8,
            paddingVertical: 16,
            borderRadius: 16,
            flexDirection: 'row',
            justifyContent: 'center',
            alignItems: 'center',
            gap: 10,
            shadowColor: colors.primary,
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.2,
            shadowRadius: 8,
            elevation: 4,
        },
        saveBtnText: {
            color: '#fff',
            fontSize: 18,
            fontWeight: '700',
        },

        timingBtn: {
            width: 40,
            height: 40,
            borderRadius: 20,
            backgroundColor: 'rgba(255,255,255,0.2)',
            justifyContent: 'center',
            alignItems: 'center',
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
        label: {
            fontSize: 14,
            fontWeight: '600',
            color: colors.textSecondary,
            marginBottom: 8,
            marginTop: 16,
        },
        currentDayTitle: {
            fontSize: 20,
            fontWeight: '700',
            color: colors.text,
            marginBottom: 16,
            marginLeft: 4,
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
            textAlign: 'center',
            fontSize: 16,
            fontWeight: '600'
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
            paddingHorizontal: 10,
            justifyContent: 'center',
            alignItems: 'center',
            borderRadius: 8,
        },
        periodText: {
            fontSize: 13,
            fontWeight: '700',
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
                    <AppText style={styles.headerTitle}>Manage Mess Menu</AppText>
                </View>
                <TouchableOpacity onPress={() => setTimingsModalVisible(true)} style={styles.timingBtn}>
                    <MaterialCommunityIcons name="clock-edit-outline" size={24} color="#fff" />
                </TouchableOpacity>
            </LinearGradient>

            {loading ? (
                <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: 50 }} />
            ) : (
                <KeyboardAvoidingView
                    style={{ flex: 1 }}
                    behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                    keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
                >
                    <View style={styles.daySelector}>
                        <ScrollView
                            ref={dayScrollRef}
                            horizontal
                            showsHorizontalScrollIndicator={false}
                            contentContainerStyle={styles.daySelectorContent}
                        >
                            {DAYS.map(day => (
                                <TouchableOpacity
                                    key={day}
                                    style={[styles.dayBtn, selectedDay === day && styles.dayBtnSelected]}
                                    onPress={() => setSelectedDay(day)}
                                >
                                    <AppText style={[styles.dayBtnText, selectedDay === day && styles.dayBtnTextSelected]}>
                                        {day.slice(0, 3)}
                                    </AppText>
                                </TouchableOpacity>
                            ))}
                        </ScrollView>
                    </View>

                    <GestureDetector gesture={swipeGestures}>
                        <ScrollView
                            style={styles.editorScroll}
                            contentContainerStyle={{ paddingBottom: 100 }}
                            keyboardShouldPersistTaps="handled"
                        >
                            <AppText style={styles.currentDayTitle}>{selectedDay}'s Menu</AppText>
                            {MEALS.map(meal => {
                                // @ts-ignore
                                const items: MenuItem[] = currentDayMenu[meal] || [];

                                return (
                                    <View key={meal} style={styles.mealSection}>
                                        <View style={styles.mealHeader}>
                                            <AppText style={styles.mealTitle}>{meal}</AppText>
                                            <TouchableOpacity onPress={() => handleAddItem(meal)} style={styles.addItemBtn}>
                                                <MaterialCommunityIcons name="plus-circle" size={18} color={colors.primary} />
                                                <AppText style={styles.addItemText}>Add Item</AppText>
                                            </TouchableOpacity>
                                        </View>

                                        {items.length === 0 ? (
                                            <AppText style={{ color: colors.textSecondary, fontStyle: 'italic', fontSize: 13 }}>No items added yet.</AppText>
                                        ) : (
                                            items.map((item, idx) => (
                                                <View key={idx} style={styles.itemRow}>
                                                    <TextInput
                                                        style={styles.itemInput}
                                                        placeholder="Dish Name"
                                                        placeholderTextColor={colors.textSecondary}
                                                        value={item.dish}
                                                        onChangeText={(text) => handleUpdateItem(meal, idx, 'dish', text)}
                                                    />

                                                    {/* Veg/Non-Veg Toggle */}
                                                    <TouchableOpacity
                                                        style={[styles.typeToggle, { borderColor: item.type === 'veg' ? '#10B981' : '#EF4444' }]}
                                                        onPress={() => handleUpdateItem(meal, idx, 'type', item.type === 'veg' ? 'non-veg' : 'veg')}
                                                    >
                                                        <MaterialCommunityIcons
                                                            name="circle-slice-8"
                                                            size={16}
                                                            color={item.type === 'veg' ? '#10B981' : '#EF4444'}
                                                        />
                                                    </TouchableOpacity>

                                                    {/* Highlight/Star Toggle */}
                                                    <TouchableOpacity
                                                        style={[styles.typeToggle, item.highlight && { backgroundColor: theme === 'dark' ? 'rgba(245, 158, 11, 0.2)' : '#FFFBEB', borderColor: '#F59E0B' }]}
                                                        onPress={() => handleUpdateItem(meal, idx, 'highlight', !item.highlight)}
                                                    >
                                                        <MaterialCommunityIcons
                                                            name={item.highlight ? "star" : "star-outline"}
                                                            size={18}
                                                            color={item.highlight ? "#F59E0B" : colors.textSecondary}
                                                        />
                                                    </TouchableOpacity>

                                                    <TouchableOpacity onPress={() => handleDeleteItem(meal, idx)} style={styles.deleteBtn}>
                                                        <MaterialCommunityIcons name="minus" size={18} color="#EF4444" />
                                                    </TouchableOpacity>
                                                </View>
                                            ))
                                        )}
                                    </View>
                                );
                            })}
                        </ScrollView>
                    </GestureDetector>

                    <TouchableOpacity
                        style={[styles.saveBtn, saving && { opacity: 0.7 }]}
                        onPress={handleSave}
                        disabled={saving}
                    >
                        {saving ? (
                            <ActivityIndicator color="#fff" />
                        ) : (
                            <>
                                <MaterialCommunityIcons name="content-save" size={24} color="#fff" />
                                <AppText style={styles.saveBtnText}>Save {selectedDay}'s Menu</AppText>
                            </>
                        )}
                    </TouchableOpacity>
                </KeyboardAvoidingView>
            )}

            {/* Timings Modal */}
            <Modal
                visible={timingsModalVisible}
                transparent
                animationType="slide"
                onRequestClose={() => setTimingsModalVisible(false)}
            >
                <View style={styles.modalOverlay}>
                    <KeyboardAvoidingView
                        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                        style={{ flex: 1, justifyContent: 'flex-end' }}
                    >
                        <View style={styles.modalContent}>
                            <View style={styles.modalHeader}>
                                <AppText style={styles.modalTitle}>Update {selectedDay}'s Timings</AppText>
                                <TouchableOpacity onPress={() => setTimingsModalVisible(false)}>
                                    <MaterialCommunityIcons name="close" size={24} color={colors.text} />
                                </TouchableOpacity>
                            </View>

                            <ScrollView style={{ maxHeight: 550 }} showsVerticalScrollIndicator={false}>
                                {MEALS.map((meal) => (
                                    <View key={meal} style={{ marginBottom: 20 }}>
                                        <AppText style={styles.label}>{meal.charAt(0).toUpperCase() + meal.slice(1)} Timings</AppText>

                                        {/* Start Time Row */}
                                        <View style={styles.timeInputRow}>
                                            <AppText style={{ width: 40, color: colors.textSecondary, fontWeight: '600' }}>From</AppText>
                                            <TextInput
                                                style={styles.timeInput}
                                                placeholder="08:00"
                                                placeholderTextColor={colors.textSecondary}
                                                // @ts-ignore
                                                value={timings[meal].start}
                                                // @ts-ignore
                                                onChangeText={(text) => setTimings({ ...timings, [meal]: { ...timings[meal], start: text } })}
                                                keyboardType="numbers-and-punctuation"
                                            />
                                            <View style={styles.periodToggleContainer}>
                                                <TouchableOpacity
                                                    // @ts-ignore
                                                    style={[styles.periodOption, timings[meal].startPeriod === 'AM' && { backgroundColor: colors.primary }]}
                                                    // @ts-ignore
                                                    onPress={() => setTimings({ ...timings, [meal]: { ...timings[meal], startPeriod: 'AM' } })}
                                                >
                                                    {/* @ts-ignore */}
                                                    <AppText style={[styles.periodText, { color: timings[meal].startPeriod === 'AM' ? '#fff' : colors.textSecondary }]}>AM</AppText>
                                                </TouchableOpacity>
                                                <TouchableOpacity
                                                    // @ts-ignore
                                                    style={[styles.periodOption, timings[meal].startPeriod === 'PM' && { backgroundColor: colors.primary }]}
                                                    // @ts-ignore
                                                    onPress={() => setTimings({ ...timings, [meal]: { ...timings[meal], startPeriod: 'PM' } })}
                                                >
                                                    {/* @ts-ignore */}
                                                    <AppText style={[styles.periodText, { color: timings[meal].startPeriod === 'PM' ? '#fff' : colors.textSecondary }]}>PM</AppText>
                                                </TouchableOpacity>
                                            </View>
                                        </View>

                                        {/* End Time Row */}
                                        <View style={styles.timeInputRow}>
                                            <AppText style={{ width: 40, color: colors.textSecondary, fontWeight: '600' }}>To</AppText>
                                            <TextInput
                                                style={styles.timeInput}
                                                placeholder="09:30"
                                                placeholderTextColor={colors.textSecondary}
                                                // @ts-ignore
                                                value={timings[meal].end}
                                                // @ts-ignore
                                                onChangeText={(text) => setTimings({ ...timings, [meal]: { ...timings[meal], end: text } })}
                                                keyboardType="numbers-and-punctuation"
                                            />
                                            <View style={styles.periodToggleContainer}>
                                                <TouchableOpacity
                                                    // @ts-ignore
                                                    style={[styles.periodOption, timings[meal].endPeriod === 'AM' && { backgroundColor: colors.primary }]}
                                                    // @ts-ignore
                                                    onPress={() => setTimings({ ...timings, [meal]: { ...timings[meal], endPeriod: 'AM' } })}
                                                >
                                                    {/* @ts-ignore */}
                                                    <AppText style={[styles.periodText, { color: timings[meal].endPeriod === 'AM' ? '#fff' : colors.textSecondary }]}>AM</AppText>
                                                </TouchableOpacity>
                                                <TouchableOpacity
                                                    // @ts-ignore
                                                    style={[styles.periodOption, timings[meal].endPeriod === 'PM' && { backgroundColor: colors.primary }]}
                                                    // @ts-ignore
                                                    onPress={() => setTimings({ ...timings, [meal]: { ...timings[meal], endPeriod: 'PM' } })}
                                                >
                                                    {/* @ts-ignore */}
                                                    <AppText style={[styles.periodText, { color: timings[meal].endPeriod === 'PM' ? '#fff' : colors.textSecondary }]}>PM</AppText>
                                                </TouchableOpacity>
                                            </View>
                                        </View>
                                    </View>
                                ))}
                            </ScrollView>

                            <TouchableOpacity
                                style={[styles.saveBtn, savingTimings && { opacity: 0.7 }, { marginHorizontal: 0, marginTop: 24 }]}
                                onPress={handleSaveTimings}
                                disabled={savingTimings}
                            >
                                {savingTimings ? (
                                    <ActivityIndicator color="#fff" />
                                ) : (
                                    <AppText style={styles.saveBtnText}>Save Timings</AppText>
                                )}
                            </TouchableOpacity>
                        </View>
                    </KeyboardAvoidingView>
                </View>
            </Modal>
        </View>
    );
}
