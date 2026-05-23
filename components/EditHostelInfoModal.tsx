import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Image, KeyboardAvoidingView, Modal, Platform, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { useTheme } from '../utils/ThemeContext';
import { HostelInfo, updateHostelInfo } from '../utils/hostelUtils';
import InputField from './InputField';
import AppText from './AppText';

interface EditHostelInfoModalProps {
    visible: boolean;
    onClose: () => void;
    hostelInfo: HostelInfo | null;
    onSuccess: () => void;
}

function EditHostelInfoModal({ visible, onClose, hostelInfo, onSuccess }: EditHostelInfoModalProps) {
    const { colors, isDark } = useTheme();
    const [name, setName] = useState('');
    const [subtitle, setSubtitle] = useState('');
    const [location, setLocation] = useState('');
    const [description, setDescription] = useState('');
    const [footerText, setFooterText] = useState('');
    const [image, setImage] = useState<string | null>(null);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        if (visible && hostelInfo) {
            setName(hostelInfo.name);
            setSubtitle(hostelInfo.subtitle || '');
            setLocation(hostelInfo.location || '');
            setDescription(hostelInfo.description);
            setFooterText(hostelInfo.footer_text || '');
            setImage(hostelInfo.image_url || null);
        }
    }, [visible, hostelInfo]);

    const pickImage = async () => {
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [16, 9],
            quality: 0.5,
            base64: true,
        });

        if (!result.canceled) {
            setImage(`data:image/jpeg;base64,${result.assets[0].base64}`);
        }
    };

    const handleSave = async () => {
        if (!name.trim()) {
            Alert.alert('Error', 'Hostel Name is required');
            return;
        }

        setSaving(true);
        try {
            await updateHostelInfo({
                name,
                subtitle,
                location,
                description,
                footer_text: footerText,
                image_url: image || undefined
            });
            onSuccess();
            onClose();
        } catch (error) {
            Alert.alert('Error', 'Failed to update hostel info');
        } finally {
            setSaving(false);
        }
    };

    const styles = React.useMemo(() => StyleSheet.create({
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
    }), [colors, isDark]);

    return (
        <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
            <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.modalContainer}>
                <View style={styles.modalContent}>
                    <View style={styles.modalHeader}>
                        <AppText style={styles.modalTitle}>Edit Hostel Info</AppText>
                        <TouchableOpacity onPress={onClose}>
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
                                    <AppText style={styles.imagePlaceholderText}>Update Cover Photo</AppText>
                                </View>
                            )}
                        </TouchableOpacity>

                        <AppText style={[styles.label, { marginTop: 0 }]}>Hostel Name</AppText>
                        <InputField
                            placeholder="e.g. Smart Hostel"
                            value={name}
                            onChangeText={setName}
                            icon="home-city"
                        />

                        <AppText style={styles.label}>Subtitle</AppText>
                        <InputField
                            placeholder="e.g. Home Away From Home"
                            value={subtitle}
                            onChangeText={setSubtitle}
                            icon="subtitles"
                        />

                        <AppText style={styles.label}>Location</AppText>
                        <InputField
                            placeholder="e.g. 123, Hostel Lane, City"
                            value={location}
                            onChangeText={setLocation}
                            icon="map-marker"
                        />

                        <AppText style={styles.label}>About Description</AppText>
                        <InputField
                            placeholder="Write something about the hostel..."
                            value={description}
                            onChangeText={setDescription}
                            icon="text-short"
                            multiline
                            numberOfLines={6}
                        />

                        <TouchableOpacity
                            style={[styles.submitBtn, saving && { opacity: 0.7 }]}
                            onPress={handleSave}
                            disabled={saving}
                        >
                            {saving ? (
                                <ActivityIndicator color="#fff" />
                            ) : (
                                <AppText style={styles.submitBtnText}>Update Info</AppText>
                            )}
                        </TouchableOpacity>
                        <View style={{ height: 20 }} />
                    </ScrollView>
                </View>
            </KeyboardAvoidingView>
        </Modal>
    );
}

export default React.memo(EditHostelInfoModal);
