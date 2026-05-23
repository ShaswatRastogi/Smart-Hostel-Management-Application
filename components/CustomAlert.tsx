import MaterialIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useEffect, useRef } from 'react';
import { Animated, Modal, StyleSheet, TouchableOpacity, View } from 'react-native';
import { useTheme } from '../utils/ThemeContext';
import AppText from './AppText';

export type AlertButton = {
    text: string;
    style?: 'default' | 'cancel' | 'destructive';
    onPress?: () => void;
};

export type AlertType = 'success' | 'error' | 'warning' | 'info';

interface CustomAlertProps {
    visible: boolean;
    title: string;
    message: string;
    buttons?: AlertButton[];
    type?: AlertType;
    onClose: () => void; // Called when backdrop is pressed or standard close
}

const CustomAlert: React.FC<CustomAlertProps> = ({
    visible,
    title,
    message,
    buttons = [],
    type = 'info',
    onClose,
}) => {
    const { colors, theme } = useTheme();
    const scaleValue = useRef(new Animated.Value(0)).current;
    const opacityValue = useRef(new Animated.Value(0)).current;

    const styles = React.useMemo(() => StyleSheet.create({
        overlay: {
            flex: 1,
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 1000,
        },
        backdrop: {
            ...StyleSheet.absoluteFillObject,
            backgroundColor: 'rgba(0,0,0,0.5)',
        },
        alertContainer: {
            width: '85%',
            maxWidth: 340,
            backgroundColor: colors.card,
            borderRadius: 24,
            padding: 24,
            alignItems: 'center',
            shadowColor: '#000',
            shadowOffset: {
                width: 0,
                height: 10,
            },
            shadowOpacity: 0.25,
            shadowRadius: 20,
            elevation: 10,
        },
        iconContainer: {
            marginBottom: 16,
        },
        iconCircle: {
            width: 64,
            height: 64,
            borderRadius: 32,
            justifyContent: 'center',
            alignItems: 'center',
        },
        title: {
            fontSize: 20,
            fontWeight: '800',
            color: colors.text,
            textAlign: 'center',
            marginBottom: 8,
            letterSpacing: 0.5,
        },
        message: {
            fontSize: 15,
            color: colors.textSecondary,
            textAlign: 'center',
            marginBottom: 24,
            lineHeight: 22,
        },
        buttonContainer: {
            width: '100%',
            justifyContent: 'center',
        },
        button: {
            flex: 1,
            paddingVertical: 14,
            borderRadius: 14,
            justifyContent: 'center',
            alignItems: 'center',
            overflow: 'hidden', // for gradient
        },
        buttonPrimary: {
            backgroundColor: colors.primary, // fallback
        },
        buttonCancel: {
            backgroundColor: theme === 'dark' ? '#334155' : '#F1F5F9',
        },
        buttonDestructive: {
            backgroundColor: theme === 'dark' ? 'rgba(239, 68, 68, 0.2)' : '#FEF2F2',
            borderWidth: 1,
            borderColor: theme === 'dark' ? '#7F1D1D' : '#FAC7C7',
        },
        textPrimary: {
            color: '#fff',
            fontWeight: '700',
            fontSize: 15,
        },
        textCancel: {
            color: colors.textSecondary,
            fontWeight: '600',
            fontSize: 15,
        },
        textDestructive: {
            color: '#EF4444',
            fontWeight: '700',
            fontSize: 15,
        },
        buttonText: {
            color: colors.text,
            fontWeight: '600',
            fontSize: 15,
        },
    }), [colors, theme]);

    useEffect(() => {
        if (visible) {
            Animated.parallel([
                Animated.spring(scaleValue, {
                    toValue: 1,
                    friction: 6,
                    tension: 50,
                    useNativeDriver: true,
                }),
                Animated.timing(opacityValue, {
                    toValue: 1,
                    duration: 150,
                    useNativeDriver: true,
                }),
            ]).start();
        } else {
            Animated.timing(opacityValue, {
                toValue: 0,
                duration: 150,
                useNativeDriver: true,
            }).start();
            scaleValue.setValue(0);
        }
    }, [visible]);

    if (!visible) return null;

    const getIcon = () => {
        switch (type) {
            case 'success': return 'check-circle';
            case 'error': return 'alert-circle';
            case 'warning': return 'alert';
            default: return 'information';
        }
    };

    const getColor = () => {
        switch (type) {
            case 'success': return '#16A34A';
            case 'error': return '#EF4444';
            case 'warning': return '#F59E0B';
            default: return '#004e92';
        }
    };

    // If no buttons provided, show a default OK
    const actionButtons = buttons.length > 0 ? buttons : [{ text: 'OK', style: 'default', onPress: onClose }];

    return (
        <Modal transparent visible={visible} animationType="none" onRequestClose={onClose}>
            <View style={styles.overlay}>
                <Animated.View style={[styles.backdrop, { opacity: opacityValue }]} />

                <Animated.View style={[
                    styles.alertContainer,
                    { transform: [{ scale: scaleValue }], opacity: opacityValue }
                ]}>
                    <View style={styles.iconContainer}>
                        <View style={[styles.iconCircle, { backgroundColor: getColor() + '20' }]}>
                            <MaterialIcons name={getIcon()} size={32} color={getColor()} />
                        </View>
                    </View>

                    <AppText style={styles.title}>{title}</AppText>
                    <AppText style={styles.message}>{message}</AppText>

                    <View style={[
                        styles.buttonContainer,
                        actionButtons.length > 2 ? { flexDirection: 'column', gap: 12 } : { flexDirection: 'row', gap: 12 }
                    ]}>
                        {actionButtons.map((btn, index) => {
                            const isCancel = btn.style === 'cancel';
                            const isDestructive = btn.style === 'destructive';
                            const isPrimary = !isCancel && !isDestructive;

                            return (
                                <TouchableOpacity
                                    key={index}
                                    style={[
                                        styles.button,
                                        isCancel && styles.buttonCancel,
                                        isDestructive && styles.buttonDestructive,
                                        isPrimary && styles.buttonPrimary,
                                        actionButtons.length > 2 && { width: '100%' }
                                    ]}
                                    onPress={() => {
                                        if (btn.onPress) btn.onPress();
                                        onClose();
                                    }}
                                >
                                    {isPrimary ? (
                                        <LinearGradient
                                            colors={['#004e92', '#000428']}
                                            style={StyleSheet.absoluteFillObject}
                                            start={{ x: 0, y: 0 }}
                                            end={{ x: 1, y: 0 }}
                                        />
                                    ) : null}
                                    <AppText style={[
                                        styles.buttonText,
                                        isCancel && styles.textCancel,
                                        isDestructive && styles.textDestructive,
                                        isPrimary && styles.textPrimary
                                    ]}>
                                        {btn.text}
                                    </AppText>
                                </TouchableOpacity>
                            );
                        })}
                    </View>
                </Animated.View>
            </View>
        </Modal>
    );
};



export default CustomAlert;
