import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';

export interface AccessibilityState {
    fontSize: string;
    fontScale: number;
    reduceMotion: boolean;
    hapticFeedback: boolean;
    highContrast: boolean;
    boldText: boolean;
    isLoaded: boolean;

    setFontSize: (size: string) => Promise<void>;
    setReduceMotion: (value: boolean) => Promise<void>;
    setHapticFeedback: (value: boolean) => Promise<void>;
    setHighContrast: (value: boolean) => Promise<void>;
    setBoldText: (value: boolean) => Promise<void>;
    loadSettings: (userId?: string) => Promise<void>;
    resetSettings: () => Promise<void>;
}

const getFontScale = (size: string): number => {
    switch (size) {
        case 'small': return 0.85;
        case 'large': return 1.15;
        case 'extra-large': return 1.3;
        case 'default':
        default: return 1.0;
    }
};

export const useAccessibilityStore = create<AccessibilityState>((set, get) => ({
    fontSize: 'default',
    fontScale: 1.0,
    reduceMotion: false,
    hapticFeedback: true,
    highContrast: false,
    boldText: false,
    isLoaded: false,

    setFontSize: async (size: string) => {
        set({ fontSize: size, fontScale: getFontScale(size) });
        const userId = await getUserId();
        const key = userId ? `font_size_${userId}` : 'font_size';
        await AsyncStorage.setItem(key, size);
    },

    setReduceMotion: async (value: boolean) => {
        set({ reduceMotion: value });
        const userId = await getUserId();
        const key = userId ? `reduce_motion_${userId}` : 'reduce_motion';
        await AsyncStorage.setItem(key, String(value));
    },

    setHapticFeedback: async (value: boolean) => {
        set({ hapticFeedback: value });
        const userId = await getUserId();
        const key = userId ? `haptic_feedback_${userId}` : 'haptic_feedback';
        await AsyncStorage.setItem(key, String(value));
    },

    setHighContrast: async (value: boolean) => {
        set({ highContrast: value });
        const userId = await getUserId();
        const key = userId ? `high_contrast_${userId}` : 'high_contrast';
        await AsyncStorage.setItem(key, String(value));
    },

    setBoldText: async (value: boolean) => {
        set({ boldText: value });
        const userId = await getUserId();
        const key = userId ? `bold_text_${userId}` : 'bold_text';
        await AsyncStorage.setItem(key, String(value));
    },

    resetSettings: async () => {
        set({
            fontSize: 'default',
            fontScale: 1.0,
            reduceMotion: false,
            hapticFeedback: true,
            highContrast: false,
            boldText: false,
        });
    },

    loadSettings: async (userId?: string) => {
        try {
            const id = userId || await getUserId();
            const suffix = id ? `_${id}` : '';
            
            const [fontSize, motion, haptic, contrast, bold] = await Promise.all([
                AsyncStorage.getItem(`font_size${suffix}`),
                AsyncStorage.getItem(`reduce_motion${suffix}`),
                AsyncStorage.getItem(`haptic_feedback${suffix}`),
                AsyncStorage.getItem(`high_contrast${suffix}`),
                AsyncStorage.getItem(`bold_text${suffix}`),
            ]);

            set({
                fontSize: fontSize || 'default',
                fontScale: getFontScale(fontSize || 'default'),
                reduceMotion: motion === 'true',
                hapticFeedback: haptic !== 'false', 
                highContrast: contrast === 'true',
                boldText: bold === 'true',
                isLoaded: true,
            });
        } catch (e) {
            console.error('Failed to load accessibility settings', e);
            set({ isLoaded: true });
        }
    }
}));

async function getUserId() {
    try {
        const userStr = await AsyncStorage.getItem('user');
        if (userStr) {
            const user = JSON.parse(userStr);
            return user.id;
        }
    } catch (e) {
        return null;
    }
    return null;
}

// Initialize store immediately
useAccessibilityStore.getState().loadSettings();

// Listen to auth changes to reload or reset settings
setTimeout(() => {
    const { useAuthStore } = require('./useAuthStore');
    useAuthStore.subscribe((state: any, prevState: any) => {
        if (state.user?.id !== prevState.user?.id) {
            if (state.user) {
                useAccessibilityStore.getState().loadSettings(state.user.id);
            } else {
                useAccessibilityStore.getState().resetSettings();
            }
        }
    });
}, 0);
