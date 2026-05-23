import React, { useEffect, useState } from 'react';
import { View, ScrollView, StyleSheet, TouchableOpacity, Dimensions, ActivityIndicator, RefreshControl, TextInput, Modal } from 'react-native';
import MaterialIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import AppText from '../../../components/AppText';
import { useTheme } from '../../../utils/ThemeContext';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ServiceRequest, subscribeToAllServiceRequests, updateServiceStatus } from '../../../utils/serviceUtils';
import { 
    InventoryItem, 
    ChecklistItem, 
    fetchInventory, 
    fetchChecklist, 
    toggleChecklistItem, 
    updateInventoryItem, 
    resetChecklist 
} from '../../../utils/cleaningUtils';
import { useAlert } from '../../../context/AlertContext';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface CleaningPortalProps {
    user: any;
    sidebarOpen: boolean;
    setSidebarOpen: (open: boolean) => void;
    isDark: boolean;
    colors: any;
}

export default function CleaningPortal({ user, sidebarOpen, setSidebarOpen, isDark, colors }: CleaningPortalProps) {
    const insets = useSafeAreaInsets();
    const router = useRouter();
    const { showAlert } = useAlert();

    const [requests, setRequests] = useState<ServiceRequest[]>([]);
    const [inventory, setInventory] = useState<InventoryItem[]>([]);
    const [checklist, setChecklist] = useState<ChecklistItem[]>([]);
    
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [updatingId, setUpdatingId] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState<'tasks' | 'inventory' | 'checklist'>('tasks');

    const canEdit = ['owner', 'admin', 'warden', 'cleaning_staff'].includes(user?.role);

    // Modal State for editing inventory
    const [editModalVisible, setEditModalVisible] = useState(false);
    const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);
    const [editStock, setEditStock] = useState('');
    const [editStatus, setEditStatus] = useState<'Good' | 'Low' | 'Out of Stock'>('Good');

    const loadData = async () => {
        try {
            const [inv, check] = await Promise.all([fetchInventory(), fetchChecklist()]);
            setInventory(inv);
            setChecklist(check);
        } catch (error) {
            console.error("Error loading cleaning data:", error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        loadData();
        const unsubscribe = subscribeToAllServiceRequests((data) => {
            const cleaningRequests = data.filter(r => 
                r.serviceType.toLowerCase().includes('cleaning') || 
                r.serviceType.toLowerCase().includes('housekeeping')
            );
            setRequests(cleaningRequests);
        });
        return () => unsubscribe();
    }, []);

    const onRefresh = () => {
        setRefreshing(true);
        loadData();
    };

    const handleCompleteTask = async (id: string) => {
        try {
            setUpdatingId(id);
            await updateServiceStatus(id, 'completed', undefined, 'Cleaned by staff');
            showAlert('Success', 'Task marked as completed!', [], 'success');
        } catch (error) {
            showAlert('Error', 'Failed to update task.', [], 'error');
        } finally {
            setUpdatingId(null);
        }
    };

    const handleToggleChecklist = async (id: string, currentStatus: boolean) => {
        if (!canEdit) {
            showAlert('Access Denied', 'Only authorized staff can update the checklist.', [], 'error');
            return;
        }
        try {
            await toggleChecklistItem(id, !currentStatus);
            loadData(); // Reload to get updated times
        } catch (error) {
            showAlert('Error', 'Failed to update checklist.', [], 'error');
        }
    };

    const handleResetChecklist = async () => {
        if (!canEdit) {
            showAlert('Access Denied', 'Only authorized staff can reset the checklist.', [], 'error');
            return;
        }
        try {
            await resetChecklist();
            showAlert('Success', 'Checklist reset for the new shift.', [], 'success');
            loadData();
        } catch (error) {
            showAlert('Error', 'Failed to reset checklist.', [], 'error');
        }
    };

    const handleUpdateInventory = async () => {
        if (!selectedItem) return;
        try {
            setUpdatingId(selectedItem.id);
            await updateInventoryItem(selectedItem.id, editStock, editStatus);
            setEditModalVisible(false);
            loadData();
            showAlert('Success', 'Inventory updated.', [], 'success');
        } catch (error) {
            showAlert('Error', 'Failed to update inventory.', [], 'error');
        } finally {
            setUpdatingId(null);
        }
    };

    const cleaningStats = {
        pending: requests.filter(r => r.status === 'pending').length,
        completedToday: requests.filter(r => r.status === 'completed' && new Date(r.updatedAt).toDateString() === new Date().toDateString()).length,
        lowStock: inventory.filter(i => i.status === 'Low' || i.status === 'Out of Stock').length
    };

    const renderHeader = () => (
        <LinearGradient
            colors={['#065f46', '#059669']}
            style={[styles.header, { paddingTop: insets.top + 20 }]}
        >
            <View style={styles.headerTop}>
                <TouchableOpacity onPress={() => setSidebarOpen(true)} style={styles.menuBtn}>
                    <MaterialIcons name="menu" size={24} color="#fff" />
                </TouchableOpacity>
                <View style={styles.headerText}>
                    <AppText style={styles.greeting}>Cleaning Dashboard</AppText>
                    <AppText style={styles.subGreeting}>{new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</AppText>
                </View>
            </View>

            <View style={styles.statsRow}>
                <View style={styles.statCard}>
                    <AppText style={styles.statValue}>{cleaningStats.pending}</AppText>
                    <AppText style={styles.statLabel}>Pending</AppText>
                </View>
                <View style={[styles.statCard, { backgroundColor: 'rgba(255,255,255,0.2)' }]}>
                    <AppText style={styles.statValue}>{cleaningStats.completedToday}</AppText>
                    <AppText style={styles.statLabel}>Completed</AppText>
                </View>
                <View style={styles.statCard}>
                    <AppText style={[styles.statValue, { color: cleaningStats.lowStock > 0 ? '#FECACA' : '#fff' }]}>{cleaningStats.lowStock}</AppText>
                    <AppText style={styles.statLabel}>Low Stock</AppText>
                </View>
            </View>
        </LinearGradient>
    );

    const renderTasks = () => (
        <View style={styles.tabContent}>
            <View style={styles.sectionHeader}>
                <AppText style={[styles.sectionTitle, { color: colors.text }]}>Active Requests</AppText>
                <AppText style={{ color: colors.textSecondary, fontSize: 12 }}>{requests.length} Total</AppText>
            </View>

            {requests.length === 0 ? (
                <View style={styles.emptyState}>
                    <MaterialIcons name="broom" size={48} color={isDark ? '#334155' : '#E2E8F0'} />
                    <AppText style={[styles.emptyText, { color: colors.textSecondary }]}>No cleaning requests found.</AppText>
                </View>
            ) : (
                requests.map((req) => (
                    <View key={req.id} style={[styles.taskCard, { backgroundColor: isDark ? '#1e293b' : '#fff', borderColor: colors.border }]}>
                        <View style={styles.taskHeader}>
                            <View style={[styles.roomBadge, { backgroundColor: '#05966920' }]}>
                                <AppText style={{ color: '#059669', fontWeight: '800' }}>R-{req.roomNo}</AppText>
                            </View>
                            <View style={[styles.statusTag, { backgroundColor: req.status === 'completed' ? '#10B98120' : '#F59E0B20' }]}>
                                <AppText style={{ color: req.status === 'completed' ? '#10B981' : '#F59E0B', fontSize: 10, fontWeight: '800' }}>{req.status.toUpperCase()}</AppText>
                            </View>
                        </View>

                        <AppText style={[styles.taskTitle, { color: colors.text }]}>{req.studentName}</AppText>
                        <AppText style={[styles.taskDesc, { color: colors.textSecondary }]}>{req.description || 'Routine room cleaning request'}</AppText>
                        
                        <View style={styles.taskFooter}>
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                                <MaterialIcons name="clock-outline" size={14} color={colors.textSecondary} />
                                <AppText style={{ fontSize: 12, color: colors.textSecondary }}>{new Date(req.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</AppText>
                            </View>
                            
                            {req.status !== 'completed' && canEdit && (
                                <TouchableOpacity 
                                    style={styles.doneBtn} 
                                    onPress={() => handleCompleteTask(req.id)}
                                    disabled={updatingId === req.id}
                                >
                                    {updatingId === req.id ? (
                                        <ActivityIndicator size="small" color="#fff" />
                                    ) : (
                                        <>
                                            <MaterialIcons name="check" size={16} color="#fff" />
                                            <AppText style={styles.doneBtnText}>Mark Done</AppText>
                                        </>
                                    )}
                                </TouchableOpacity>
                            )}
                        </View>
                    </View>
                ))
            )}
        </View>
    );

    const renderInventory = () => (
        <View style={styles.tabContent}>
            <View style={styles.sectionHeader}>
                <AppText style={[styles.sectionTitle, { color: colors.text }]}>Cleaning Supplies</AppText>
            </View>

            <View style={styles.inventoryGrid}>
                {inventory.map((item) => (
                    <View key={item.id} style={[styles.inventoryCard, { backgroundColor: isDark ? '#1e293b' : '#fff', borderColor: colors.border }]}>
                        <View style={styles.inventoryInfo}>
                            <AppText style={[styles.itemName, { color: colors.text }]}>{item.name}</AppText>
                            <AppText style={[styles.itemStock, { color: (item.status === 'Low' || item.status === 'Out of Stock') ? '#EF4444' : '#10B981' }]}>{item.stock} in stock • {item.status}</AppText>
                        </View>
                        {canEdit && (
                            <TouchableOpacity 
                                style={styles.editBtn}
                                onPress={() => {
                                    setSelectedItem(item);
                                    setEditStock(item.stock);
                                    setEditStatus(item.status);
                                    setEditModalVisible(true);
                                }}
                            >
                                <MaterialIcons name="pencil-outline" size={18} color={colors.textSecondary} />
                            </TouchableOpacity>
                        )}
                    </View>
                ))}
            </View>
        </View>
    );

    const renderChecklist = () => (
        <View style={styles.tabContent}>
            <View style={styles.sectionHeader}>
                <AppText style={[styles.sectionTitle, { color: colors.text }]}>Common Area Routine</AppText>
                {canEdit && (
                    <TouchableOpacity onPress={handleResetChecklist}>
                        <AppText style={{ color: colors.primary, fontWeight: '700', fontSize: 13 }}>Reset</AppText>
                    </TouchableOpacity>
                )}
            </View>
            {checklist.map((item) => (
                <TouchableOpacity 
                    key={item.id} 
                    style={[styles.checkItem, { backgroundColor: isDark ? '#1e293b' : '#F8FAFC' }]}
                    onPress={() => handleToggleChecklist(item.id, item.is_done)}
                >
                    <View style={[styles.checkBox, { borderColor: item.is_done ? '#10B981' : colors.border, backgroundColor: item.is_done ? '#10B981' : 'transparent' }]}>
                        {item.is_done && <MaterialIcons name="check" size={16} color="#fff" />}
                    </View>
                    <View style={{ flex: 1 }}>
                        <AppText style={[styles.areaName, { color: colors.text, textDecorationLine: item.is_done ? 'line-through' : 'none' }]}>{item.area_name}</AppText>
                        <AppText style={{ fontSize: 12, color: colors.textSecondary }}>
                            {item.is_done ? `Completed at ${item.completed_at?.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}` : 'Status: Pending'}
                        </AppText>
                    </View>
                    <MaterialIcons name="chevron-right" size={20} color={colors.textSecondary} />
                </TouchableOpacity>
            ))}
        </View>
    );

    return (
        <View style={{ flex: 1, backgroundColor: colors.background }}>
            <ScrollView 
                style={styles.container} 
                showsVerticalScrollIndicator={false}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#059669']} tintColor="#059669" />}
            >
                {renderHeader()}

                <View style={styles.tabBar}>
                    <TouchableOpacity onPress={() => setActiveTab('tasks')} style={[styles.tab, activeTab === 'tasks' && styles.activeTab]}>
                        <AppText style={[styles.tabLabel, activeTab === 'tasks' && { color: '#059669' }]}>Requests</AppText>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => setActiveTab('inventory')} style={[styles.tab, activeTab === 'inventory' && styles.activeTab]}>
                        <AppText style={[styles.tabLabel, activeTab === 'inventory' && { color: '#059669' }]}>Inventory</AppText>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => setActiveTab('checklist')} style={[styles.tab, activeTab === 'checklist' && styles.activeTab]}>
                        <AppText style={[styles.tabLabel, activeTab === 'checklist' && { color: '#059669' }]}>Checklist</AppText>
                    </TouchableOpacity>
                </View>

                {loading ? (
                    <ActivityIndicator size="large" color="#059669" style={{ marginTop: 40 }} />
                ) : (
                    <>
                        {activeTab === 'tasks' && renderTasks()}
                        {activeTab === 'inventory' && renderInventory()}
                        {activeTab === 'checklist' && renderChecklist()}
                    </>
                )}
                
                <View style={{ height: 40 }} />
            </ScrollView>

            {/* Inventory Edit Modal */}
            <Modal visible={editModalVisible} transparent animationType="fade">
                <View style={styles.modalOverlay}>
                    <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
                        <AppText style={[styles.modalTitle, { color: colors.text }]}>Update Inventory</AppText>
                        <AppText style={[styles.modalSubtitle, { color: colors.textSecondary }]}>{selectedItem?.name}</AppText>
                        
                        <View style={{ marginBottom: 20 }}>
                            <AppText style={[styles.inputLabel, { color: colors.text }]}>Current Stock</AppText>
                            <TextInput 
                                style={[styles.input, { backgroundColor: isDark ? '#1e293b' : '#f1f5f9', color: colors.text, borderColor: colors.border }]}
                                value={editStock}
                                onChangeText={setEditStock}
                                placeholder="e.g. 10L, 5 units"
                            />
                        </View>

                        <View style={{ marginBottom: 30 }}>
                            <AppText style={[styles.inputLabel, { color: colors.text }]}>Status</AppText>
                            <View style={styles.statusOptions}>
                                {(['Good', 'Low', 'Out of Stock'] as const).map((s) => (
                                    <TouchableOpacity 
                                        key={s} 
                                        style={[styles.statusOption, editStatus === s && { backgroundColor: '#059669', borderColor: '#059669' }]}
                                        onPress={() => setEditStatus(s)}
                                    >
                                        <AppText style={[styles.statusOptionText, editStatus === s && { color: '#fff' }]}>{s}</AppText>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        </View>

                        <View style={styles.modalActions}>
                            <TouchableOpacity style={styles.cancelBtn} onPress={() => setEditModalVisible(false)}>
                                <AppText style={styles.cancelBtnText}>Cancel</AppText>
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.confirmBtn} onPress={handleUpdateInventory} disabled={updatingId !== null}>
                                {updatingId !== null ? <ActivityIndicator size="small" color="#fff" /> : <AppText style={styles.confirmBtnText}>Update</AppText>}
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        paddingHorizontal: 24,
        paddingBottom: 30,
        borderBottomLeftRadius: 36,
        borderBottomRightRadius: 36,
    },
    headerTop: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 24,
    },
    menuBtn: {
        width: 44,
        height: 44,
        borderRadius: 12,
        backgroundColor: 'rgba(255,255,255,0.15)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    headerText: {
        marginLeft: 16,
    },
    greeting: {
        fontSize: 22,
        fontWeight: '800',
        color: '#fff',
    },
    subGreeting: {
        fontSize: 13,
        color: 'rgba(255,255,255,0.7)',
        fontWeight: '600',
    },
    statsRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        gap: 12,
    },
    statCard: {
        flex: 1,
        padding: 16,
        borderRadius: 22,
        backgroundColor: 'rgba(255,255,255,0.1)',
        alignItems: 'center',
        gap: 4,
    },
    statValue: {
        fontSize: 20,
        fontWeight: '800',
        color: '#fff',
    },
    statLabel: {
        fontSize: 10,
        color: 'rgba(255,255,255,0.7)',
        fontWeight: '700',
        textTransform: 'uppercase',
    },
    tabBar: {
        flexDirection: 'row',
        paddingHorizontal: 24,
        marginTop: 24,
        marginBottom: 8,
        gap: 12,
    },
    tab: {
        paddingVertical: 8,
        paddingHorizontal: 16,
        borderRadius: 20,
    },
    activeTab: {
        backgroundColor: '#05966915',
    },
    tabLabel: {
        fontSize: 14,
        fontWeight: '700',
        color: '#64748B',
    },
    tabContent: {
        paddingHorizontal: 24,
        paddingTop: 16,
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '800',
    },
    emptyState: {
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 60,
        gap: 12,
    },
    emptyText: {
        fontSize: 15,
        fontWeight: '600',
    },
    taskCard: {
        padding: 20,
        borderRadius: 24,
        marginBottom: 16,
        borderWidth: 1,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
        elevation: 2,
    },
    taskHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    roomBadge: {
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 8,
    },
    statusTag: {
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 6,
    },
    taskTitle: {
        fontSize: 17,
        fontWeight: '800',
        marginBottom: 4,
    },
    taskDesc: {
        fontSize: 14,
        lineHeight: 20,
        marginBottom: 16,
    },
    taskFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingTop: 16,
        borderTopWidth: 1,
        borderTopColor: '#f1f5f9',
    },
    doneBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#059669',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 10,
        gap: 6,
    },
    doneBtnText: {
        color: '#fff',
        fontSize: 12,
        fontWeight: '700',
    },
    inventoryGrid: {
        gap: 12,
    },
    inventoryCard: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        borderRadius: 16,
        borderWidth: 1,
    },
    inventoryInfo: {
        flex: 1,
    },
    itemName: {
        fontSize: 15,
        fontWeight: '700',
    },
    itemStock: {
        fontSize: 13,
        fontWeight: '600',
        marginTop: 2,
    },
    editBtn: {
        padding: 4,
    },
    checkItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        borderRadius: 16,
        marginBottom: 12,
        gap: 12,
    },
    checkBox: {
        width: 24,
        height: 24,
        borderRadius: 8,
        borderWidth: 2,
        justifyContent: 'center',
        alignItems: 'center',
    },
    areaName: {
        fontSize: 15,
        fontWeight: '700',
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        padding: 24,
    },
    modalContent: {
        padding: 24,
        borderRadius: 24,
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: '800',
        marginBottom: 4,
    },
    modalSubtitle: {
        fontSize: 14,
        marginBottom: 24,
    },
    inputLabel: {
        fontSize: 13,
        fontWeight: '700',
        marginBottom: 8,
    },
    input: {
        padding: 12,
        borderRadius: 12,
        borderWidth: 1,
    },
    statusOptions: {
        flexDirection: 'row',
        gap: 8,
        flexWrap: 'wrap',
    },
    statusOption: {
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 10,
        borderWidth: 1,
        borderColor: '#e2e8f0',
    },
    statusOptionText: {
        fontSize: 12,
        fontWeight: '700',
        color: '#64748B',
    },
    modalActions: {
        flexDirection: 'row',
        gap: 12,
    },
    cancelBtn: {
        flex: 1,
        padding: 14,
        borderRadius: 12,
        backgroundColor: '#f1f5f9',
        alignItems: 'center',
    },
    confirmBtn: {
        flex: 1,
        padding: 14,
        borderRadius: 12,
        backgroundColor: '#059669',
        alignItems: 'center',
    },
    cancelBtnText: {
        fontWeight: '700',
        color: '#64748B',
    },
    confirmBtnText: {
        fontWeight: '700',
        color: '#fff',
    }
});
