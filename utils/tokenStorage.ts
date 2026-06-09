import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

const isWeb = Platform.OS === 'web';

export const setSecureToken = async (key: string, value: string): Promise<void> => {
  try {
    if (isWeb) {
      await AsyncStorage.setItem(key, value);
    } else {
      await SecureStore.setItemAsync(key, value);
    }
  } catch (error) {
    console.error(`Failed to securely save token ${key}:`, error);
    // Fallback to AsyncStorage if SecureStore fails on weird Android devices
    if (!isWeb) {
      await AsyncStorage.setItem(key, value);
    }
  }
};

export const getSecureToken = async (key: string): Promise<string | null> => {
  try {
    let token = null;
    if (isWeb) {
      token = await AsyncStorage.getItem(key);
    } else {
      token = await SecureStore.getItemAsync(key);
      // Migration check: If it's not in SecureStore, check if it's lingering in AsyncStorage
      if (!token) {
        token = await AsyncStorage.getItem(key);
        if (token) {
          // Found in insecure storage! Move it to SecureStore and delete the insecure one.
          await SecureStore.setItemAsync(key, token);
          await AsyncStorage.removeItem(key);
        }
      }
    }
    return token;
  } catch (error) {
    console.error(`Failed to get secure token ${key}:`, error);
    // Fallback
    return await AsyncStorage.getItem(key);
  }
};

export const removeSecureToken = async (key: string): Promise<void> => {
  try {
    if (isWeb) {
      await AsyncStorage.removeItem(key);
    } else {
      await SecureStore.deleteItemAsync(key);
      // Also clear any lingering insecure tokens just in case
      await AsyncStorage.removeItem(key);
    }
  } catch (error) {
    console.error(`Failed to remove secure token ${key}:`, error);
    await AsyncStorage.removeItem(key);
  }
};
