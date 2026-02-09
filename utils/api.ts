import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import Constants from 'expo-constants';


// Automatically determine the API URL based on the Expo Host
const getApiUrl = () => {
    // If we have a hostUri (e.g. 192.168.1.5:8081), use that IP
    const debuggerHost = Constants.expoConfig?.hostUri;
    const localhost = 'http://localhost:5000';

    if (debuggerHost) {
        const ip = debuggerHost.split(':')[0];
        return `http://${ip}:5000`;
    }

    // Fallback if no hostUri (e.g. production build)
    return localhost;
};

// You can still manually override if needed by uncommenting below:
// export const API_BASE_URL = 'http://10.102.116.195:5000';
export const API_BASE_URL = getApiUrl();
export const API_URL = `${API_BASE_URL}/api`;

const api = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json',
        'Bypass-Tunnel-Reminder': 'true', // For Localtunnel
    },
    timeout: 10000, // 10 seconds timeout
});

// Request interceptor for logging
api.interceptors.request.use(request => {
    console.log('Starting Request:', request.method?.toUpperCase(), request.url);
    return request;
});

// Response interceptor for logging
api.interceptors.response.use(
    response => {
        console.log('Response:', response.status, response.config.url);
        return response;
    },
    error => {
        if (error.code === 'ECONNABORTED') {
            console.error('Request Timed Out:', error.config.url);
        } else if (error.response) {
            // Server responded with non-2xx code
            console.error('API Error Response:', error.response.status, error.response.data);
        } else if (error.request) {
            // Request sent but no response
            console.error('Network Error (No Response):', error.message);
            console.error('Target URL:', error.config.url);
        } else {
            console.error('API Setup Error:', error.message);
        }
        return Promise.reject(error);
    }
);

console.log('API Client initialized with URL:', API_URL);

// Request interceptor to add token and handle FormData
api.interceptors.request.use(
    async (config) => {
        const token = await AsyncStorage.getItem('userToken');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }

        // Handle FormData - let axios/React Native set Content-Type with boundary
        if (config.data instanceof FormData) {
            console.log('📸 Uploading FormData with file');
            // Remove Content-Type to let the browser/RN set it with proper boundary
            delete config.headers['Content-Type'];
            // Increase timeout for file uploads (80 seconds)
            config.timeout = 80000;

            // Critical: Prevent Axios from trying to JSON stringify FormData
            config.transformRequest = (data) => data;
        }

        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Response interceptor to handle 401
api.interceptors.response.use(
    (response) => response,
    async (error) => {
        if (error.response?.status === 401) {
            // Handle unauthorized access (e.g., logout)
            await AsyncStorage.removeItem('userToken');
            // You might want to navigate to login screen here or emit an event
        }
        return Promise.reject(error);
    }
);

export default api;
