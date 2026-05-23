import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useMemo, useState } from 'react';
import { FlatList, KeyboardAvoidingView, Modal, Platform, ScrollView, StyleSheet, TextInput, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import AppText from '../../components/AppText';
import { useAlert } from '../../context/AlertContext';
import { useTheme } from '../../utils/ThemeContext';
import api from '../../utils/api';
import { isOwner, useUser } from '../../utils/authUtils';

type TeamMember = {
    id: string;
    fullName: string;
    email: string;
    role: string;
};

const ROLES = ['owner', 'warden', 'staff', 'cleaning_staff', 'mess_staff', 'laundry_staff', 'guard', 'maintenance_staff'];
const ROLE_LABELS: Record<string, string> = {
    owner: 'Owner',
    warden: 'Warden',
    staff: 'General Staff',
    cleaning_staff: 'Cleaning Staff',
    mess_staff: 'Mess Staff',
    laundry_staff: 'Laundry Staff',
    guard: 'Guard',
    maintenance_staff: 'Maintenance Staff',
};

export default function TeamManagementPage() {
    const { colors, theme } = useTheme();
    const router = useRouter();
    const params = useLocalSearchParams();
    const user = useUser();
    const { showAlert } = useAlert();
    const insets = useSafeAreaInsets();

    const [team, setTeam] = useState<TeamMember[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');

    const [modalVisible, setModalVisible] = useState(false);
    const [editingMember, setEditingMember] = useState<TeamMember | null>(null);
    const [formData, setFormData] = useState({ fullName: '', email: '', role: 'staff', password: '' });

    const fetchTeam = async () => {
        try {
            const res = await api.get('/team');
            setTeam(res.data);
        } catch (error: any) {
            showAlert('Error', error.response?.data?.error || 'Failed to fetch team members');
        } finally {
            setLoading(false);
        }
    };

    const openModal = (member?: TeamMember) => {
        if (member) {
            setEditingMember(member);
            setFormData({ fullName: member.fullName, email: member.email, role: member.role, password: '' });
        } else {
            setEditingMember(null);
            setFormData({ fullName: '', email: '', role: 'staff', password: '' });
        }
        setModalVisible(true);
    };

    useEffect(() => {
        fetchTeam();
    }, []);

    useEffect(() => {
        if (params.action === 'add') {
            openModal();
            // Clear the param so it doesn't keep opening on subsequent renders if we close it
            router.setParams({ action: undefined });
        }
    }, [params.action]);

    const filteredTeam = useMemo(() => {
        if (!searchQuery) return team;
        const lowerQ = searchQuery.toLowerCase();
        return team.filter(m =>
            m.fullName.toLowerCase().includes(lowerQ) ||
            m.email.toLowerCase().includes(lowerQ) ||
            m.role.toLowerCase().includes(lowerQ)
        );
    }, [searchQuery, team]);

    const handleSave = async () => {
        if (!formData.fullName || !formData.email || !formData.role) {
            return showAlert('Error', 'Full Name, Email, and Role are required.');
        }

        try {
            if (editingMember) {
                await api.put(`/team/${editingMember.id}`, formData);
                showAlert('Success', 'Team member updated successfully.');
            } else {
                if (!formData.password) return showAlert('Error', 'Password is required for new team members.');
                await api.post('/team', formData);
                showAlert('Success', 'Team member added successfully.');
            }
            setModalVisible(false);
            fetchTeam();
        } catch (error: any) {
            showAlert('Error', error.response?.data?.error || 'Failed to save team member.');
        }
    };

    const handleDelete = (id: string) => {
        showAlert(
            'Confirm Delete',
            'Are you sure you want to remove this team member?',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await api.delete(`/team/${id}`);
                            showAlert('Success', 'Team member removed.');
                            fetchTeam();
                        } catch (error: any) {
                            showAlert('Error', error.response?.data?.error || 'Failed to delete team member.');
                        }
                    }
                }
            ]
        );
    };

    // openModal is declared above

    const isUserOwner = isOwner(user);

    const renderItem = ({ item }: { item: TeamMember }) => (
        <View style={styles.card}>
            <View style={styles.cardHeader}>
                <View style={styles.avatar}>
                    <AppText style={styles.avatarText}>{item.fullName.charAt(0).toUpperCase()}</AppText>
                </View>
                <View style={styles.infoBlock}>
                    <AppText style={styles.name}>{item.fullName}</AppText>
                    <AppText style={styles.email}>{item.email}</AppText>
                    <View style={styles.roleBadge}>
                        <AppText style={styles.roleText}>{ROLE_LABELS[item.role] || item.role}</AppText>
                    </View>
                </View>
                <View style={styles.actions}>
                    {/* Wardens cannot edit/delete Owners */}
                    {(isUserOwner || item.role !== 'owner') && (
                        <>
                            <TouchableOpacity style={styles.actionBtn} onPress={() => openModal(item)}>
                                <MaterialCommunityIcons name="pencil" size={20} color={colors.primary} />
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.actionBtn} onPress={() => handleDelete(item.id)}>
                                <MaterialCommunityIcons name="delete" size={20} color="#EF4444" />
                            </TouchableOpacity>
                        </>
                    )}
                </View>
            </View>
        </View>
    );

    const styles = React.useMemo(() => StyleSheet.create({
        container: { flex: 1, backgroundColor: colors.background },
        header: {
            paddingBottom: 20,
            paddingHorizontal: 16,
            borderBottomLeftRadius: 30,
            borderBottomRightRadius: 30,
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.1,
            shadowRadius: 10,
            elevation: 8,
        },
        headerRow: {
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
        },
        backBtn: {
            width: 44,
            height: 44,
            backgroundColor: 'rgba(255,255,255,0.15)',
            borderRadius: 22,
            justifyContent: 'center',
            alignItems: 'center',
        },
        headerTitle: {
            fontSize: 20,
            fontWeight: '800',
            color: '#fff',
            letterSpacing: 0.5,
            textAlign: 'center',
        },
        searchContainer: {
            flexDirection: 'row',
            alignItems: 'center',
            backgroundColor: 'rgba(255,255,255,0.15)',
            borderRadius: 16,
            paddingHorizontal: 16,
            height: 48,
            marginTop: 16,
        },
        searchInput: { flex: 1, color: '#fff', fontSize: 16 },
        content: { paddingHorizontal: 20, paddingBottom: 40, paddingTop: 20 },
        card: {
            backgroundColor: colors.card, borderRadius: 16, padding: 16, marginBottom: 16,
            borderWidth: 1, borderColor: colors.border,
        },
        cardHeader: { flexDirection: 'row', alignItems: 'center' },
        avatar: {
            width: 48, height: 48, borderRadius: 24, backgroundColor: colors.primary + '20',
            justifyContent: 'center', alignItems: 'center', marginRight: 16,
        },
        avatarText: { fontSize: 20, fontWeight: '700', color: colors.primary },
        infoBlock: { flex: 1 },
        name: { fontSize: 16, fontWeight: '700', color: colors.text },
        email: { fontSize: 14, color: colors.textSecondary, marginTop: 2 },
        roleBadge: {
            backgroundColor: colors.primary + '15', alignSelf: 'flex-start',
            paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8, marginTop: 6,
        },
        roleText: { fontSize: 12, fontWeight: '600', color: colors.primary },
        actions: { flexDirection: 'row', gap: 12 },
        actionBtn: { padding: 8, backgroundColor: colors.background, borderRadius: 8 },
        emptyState: { alignItems: 'center', paddingTop: 60 },
        emptyText: { color: colors.textSecondary, marginTop: 12, fontSize: 15 },
        // Modal Styles
        modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
        modalContent: {
            backgroundColor: colors.card, borderTopLeftRadius: 24, borderTopRightRadius: 24,
            padding: 24, maxHeight: '90%',
        },
        modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
        modalTitle: { fontSize: 20, fontWeight: '700', color: colors.text },
        inputLabel: { fontSize: 14, fontWeight: '600', color: colors.textSecondary, marginBottom: 8, marginTop: 16 },
        input: {
            backgroundColor: colors.background, borderWidth: 1, borderColor: colors.border,
            borderRadius: 12, padding: 16, fontSize: 16, color: colors.text,
        },
        rolesContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 8 },
        roleChip: {
            paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20,
            borderWidth: 1, borderColor: colors.border, backgroundColor: colors.background,
        },
        roleChipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
        roleChipText: { fontSize: 14, color: colors.text },
        roleChipTextActive: { color: '#fff', fontWeight: '600' },
        saveBtn: {
            backgroundColor: colors.primary, borderRadius: 16, padding: 16,
            alignItems: 'center', marginTop: 32,
        },
        saveBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
    }), [colors, theme]);

    // Available roles to assign (Warden cannot assign owner)
    const assignableRoles = isUserOwner ? ROLES : ROLES.filter(r => r !== 'owner');

    return (
        <View style={styles.container}>
            <LinearGradient colors={['#1e3c72', '#2a5298']} style={[styles.header, { paddingTop: insets.top + 10 }]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
                <View style={styles.headerRow}>
                    <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                        <MaterialCommunityIcons name="chevron-left" size={32} color="#fff" />
                    </TouchableOpacity>
                    <AppText style={styles.headerTitle}>Team Management</AppText>
                    <TouchableOpacity onPress={() => openModal()} style={styles.backBtn}>
                        <MaterialCommunityIcons name="plus" size={24} color="#fff" />
                    </TouchableOpacity>
                </View>
                <View style={styles.searchContainer}>
                    <MaterialCommunityIcons name="magnify" size={22} color="rgba(255,255,255,0.7)" style={{ marginRight: 8 }} />
                    <TextInput
                        style={styles.searchInput}
                        placeholder="Search by name, email or role..."
                        placeholderTextColor="rgba(255,255,255,0.5)"
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                    />
                    {searchQuery.length > 0 && (
                        <TouchableOpacity onPress={() => setSearchQuery('')}>
                            <MaterialCommunityIcons name="close-circle" size={20} color="rgba(255,255,255,0.7)" />
                        </TouchableOpacity>
                    )}
                </View>
            </LinearGradient>

            <FlatList
                style={{ flex: 1 }}
                data={filteredTeam}
                renderItem={renderItem}
                keyExtractor={item => item.id}
                contentContainerStyle={styles.content}
                showsVerticalScrollIndicator={false}
                ListEmptyComponent={
                    !loading ? (
                        <View style={styles.emptyState}>
                            <MaterialCommunityIcons name="account-group-outline" size={48} color={colors.textSecondary} />
                            <AppText style={styles.emptyText}>No team members found</AppText>
                        </View>
                    ) : null
                }
            />

            <Modal visible={modalVisible} transparent animationType="slide" onRequestClose={() => setModalVisible(false)}>
                <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <AppText style={styles.modalTitle}>{editingMember ? 'Edit Team Member' : 'Add Team Member'}</AppText>
                            <TouchableOpacity onPress={() => setModalVisible(false)}>
                                <MaterialCommunityIcons name="close" size={24} color={colors.textSecondary} />
                            </TouchableOpacity>
                        </View>

                        <ScrollView showsVerticalScrollIndicator={false}>
                            <AppText style={styles.inputLabel}>Full Name</AppText>
                            <TextInput
                                style={styles.input}
                                placeholder="Enter full name"
                                placeholderTextColor={colors.textSecondary}
                                value={formData.fullName}
                                onChangeText={t => setFormData({ ...formData, fullName: t })}
                            />

                            <AppText style={styles.inputLabel}>Email Address</AppText>
                            <TextInput
                                style={styles.input}
                                placeholder="Enter email"
                                keyboardType="email-address"
                                autoCapitalize="none"
                                placeholderTextColor={colors.textSecondary}
                                value={formData.email}
                                onChangeText={t => setFormData({ ...formData, email: t })}
                            />

                            <AppText style={styles.inputLabel}>Role</AppText>
                            <View style={styles.rolesContainer}>
                                {assignableRoles.map(role => (
                                    <TouchableOpacity
                                        key={role}
                                        style={[styles.roleChip, formData.role === role && styles.roleChipActive]}
                                        onPress={() => setFormData({ ...formData, role })}
                                    >
                                        <AppText style={[styles.roleChipText, formData.role === role && styles.roleChipTextActive]}>
                                            {ROLE_LABELS[role] || role}
                                        </AppText>
                                    </TouchableOpacity>
                                ))}
                            </View>

                            <AppText style={styles.inputLabel}>
                                {editingMember ? 'New Password (Optional)' : 'Password'}
                            </AppText>
                            <TextInput
                                style={styles.input}
                                placeholder="Enter password"
                                secureTextEntry
                                placeholderTextColor={colors.textSecondary}
                                value={formData.password}
                                onChangeText={t => setFormData({ ...formData, password: t })}
                            />

                            <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
                                <AppText style={styles.saveBtnText}>Save Team Member</AppText>
                            </TouchableOpacity>
                            <View style={{ height: insets.bottom + 20 }} />
                        </ScrollView>
                    </View>
                </KeyboardAvoidingView>
            </Modal>
        </View>
    );
}
