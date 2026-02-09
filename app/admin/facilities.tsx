import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { Stack, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Image,
    KeyboardAvoidingView,
    Modal,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import DraggableFlatList, { RenderItemParams, ScaleDecorator } from 'react-native-draggable-flatlist';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import EditFooterModal from '../../components/EditFooterModal';
import EditHostelInfoModal from '../../components/EditHostelInfoModal';
import InputField from '../../components/InputField';
import ScreenHeader from '../../components/ScreenHeader';
import { useTheme } from '../../utils/ThemeContext';
import {
    addFacility,
    deleteFacility,
    Facility,
    getAllFacilities,
    reorderFacilities,
    updateFacility,
} from '../../utils/facilityUtils';
import { getHostelInfo, HostelInfo } from '../../utils/hostelUtils';

const MemoizedFacilityItem = React.memo(({ item, drag, isActive, handleEdit, handleDelete, colors, isDark, styles }: any) => {
    return (
        <ScaleDecorator activeScale={1.03}>
            <TouchableOpacity
                onLongPress={drag}
                disabled={isActive}
                activeOpacity={1}
                style={[
                    styles.card,
                    isActive && {
                        borderColor: colors.primary,
                        borderWidth: 2,
                        shadowColor: "#000",
                        shadowOffset: { width: 0, height: 4 },
                        shadowOpacity: 0.2,
                        shadowRadius: 8,
                        elevation: 6,
                        opacity: 0.95,
                        backgroundColor: isDark ? '#334155' : '#F8FAFC'
                    }
                ]}
            >
                {item.image_url && (
                    <Image source={{ uri: item.image_url }} style={styles.cardImage} resizeMode="cover" />
                )}
                <View style={styles.cardContent}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <Text style={styles.cardTitle}>{item.title}</Text>
                        <MaterialCommunityIcons name="drag" size={24} color={colors.textSecondary} />
                    </View>
                    <Text style={styles.cardDesc} numberOfLines={3}>
                        {item.description}
                    </Text>
                </View>
                <View style={styles.cardActions}>
                    <TouchableOpacity onPress={() => handleEdit(item)}>
                        <MaterialCommunityIcons name="pencil" size={20} color={colors.primary} />
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => handleDelete(item.id)}>
                        <MaterialCommunityIcons name="delete" size={20} color="#EF4444" />
                    </TouchableOpacity>
                </View>
            </TouchableOpacity>
        </ScaleDecorator>
    );
});

export default function ManageFacilities() {
    const { colors, isDark } = useTheme();
    const router = useRouter();
    const [facilities, setFacilities] = useState<Facility[]>([]);
    const [loading, setLoading] = useState(true);
    const [hostelInfo, setHostelInfo] = useState<HostelInfo | null>(null);

    // Facility Modal State
    const [modalVisible, setModalVisible] = useState(false);
    const [editingFacility, setEditingFacility] = useState<Facility | null>(null);
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [image, setImage] = useState<string | null>(null);
    const [saving, setSaving] = useState(false);

    // Hostel Info Modal State
    const [infoModalVisible, setInfoModalVisible] = useState(false);

    // Footer Modal State

    // Footer Modal State
    const [footerModalVisible, setFooterModalVisible] = useState(false);

    // Delete Confirmation Modal State
    const [deleteModalVisible, setDeleteModalVisible] = useState(false);
    const [facilityToDelete, setFacilityToDelete] = useState<number | null>(null);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = React.useCallback(async (silent = false) => {
        if (!silent) setLoading(true);
        try {
            const [facilitiesData, infoData] = await Promise.all([
                getAllFacilities(),
                getHostelInfo()
            ]);
            setFacilities(facilitiesData);
            setHostelInfo(infoData);
        } catch (error) {
            Alert.alert('Error', 'Failed to load data');
        } finally {
            if (!silent) setLoading(false);
        }
    }, []);

    const handleAdd = React.useCallback(() => {
        setEditingFacility(null);
        setTitle('');
        setDescription('');
        setImage(null);
        setModalVisible(true);
    }, []);

    const handleEdit = React.useCallback((facility: Facility) => {
        setEditingFacility(facility);
        setTitle(facility.title);
        setDescription(facility.description);
        setImage(facility.image_url || null);
        setModalVisible(true);
    }, []);

    const handleDelete = React.useCallback((id: number) => {
        setFacilityToDelete(id);
        setDeleteModalVisible(true);
    }, []);

    const confirmDelete = React.useCallback(async () => {
        if (facilityToDelete === null) return;

        try {
            await deleteFacility(facilityToDelete);
            setDeleteModalVisible(false);
            setFacilityToDelete(null);
            loadData(true);
        } catch (error) {
            Alert.alert('Error', 'Failed to delete facility');
        }
    }, [facilityToDelete, loadData]);

    const pickImage = React.useCallback(async () => {
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [4, 3],
            quality: 0.5,
            base64: true,
        });

        if (!result.canceled) {
            const uri = `data:image/jpeg;base64,${result.assets[0].base64}`;
            setImage(uri);
        }
    }, []);

    const handleSave = React.useCallback(async () => {
        if (!title.trim() || !description.trim()) {
            Alert.alert('Error', 'Title and Description are required');
            return;
        }

        setSaving(true);
        try {
            const facilityData = {
                title,
                description,
                image_url: image || undefined,
            };

            if (editingFacility) {
                await updateFacility(editingFacility.id, facilityData);
            } else {
                await addFacility(facilityData);
            }
            setModalVisible(false);
            loadData(true);
        } catch (error) {
            Alert.alert('Error', 'Failed to save facility');
        } finally {
            setSaving(false);
        }
    }, [title, description, image, editingFacility, loadData]);

    const handleEditInfo = React.useCallback(() => {
        setInfoModalVisible(true);
    }, []);

    const handleCloseInfo = React.useCallback(() => {
        setInfoModalVisible(false);
    }, []);

    const handleSuccessInfo = React.useCallback(() => {
        loadData(true);
    }, [loadData]);



    const styles = React.useMemo(() => StyleSheet.create({
        container: {
            flex: 1,
            backgroundColor: colors.background,
        },
        list: {
            padding: 20,
            paddingBottom: 80,
        },
        hostelInfoCard: {
            backgroundColor: colors.card,
            borderRadius: 16,
            padding: 16,
            marginBottom: 24,
            borderWidth: 1,
            borderColor: colors.border,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between'
        },
        infoTextContainer: {
            flex: 1,
            marginRight: 12
        },
        infoTitle: {
            fontSize: 18,
            fontWeight: '700',
            color: colors.text,
            marginBottom: 4
        },
        infoSubtitle: {
            fontSize: 13,
            color: colors.textSecondary
        },
        editInfoBtn: {
            backgroundColor: colors.primary + '20',
            paddingHorizontal: 12,
            paddingVertical: 8,
            borderRadius: 8,
        },
        editInfoText: {
            color: colors.primary,
            fontWeight: '600',
            fontSize: 12
        },
        card: {
            backgroundColor: colors.card,
            borderRadius: 16,
            marginBottom: 20,
            overflow: 'hidden',
            borderWidth: 1,
            borderColor: colors.border,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.1,
            shadowRadius: 8,
            elevation: 3,
        },
        cardImage: {
            width: '100%',
            height: 200,
            backgroundColor: isDark ? '#1E293B' : '#E2E8F0',
        },
        cardContent: {
            padding: 16,
        },
        cardTitle: {
            fontSize: 18,
            fontWeight: '700',
            color: colors.text,
            marginBottom: 8,
        },
        cardDesc: {
            fontSize: 14,
            color: colors.textSecondary,
            lineHeight: 20,
        },
        cardActions: {
            flexDirection: 'row',
            justifyContent: 'flex-end',
            padding: 12,
            borderTopWidth: 1,
            borderTopColor: colors.border,
            gap: 12,
        },
        fab: {
            position: 'absolute',
            bottom: 24,
            right: 24,
            backgroundColor: colors.primary,
            width: 56,
            height: 56,
            borderRadius: 28,
            alignItems: 'center',
            justifyContent: 'center',
            elevation: 5,
            shadowColor: colors.primary,
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.3,
            shadowRadius: 8,
        },
        // Modal
        modalContainer: {
            flex: 1,
            justifyContent: 'flex-end',
            backgroundColor: 'rgba(0,0,0,0.5)',
        },
        modalContent: {
            backgroundColor: colors.card,
            borderTopLeftRadius: 24,
            borderTopRightRadius: 24,
            padding: 24,
            maxHeight: '90%',
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
        imagePicker: {
            width: '100%',
            height: 200,
            backgroundColor: isDark ? '#1E293B' : '#F1F5F9',
            borderRadius: 12,
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: 20,
            overflow: 'hidden',
            borderWidth: 1,
            borderColor: colors.border,
            borderStyle: 'dashed',
        },
        imagePreview: {
            width: '100%',
            height: '100%',
        },
        imagePlaceholder: {
            alignItems: 'center',
            gap: 8,
        },
        imagePlaceholderText: {
            color: colors.textSecondary,
            fontWeight: '600',
        },
        submitBtn: {
            backgroundColor: colors.primary,
            paddingVertical: 16,
            borderRadius: 16,
            alignItems: 'center',
            marginTop: 24,
        },
        submitBtnText: {
            color: '#fff',
            fontSize: 16,
            fontWeight: '700',
        },
        label: {
            fontSize: 14,
            fontWeight: '600',
            color: colors.textSecondary,
            marginBottom: 8,
            marginTop: 16,
        },
        // Delete Modal Styles
        deleteModalOverlay: {
            flex: 1,
            backgroundColor: 'rgba(0,0,0,0.6)',
            justifyContent: 'center',
            alignItems: 'center',
            padding: 20,
        },
        deleteModalContent: {
            width: '100%',
            maxWidth: 400,
            borderRadius: 24,
            padding: 24,
            alignItems: 'center',
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 10 },
            shadowOpacity: 0.3,
            shadowRadius: 20,
            elevation: 10,
        },
        deleteIconContainer: {
            width: 80,
            height: 80,
            borderRadius: 40,
            justifyContent: 'center',
            alignItems: 'center',
            marginBottom: 20,
        },
        deleteModalTitle: {
            fontSize: 22,
            fontWeight: '800',
            marginBottom: 12,
            textAlign: 'center',
        },
        deleteModalMessage: {
            fontSize: 15,
            textAlign: 'center',
            lineHeight: 22,
            marginBottom: 24,
        },
        deleteModalButtons: {
            flexDirection: 'row',
            gap: 12,
            width: '100%',
        },
        deleteModalBtn: {
            flex: 1,
            paddingVertical: 14,
            borderRadius: 16,
            alignItems: 'center',
            justifyContent: 'center',
            flexDirection: 'row',
            gap: 8,
        },
        cancelBtn: {
            borderWidth: 1,
            borderColor: colors.border,
        },
        cancelBtnText: {
            fontSize: 16,
            fontWeight: '700',
        },
        deleteBtn: {
            backgroundColor: '#EF4444',
        },
        deleteBtnText: {
            fontSize: 16,
            fontWeight: '700',
            color: '#fff',
        },
    }), [colors, isDark]);

    const renderItem = React.useCallback(({ item, drag, isActive }: RenderItemParams<Facility>) => {
        return (
            <MemoizedFacilityItem
                item={item}
                drag={drag}
                isActive={isActive}
                handleEdit={handleEdit}
                handleDelete={handleDelete}
                colors={colors}
                isDark={isDark}
                styles={styles}
            />
        );
    }, [handleEdit, handleDelete, colors, isDark, styles]);

    return (
        <GestureHandlerRootView style={styles.container}>
            <Stack.Screen options={{ headerShown: false }} />
            <ScreenHeader
                title="Manage Facilities"
            />
            <View style={{ paddingHorizontal: 20, paddingVertical: 8, alignItems: 'center' }}>
                <Text style={{ fontSize: 12, color: colors.textSecondary }}>
                    <MaterialCommunityIcons name="gesture-tap-hold" size={12} /> Long press a card to reorder
                </Text>
            </View>

            {loading ? (
                <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                    <ActivityIndicator size="large" color={colors.primary} />
                </View>
            ) : (
                <DraggableFlatList
                    data={facilities}
                    onDragEnd={({ data }) => {
                        setFacilities(data);
                        const orderedIds = data.map(f => f.id);
                        reorderFacilities(orderedIds).catch(() => {
                            loadData(true);
                        });
                    }}
                    keyExtractor={(item) => item.id.toString()}
                    contentContainerStyle={styles.list}
                    containerStyle={{ flex: 1 }}
                    ListHeaderComponent={
                        <View style={styles.hostelInfoCard}>
                            <View style={styles.infoTextContainer}>
                                <Text style={styles.infoTitle}>{hostelInfo?.name || 'Smart Hostel'}</Text>
                                {hostelInfo?.location && (
                                    <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
                                        <MaterialCommunityIcons name="map-marker" size={14} color={colors.primary} style={{ marginRight: 4 }} />
                                        <Text style={{ fontSize: 13, color: colors.textSecondary }}>{hostelInfo.location}</Text>
                                    </View>
                                )}
                                <Text style={styles.infoSubtitle} numberOfLines={2}>{hostelInfo?.description || 'No description set'}</Text>
                            </View>
                            <TouchableOpacity style={styles.editInfoBtn} onPress={handleEditInfo}>
                                <Text style={styles.editInfoText}>Edit</Text>
                            </TouchableOpacity>
                        </View>
                    }
                    renderItem={renderItem}
                    ListEmptyComponent={
                        <View style={{ alignItems: 'center', marginTop: 50 }}>
                            <Text style={{ color: colors.textSecondary }}>No facilities added yet.</Text>
                        </View>
                    }
                    ListFooterComponent={
                        <View style={{ padding: 20, paddingBottom: 40 }}>
                            <View style={styles.hostelInfoCard}>
                                <View style={styles.infoTextContainer}>
                                    <Text style={styles.infoTitle}>Footer Note</Text>
                                    <Text style={styles.infoSubtitle} numberOfLines={2}>
                                        {hostelInfo?.footer_text || 'No footer note added.'}
                                    </Text>
                                </View>
                                <TouchableOpacity style={styles.editInfoBtn} onPress={() => setFooterModalVisible(true)}>
                                    <Text style={styles.editInfoText}>Edit</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    }
                />
            )}

            <TouchableOpacity style={styles.fab} onPress={handleAdd}>
                <MaterialCommunityIcons name="plus" size={24} color="#fff" />
            </TouchableOpacity>

            {/* Facility Modal */}
            <Modal visible={modalVisible} transparent animationType="slide" onRequestClose={() => setModalVisible(false)}>
                <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.modalContainer}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>{editingFacility ? 'Edit Facility' : 'Add Facility'}</Text>
                            <TouchableOpacity onPress={() => setModalVisible(false)}>
                                <MaterialCommunityIcons name="close" size={24} color={colors.text} />
                            </TouchableOpacity>
                        </View>

                        <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
                            <TouchableOpacity style={styles.imagePicker} onPress={pickImage}>
                                {image ? (
                                    <Image source={{ uri: image }} style={styles.imagePreview} resizeMode="cover" />
                                ) : (
                                    <View style={styles.imagePlaceholder}>
                                        <MaterialCommunityIcons name="camera-plus" size={32} color={colors.textSecondary} />
                                        <Text style={styles.imagePlaceholderText}>Add Photo</Text>
                                    </View>
                                )}
                            </TouchableOpacity>

                            <Text style={[styles.label, { marginTop: 0 }]}>Title</Text>
                            <InputField
                                placeholder="e.g. Modern Gym"
                                value={title}
                                onChangeText={setTitle}
                                icon="format-title"
                            />

                            <Text style={styles.label}>Description</Text>
                            <InputField
                                placeholder="Describe the facility..."
                                value={description}
                                onChangeText={setDescription}
                                icon="text-short"
                                multiline
                                numberOfLines={4}
                            />

                            <TouchableOpacity
                                style={[styles.submitBtn, saving && { opacity: 0.7 }]}
                                onPress={handleSave}
                                disabled={saving}
                            >
                                {saving ? (
                                    <ActivityIndicator color="#fff" />
                                ) : (
                                    <Text style={styles.submitBtnText}>{editingFacility ? 'Update' : 'Save'}</Text>
                                )}
                            </TouchableOpacity>
                            <View style={{ height: 20 }} />
                        </ScrollView>
                    </View>
                </KeyboardAvoidingView>
            </Modal>

            {/* Hostel Info Modal Component */}
            <EditHostelInfoModal
                visible={infoModalVisible}
                onClose={handleCloseInfo}
                hostelInfo={hostelInfo}
                onSuccess={handleSuccessInfo}
            />

            {/* Delete Confirmation Modal */}
            <Modal
                transparent
                animationType="fade"
                visible={deleteModalVisible}
                onRequestClose={() => setDeleteModalVisible(false)}
            >
                <View style={styles.deleteModalOverlay}>
                    <View style={[styles.deleteModalContent, { backgroundColor: colors.card }]}>
                        <View style={[styles.deleteIconContainer, { backgroundColor: isDark ? '#7f1d1d' : '#fee2e2' }]}>
                            <MaterialCommunityIcons name="delete-alert" size={40} color="#EF4444" />
                        </View>

                        <Text style={[styles.deleteModalTitle, { color: colors.text }]}>Delete Facility?</Text>
                        <Text style={[styles.deleteModalMessage, { color: colors.textSecondary }]}>
                            This action cannot be undone. The facility will be permanently removed from the list.
                        </Text>

                        <View style={styles.deleteModalButtons}>
                            <TouchableOpacity
                                style={[styles.deleteModalBtn, styles.cancelBtn, { backgroundColor: isDark ? '#334155' : '#F1F5F9' }]}
                                onPress={() => {
                                    setDeleteModalVisible(false);
                                    setFacilityToDelete(null);
                                }}
                            >
                                <Text style={[styles.cancelBtnText, { color: colors.text }]}>Cancel</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={[styles.deleteModalBtn, styles.deleteBtn]}
                                onPress={confirmDelete}
                            >
                                <MaterialCommunityIcons name="delete" size={18} color="#fff" />
                                <Text style={styles.deleteBtnText}>Delete</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>

            {/* Footer Modal */}
            <EditFooterModal
                visible={footerModalVisible}
                onClose={() => setFooterModalVisible(false)}
                currentFooterText={hostelInfo?.footer_text || ''}
                onSuccess={() => loadData(true)}
            />
        </GestureHandlerRootView >
    );
}
