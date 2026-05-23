import MaterialIcons from '@expo/vector-icons/MaterialCommunityIcons';
import React, { useState } from 'react';
import { StyleSheet, TextInput, View } from 'react-native';
import { useTheme } from '../utils/ThemeContext';
import AppText from './AppText';

const InputField = React.memo(({
    label,
    icon,
    value,
    onChangeText,
    placeholder,
    keyboardType = 'default',
    required = false,
    hasSubmitted,
    ...props
}: any) => {
    const { colors, theme } = useTheme();
    const [isFocused, setIsFocused] = useState(false);

    const styles = React.useMemo(() => StyleSheet.create({
        inputContainer: {
            marginBottom: 16,
        },
        label: {
            fontSize: 13,
            fontWeight: '600',
            color: colors.textSecondary,
            marginBottom: 8,
            marginLeft: 4,
        },
        inputWrapper: {
            flexDirection: 'row',
            alignItems: 'center',
            backgroundColor: theme === 'dark' ? '#1E293B' : '#F8FAFC',
            borderRadius: 16,
            borderWidth: 1.5,
            borderColor: colors.border,
            height: props.multiline ? 120 : 56, // Adjust height for multiline
            paddingHorizontal: 16,
            paddingVertical: props.multiline ? 12 : 0, // Add padding for multiline
        },
        inputWrapperFocused: {
            borderColor: colors.primary,
            backgroundColor: theme === 'dark' ? 'rgba(59, 130, 246, 0.1)' : '#F0F9FF',
        },
        inputIcon: {
            marginRight: 10,
        },
        input: {
            flex: 1,
            fontSize: 15,
            color: colors.text,
            height: '100%',
            textAlignVertical: props.multiline ? 'top' : 'center', // Align text for multiline
        },
        errorText: {
            color: '#EF4444',
            fontSize: 12,
            marginTop: 4,
            marginLeft: 4,
        },
    }), [colors, theme, props.multiline]);

    return (
        <View style={styles.inputContainer}>
            {label && (
                <AppText style={[
                    styles.label,
                    isFocused && { color: colors.primary }
                ]}>
                    {label} {required && <AppText style={{ color: '#EF4444' }}>*</AppText>}
                </AppText>
            )}
            <View style={[
                styles.inputWrapper,
                isFocused && styles.inputWrapperFocused,
                hasSubmitted && required && !value && { borderColor: '#EF4444', borderWidth: 1 }
            ]}>
                <MaterialIcons
                    name={icon}
                    size={20}
                    color={isFocused ? colors.primary : colors.textSecondary}
                    style={[styles.inputIcon, props.multiline && { alignSelf: 'flex-start', marginTop: 4 }]} // Align icon for multiline
                />
                <TextInput
                    style={styles.input}
                    placeholder={placeholder}
                    placeholderTextColor="#94A3B8"
                    value={value}
                    onChangeText={onChangeText}
                    keyboardType={keyboardType}
                    autoCapitalize="none"
                    onFocus={() => setIsFocused(true)}
                    onBlur={() => setIsFocused(false)}
                    {...props}
                />
            </View>
            {hasSubmitted && required && !value && (
                <AppText style={styles.errorText}>{label || 'This field'} is required</AppText>
            )}
        </View>
    );
});



export default InputField;
