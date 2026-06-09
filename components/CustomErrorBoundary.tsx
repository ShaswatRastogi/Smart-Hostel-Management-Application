import { MaterialCommunityIcons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { useRouter } from 'expo-router';
import React from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AppText from './AppText';

export function CustomErrorBoundary({ error, retry }: { error: Error; retry: () => void }) {
    const insets = useSafeAreaInsets();
    const router = useRouter();

    return (
        <View style={styles.container}>
            <BlurView intensity={100} tint="dark" style={styles.blurContainer}>
                <View style={[styles.content, { marginTop: insets.top }]}>
                    <MaterialCommunityIcons name="alert-circle-outline" size={80} color="#FF6B6B" />
                    
                    <AppText style={styles.title}>Oops! Something went wrong.</AppText>
                    
                    <AppText style={styles.message}>
                        The app encountered an unexpected error. We've logged the issue and are looking into it.
                    </AppText>
                    
                    {__DEV__ && (
                        <View style={styles.devErrorBox}>
                            <AppText style={styles.devErrorText}>{error.message}</AppText>
                        </View>
                    )}

                    <View style={styles.buttonContainer}>
                        <TouchableOpacity style={styles.primaryButton} onPress={retry} activeOpacity={0.8}>
                            <AppText style={styles.primaryButtonText}>Try Again</AppText>
                        </TouchableOpacity>
                        
                        <TouchableOpacity 
                            style={styles.secondaryButton} 
                            onPress={() => {
                                // Fallback to go home safely if retry doesn't work
                                router.replace('/(tabs)/');
                            }} 
                            activeOpacity={0.8}
                        >
                            <AppText style={styles.secondaryButtonText}>Go to Home</AppText>
                        </TouchableOpacity>
                    </View>
                </View>
            </BlurView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#0A0A0A',
    },
    blurContainer: {
        flex: 1,
    },
    content: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        padding: 30,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#FFFFFF',
        marginTop: 20,
        marginBottom: 10,
        textAlign: 'center',
    },
    message: {
        fontSize: 16,
        color: 'rgba(255,255,255,0.7)',
        textAlign: 'center',
        marginBottom: 30,
        lineHeight: 24,
    },
    devErrorBox: {
        backgroundColor: 'rgba(255,107,107,0.1)',
        padding: 15,
        borderRadius: 10,
        borderWidth: 1,
        borderColor: 'rgba(255,107,107,0.3)',
        marginBottom: 30,
        width: '100%',
    },
    devErrorText: {
        color: '#FF6B6B',
        fontSize: 12,
        fontFamily: 'monospace',
    },
    buttonContainer: {
        width: '100%',
        gap: 15,
    },
    primaryButton: {
        backgroundColor: '#FFFFFF',
        paddingVertical: 16,
        borderRadius: 12,
        alignItems: 'center',
    },
    primaryButtonText: {
        color: '#0A0A0A',
        fontSize: 16,
        fontWeight: 'bold',
    },
    secondaryButton: {
        backgroundColor: 'transparent',
        paddingVertical: 16,
        borderRadius: 12,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.2)',
    },
    secondaryButtonText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '600',
    },
});
