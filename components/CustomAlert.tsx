import MaterialIcons from '@expo/vector-icons/MaterialCommunityIcons';
import React, { useEffect, useRef } from 'react';
import { Animated, Modal, StyleSheet, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
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
    onClose: () => void;
}

const CustomAlert: React.FC<CustomAlertProps> = ({
    visible,
    title,
    message,
    buttons = [],
    type = 'info',
    onClose,
}) => {
    const translateY = useRef(new Animated.Value(100)).current;
    const opacityValue = useRef(new Animated.Value(0)).current;
    const shadowShimmer = useRef(new Animated.Value(0)).current;
    const progressWidth = useRef(new Animated.Value(100)).current;
    const insets = useSafeAreaInsets();

    useEffect(() => {
        if (visible) {
            // Start shadow shimmer
            Animated.loop(
                Animated.sequence([
                    Animated.timing(shadowShimmer, {
                        toValue: 1,
                        duration: 1500,
                        useNativeDriver: false, // shadow properties require JS driver
                    }),
                    Animated.timing(shadowShimmer, {
                        toValue: 0,
                        duration: 1500,
                        useNativeDriver: false,
                    })
                ])
            ).start();

            // Auto-dismiss ONLY if no custom buttons are provided
            let timer: NodeJS.Timeout | null = null;
            if (!buttons || buttons.length === 0) {
                progressWidth.setValue(100);
                Animated.timing(progressWidth, {
                    toValue: 0,
                    duration: 3000,
                    useNativeDriver: false,
                }).start();

                timer = setTimeout(() => {
                    onClose();
                }, 3000);
            } else {
                progressWidth.setValue(0);
            }
            
            return () => {
                if (timer) clearTimeout(timer);
            };
        } else {
            shadowShimmer.setValue(0);
        }
    }, [visible, onClose, buttons]);

    const styles = React.useMemo(() => StyleSheet.create({
        overlay: {
            flex: 1,
            justifyContent: 'flex-end',
            alignItems: 'center',
            paddingBottom: Math.max(insets.bottom + 20, 40),
            zIndex: 1000,
        },
        alertContainer: {
            width: '90%',
            maxWidth: 400,
            backgroundColor: '#000000',
            borderRadius: 100, // Pill shape
            paddingHorizontal: 20,
            paddingVertical: 14,
            flexDirection: 'row',
            alignItems: 'center',
            borderWidth: 1,
            borderColor: '#222222',
            shadowColor: '#ffffff',
            shadowOffset: { width: 0, height: 0 },
            elevation: 10,
        },
        iconContainer: {
            marginRight: 12,
        },
        textContainer: {
            flex: 1,
            marginRight: 12,
        },
        title: {
            fontSize: 14,
            fontWeight: '700',
            color: '#ffffff',
            marginBottom: 2,
        },
        message: {
            fontSize: 13,
            color: '#888888',
            lineHeight: 18,
        },
        buttonContainer: {
            flexDirection: 'row',
            gap: 8,
        },
        button: {
            paddingHorizontal: 16,
            paddingVertical: 8,
            borderRadius: 20,
            justifyContent: 'center',
            alignItems: 'center',
        },
        buttonPrimary: {
            backgroundColor: '#ffffff',
        },
        buttonCancel: {
            backgroundColor: 'transparent',
            borderWidth: 1,
            borderColor: '#333333',
        },
        buttonDestructive: {
            backgroundColor: 'rgba(239,68,68,0.1)',
            borderWidth: 1,
            borderColor: 'rgba(239,68,68,0.3)',
        },
        textPrimary: {
            color: '#000000',
            fontWeight: '700',
            fontSize: 13,
        },
        textCancel: {
            color: '#888888',
            fontWeight: '600',
            fontSize: 13,
        },
        textDestructive: {
            color: '#EF4444',
            fontWeight: '700',
            fontSize: 13,
        },
        progressTrack: {
            height: 2,
            backgroundColor: '#222222',
            marginTop: 8,
            borderRadius: 2,
            overflow: 'hidden',
            width: '100%',
        },
        progressFill: {
            height: '100%',
            backgroundColor: '#ffffff',
        },
    }), [insets]);

    useEffect(() => {
        if (visible) {
            Animated.parallel([
                Animated.spring(translateY, {
                    toValue: 0,
                    friction: 8,
                    tension: 60,
                    useNativeDriver: true,
                }),
                Animated.timing(opacityValue, {
                    toValue: 1,
                    duration: 200,
                    useNativeDriver: true,
                }),
            ]).start();
        } else {
            Animated.parallel([
                Animated.timing(opacityValue, {
                    toValue: 0,
                    duration: 150,
                    useNativeDriver: true,
                }),
                Animated.timing(translateY, {
                    toValue: 20,
                    duration: 150,
                    useNativeDriver: true,
                }),
            ]).start();
        }
    }, [visible]);

    if (!visible) return null;

    const getIcon = () => {
        switch (type) {
            case 'success': return 'check-circle-outline';
            case 'error': return 'alert-circle-outline';
            case 'warning': return 'alert-outline';
            default: return 'information-outline';
        }
    };

    const actionButtons = buttons.length > 0 ? buttons : [{ text: 'OK', style: 'default', onPress: onClose }];

    const hasCustomButtons = buttons && buttons.length > 0;

    return (
        <Modal transparent visible={visible} animationType="none" onRequestClose={onClose}>
            <View 
                style={[styles.overlay, hasCustomButtons && { backgroundColor: 'rgba(0,0,0,0.5)' }]} 
                pointerEvents={hasCustomButtons ? 'auto' : 'box-none'}
            >
                <Animated.View style={{ 
                    transform: [{ translateY }], 
                    opacity: opacityValue,
                    width: '100%',
                    alignItems: 'center'
                }}>
                    <Animated.View style={[
                        styles.alertContainer,
                        { 
                            shadowOpacity: shadowShimmer.interpolate({
                                inputRange: [0, 1],
                                outputRange: [0.1, 0.4] 
                            }),
                            shadowRadius: shadowShimmer.interpolate({
                                inputRange: [0, 1],
                                outputRange: [6, 12]
                            })
                        }
                    ]}>
                        <View style={styles.iconContainer}>
                            <MaterialIcons name={getIcon()} size={24} color="#ffffff" />
                        </View>

                        <View style={styles.textContainer}>
                            <AppText style={styles.title} numberOfLines={1}>{title}</AppText>
                            <AppText style={styles.message} numberOfLines={2}>{message}</AppText>
                            
                            {/* Animated Progress Track */}
                            {!hasCustomButtons && (
                                <View style={styles.progressTrack}>
                                    <Animated.View 
                                        style={[
                                            styles.progressFill, 
                                            { width: progressWidth.interpolate({ inputRange: [0, 100], outputRange: ['0%', '100%'] }) }
                                        ]} 
                                    />
                                </View>
                            )}
                        </View>

                        <View style={styles.buttonContainer}>
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
                                            isPrimary && styles.buttonPrimary,
                                            isDestructive && styles.buttonDestructive,
                                        ]}
                                        onPress={() => {
                                            if (btn.onPress) btn.onPress();
                                            onClose();
                                        }}
                                        activeOpacity={0.7}
                                    >
                                        <AppText style={[
                                            isCancel && styles.textCancel,
                                            isPrimary && styles.textPrimary,
                                            isDestructive && styles.textDestructive
                                        ]}>
                                            {btn.text}
                                        </AppText>
                                    </TouchableOpacity>
                                );
                            })}
                        </View>
                    </Animated.View>
                </Animated.View>
            </View>
        </Modal>
    );
};

export default CustomAlert;
