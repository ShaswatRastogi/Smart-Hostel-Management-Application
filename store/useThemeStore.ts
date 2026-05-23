import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SystemUI from 'expo-system-ui';
import { Appearance } from 'react-native';
import { create } from 'zustand';

type Theme = 'light' | 'dark';

interface ThemeColors {
    background: string;
    card: string;
    text: string;
    textSecondary: string;
    border: string;
    primary: string;
    secondary: string;
    accent: string;
    success: string;
    error: string;
    warning: string;
    info: string;
    inputBackground: string;
    icon: string;
    shadow: string;
}

const lightColors: ThemeColors = {
    background: '#F8FAFC',
    card: '#FFFFFF',
    text: '#0F172A',
    textSecondary: '#64748B',
    border: '#E2E8F0',
    primary: '#004e92',
    secondary: '#475569',
    accent: '#3B82F6',
    success: '#10B981',
    error: '#EF4444',
    warning: '#F59E0B',
    info: '#3B82F6',
    inputBackground: '#F8FAFC',
    icon: '#64748B',
    shadow: '#64748B',
};

const darkColors: ThemeColors = {
    background: '#0F172A',
    card: '#1E293B',
    text: '#F8FAFC',
    textSecondary: '#94A3B8',
    border: '#334155',
    primary: '#3B82F6',
    secondary: '#94A3B8',
    accent: '#60A5FA',
    success: '#34D399',
    error: '#F87171',
    warning: '#FBBF24',
    info: '#60A5FA',
    inputBackground: '#020617',
    icon: '#94A3B8',
    shadow: '#000000',
};

const lightColorsHighContrast: ThemeColors = {
    ...lightColors,
    text: '#000000',
    textSecondary: '#1C2433', // Darker gray
    border: '#94A3B8', // More visible border
    primary: '#002B5E', // Deeper primary
};

const darkColorsHighContrast: ThemeColors = {
    ...darkColors,
    background: '#000000',
    card: '#0F172A',
    text: '#FFFFFF',
    textSecondary: '#E2E8F0', // Lighter gray
    border: '#64748B', // More visible border
    primary: '#60A5FA', 
};

interface ThemeState {
    theme: Theme;
    isDark: boolean;
    colors: ThemeColors;
    isLoaded: boolean;
    setTheme: (theme: Theme) => Promise<void>;
    toggleTheme: () => Promise<void>;
    initTheme: () => Promise<void>;
}

export const useThemeStore = create<ThemeState>((set, get) => ({
    theme: 'light',
    isDark: false,
    colors: lightColors,
    isLoaded: false,

    setTheme: async (newTheme: Theme) => {
        const isDark = newTheme === 'dark';
        const { useAccessibilityStore } = require('./useAccessibilityStore');
        const { useAuthStore } = require('./useAuthStore');
        
        const isHighContrast = useAccessibilityStore.getState().highContrast;
        const user = useAuthStore.getState().user;
        
        // High contrast only applies if user is logged in
        const shouldApplyHighContrast = isHighContrast && user;
        
        let colors = lightColors;
        if (isDark) colors = shouldApplyHighContrast ? darkColorsHighContrast : darkColors;
        else colors = shouldApplyHighContrast ? lightColorsHighContrast : lightColors;

        set({ theme: newTheme, isDark, colors });

        try {
            await AsyncStorage.setItem('app_theme', newTheme);
            SystemUI.setBackgroundColorAsync(colors.background).catch(() => { });
        } catch (e) {
            console.error('Failed to save theme', e);
        }
    },

    toggleTheme: async () => {
        const currentTheme = get().theme;
        const newTheme = currentTheme === 'light' ? 'dark' : 'light';
        await get().setTheme(newTheme);
    },

    initTheme: async () => {
        try {
            const storedTheme = await AsyncStorage.getItem('app_theme');
            const systemScheme = Appearance.getColorScheme() || 'light';
            const initialTheme = (storedTheme as Theme) || (systemScheme as Theme);

            const isDark = initialTheme === 'dark';
            const { useAccessibilityStore } = require('./useAccessibilityStore');
            const { useAuthStore } = require('./useAuthStore');
            
            const isHighContrast = useAccessibilityStore.getState().highContrast;
            const user = useAuthStore.getState().user;
            const shouldApplyHighContrast = isHighContrast && user;
            
            let colors = lightColors;
            if (isDark) colors = shouldApplyHighContrast ? darkColorsHighContrast : darkColors;
            else colors = shouldApplyHighContrast ? lightColorsHighContrast : lightColors;

            set({ theme: initialTheme, isDark, colors, isLoaded: true });

            SystemUI.setBackgroundColorAsync(colors.background).catch(() => { });
        } catch (e) {
            console.error('Failed to init theme', e);
            set({ isLoaded: true });
        }
    },
    
    // Call this when high contrast changes
    refreshColors: () => {
        get().setTheme(get().theme);
    }
}));

// Initialize theme
useThemeStore.getState().initTheme();

// Listen to accessibility store changes to refresh colors dynamically
setTimeout(() => {
    const { useAccessibilityStore } = require('./useAccessibilityStore');
    const { useAuthStore } = require('./useAuthStore');

    useAccessibilityStore.subscribe((state: any, prevState: any) => {
        if (state.highContrast !== prevState.highContrast) {
            useThemeStore.getState().refreshColors();
        }
    });

    useAuthStore.subscribe((state: any, prevState: any) => {
        if (state.user?.id !== prevState.user?.id) {
            useThemeStore.getState().refreshColors();
        }
    });
}, 0);
