import { MaterialCommunityIcons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    KeyboardAvoidingView,
    Modal,
    Platform,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { useTheme } from '../utils/ThemeContext';
import { updateHostelInfo } from '../utils/hostelUtils';
import InputField from './InputField';

interface EditFooterModalProps {
    visible: boolean;
    onClose: () => void;
    currentFooterText: string;
    onSuccess: () => void;
}

export default function EditFooterModal({ visible, onClose, currentFooterText, onSuccess }: EditFooterModalProps) {
    const { colors, isDark } = useTheme();
    const [footerText, setFooterText] = useState('');
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        if (visible) {
            setFooterText(currentFooterText);
        }
    }, [visible, currentFooterText]);

    const handleSave = async () => {
        setSaving(true);
        try {
            await updateHostelInfo({
                footer_text: footerText
            });
            onSuccess();
            onClose();
        } catch (error) {
            Alert.alert('Error', 'Failed to update footer');
        } finally {
            setSaving(false);
        }
    };

    const styles = React.useMemo(() => StyleSheet.create({
        modalContainer: {
            flex: 1,
            justifyContent: 'center',
            backgroundColor: 'rgba(0,0,0,0.5)',
            padding: 20
        },
        modalContent: {
            backgroundColor: colors.card,
            borderRadius: 24,
            padding: 24,
            maxHeight: 'auto',
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
    }), [colors, isDark]);

    return (
        <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
            <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.modalContainer}>
                <View style={styles.modalContent}>
                    <View style={styles.modalHeader}>
                        <Text style={styles.modalTitle}>Edit Footer Note</Text>
                        <TouchableOpacity onPress={onClose}>
                            <MaterialCommunityIcons name="close" size={24} color={colors.text} />
                        </TouchableOpacity>
                    </View>

                    <Text style={{ color: colors.textSecondary, marginBottom: 16 }}>
                        This text will appear at the bottom of the facilities list for all users.
                    </Text>

                    <InputField
                        placeholder="e.g. Terms & Conditions, Contact: +91..."
                        value={footerText}
                        onChangeText={setFooterText}
                        icon="note-text"
                        multiline
                        numberOfLines={4}
                        autoFocus
                    />

                    <TouchableOpacity
                        style={[styles.submitBtn, saving && { opacity: 0.7 }]}
                        onPress={handleSave}
                        disabled={saving}
                    >
                        {saving ? (
                            <ActivityIndicator color="#fff" />
                        ) : (
                            <Text style={styles.submitBtnText}>Save Footer</Text>
                        )}
                    </TouchableOpacity>
                </View>
            </KeyboardAvoidingView>
        </Modal>
    );
}
