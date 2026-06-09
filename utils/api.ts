import AsyncStorage from '@react-native-async-storage/async-storage';
import { getSecureToken, removeSecureToken } from './tokenStorage';
import axios from 'axios';
import axiosRetry from 'axios-retry';
import Constants from 'expo-constants';

const getApiUrl = () => {
    // Force the app to use the Render cloud backend to avoid any local IP routing issues
    return process.env.EXPO_PUBLIC_API_URL || "https://smartstay-backend-5a3s.onrender.com";
};

export const API_BASE_URL = getApiUrl();
export const API_URL = `${API_BASE_URL}/api`;

const api = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json',
        'Bypass-Tunnel-Reminder': 'true',
    },
    timeout: 30000,
});

// Configure automatic retries for cold starts and flaky networks
axiosRetry(api, {
    retries: 3,
    retryDelay: (retryCount) => {
        console.log(`[API] Retrying request (${retryCount}/3)...`);
        return retryCount * 3000; // 3s, 6s, 9s
    },
    retryCondition: (error) => {
        return axiosRetry.isNetworkOrIdempotentRequestError(error) || error.code === 'ECONNABORTED';
    }
});


// ================= REQUEST LOG =================
api.interceptors.request.use(request => {
    console.log('Starting Request:', request.method?.toUpperCase(), request.url);
    return request;
});


// ================= RESPONSE LOG =================
api.interceptors.response.use(
    response => {
        console.log('Response:', response.status, response.config.url);
        return response;
    },
    error => {
        const { useAlertStore } = require('../store/useAlertStore');
        
        // We only show the alert if all retries have failed
        if (error.config && error.config['axios-retry'] && error.config['axios-retry'].retryCount < 3) {
            // Still retrying, do not show alert yet
            return Promise.reject(error);
        }

        if (error.code === 'ECONNABORTED') {
            useAlertStore.getState().showAlert('Connection Timeout', 'The server took too long to respond. Please check your connection.', [], 'warning');
        } else if (error.response) {
            if (error.response.status >= 500) {
                useAlertStore.getState().showAlert('Server Error', 'Our servers are having a moment. Please try again later.', [], 'error');
            }
        } else if (error.request) {
            useAlertStore.getState().showAlert('Network Error', 'Could not reach the server. Please check your internet connection.', [], 'error');
        }
        
        return Promise.reject(error);
    }
);


// ================= TOKEN + FORM DATA =================
api.interceptors.request.use(
    async (config) => {

        const token = await getSecureToken('userToken');

        if (!config.headers) {
            config.headers = new axios.AxiosHeaders();
        }

        if (token) {
            config.headers.set('Authorization', `Bearer ${token}`);
        }

        // Handle FormData uploads
        if (
            config.data &&
            (
                config.data instanceof FormData ||
                config.data.constructor?.name === 'FormData' ||
                (config.data._parts && Array.isArray(config.data._parts))
            )
        ) {
            console.log('📸 Uploading FormData with file');
            
            // In React Native + Axios >= 1.0, do NOT delete the Content-Type.
            // Axios will automatically set the boundary.
            if (!config.headers.get('Content-Type')) {
                config.headers.set('Content-Type', 'multipart/form-data');
            }

            config.timeout = 120000; // Increase timeout for large uploads
        }

        return config;
    },
    (error) => Promise.reject(error)
);


// ================= HANDLE 401 =================
api.interceptors.response.use(
    (response) => response,
    async (error) => {

        if (error.response?.status === 401 || error.response?.status === 403) {
            await removeSecureToken('userToken');
            await removeSecureToken('refreshToken');
            await AsyncStorage.removeItem('user');
            try {
                const { useAuthStore } = require('../store/useAuthStore');
                useAuthStore.getState().setUser(null);
            } catch (e) {}
        }

        return Promise.reject(error);
    }
);

console.log('API Client initialized with URL:', API_URL);

export default api;
