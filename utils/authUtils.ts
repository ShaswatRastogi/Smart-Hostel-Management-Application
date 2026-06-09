import { useEffect, useState } from 'react';

import AsyncStorage from '@react-native-async-storage/async-storage';

export type User = {
  id?: string;
  name?: string;
  role?: 'owner' | 'warden' | 'staff' | 'admin' | 'student' | string;
};

export async function getStoredUser(): Promise<User | null> {
  try {
    const raw = await AsyncStorage.getItem('user');
    if (!raw) return null;
    return JSON.parse(raw);
  } catch (e) {
    return null;
  }
}

export async function setStoredUser(user: User | null) {
  try {
    if (!user) {
      await AsyncStorage.removeItem('user');
      return;
    }
    await AsyncStorage.setItem('user', JSON.stringify(user));
  } catch (e) {
    console.error('Failed to save user', e);
  }
}

export function useUser() {
  const { useAuthStore } = require('../store/useAuthStore');
  return useAuthStore((state: any) => state.user);
}

const staffRoles = ['owner', 'warden', 'staff', 'admin', 'cleaning_staff', 'mess_staff', 'laundry_staff', 'guard', 'maintenance_staff'];

export function isAdmin(user: User | null | undefined) {
  // Legacy support for 'admin' string
  return !!user && staffRoles.includes(user.role || '');
}

export function isOwner(user: User | null | undefined) {
  return !!user && ['owner', 'admin'].includes(user.role || '');
}

export function isWardenOrOwner(user: User | null | undefined) {
  return !!user && ['owner', 'warden', 'admin'].includes(user.role || '');
}

export function isStaffOrHigher(user: User | null | undefined) {
  return !!user && staffRoles.includes(user.role || '');
}

export async function performLogout(router: any) {
  try {
    const { removeSecureToken } = await import('./tokenStorage');
    const api = (await import('./api')).default;
    
    try {
      // Notify backend to invalidate refresh token
      await api.post('/auth/sessions/logout');
    } catch (err) {
      console.log('Backend session logout failed, proceeding locally', err);
    }

    // Deregister push token
    try {
      const { deregisterPushToken } = await import('./usePushNotifications');
      await deregisterPushToken();
    } catch (err) {
      console.log('Push token deregistration failed', err);
    }

    // Clear local storage
    await removeSecureToken('userToken');
    await removeSecureToken('refreshToken');
    await setStoredUser(null);

    // Clear global state
    const { useAuthStore } = require('../store/useAuthStore');
    const { useDashboardStore } = require('../store/useDashboardStore');
    useAuthStore.getState().setUser(null);
    useDashboardStore.getState().clearData();

    // Disconnect sockets
    const { disconnectSocket } = await import('./chatUtils');
    disconnectSocket();

    // Navigate out
    if (router) {
      router.replace('/login');
    }
  } catch (error) {
    console.error('Logout error:', error);
  }
}

