import { useEffect, useState } from 'react';

export type User = {
  id?: string;
  name?: string;
  role?: 'owner' | 'warden' | 'staff' | 'admin' | 'student' | string;
};

// In-memory fallback for environments without AsyncStorage registered.
const fallbackStore = new Map<string, string>();

type StorageLike = {
  getItem(key: string): Promise<string | null> | string | null;
  setItem(key: string, value: string): Promise<void> | void;
};

let registeredStorage: StorageLike | null = null;

export function registerStorage(storage: StorageLike) {
  registeredStorage = storage;
}

async function storageGetItem(key: string): Promise<string | null> {
  if (registeredStorage && typeof registeredStorage.getItem === 'function') {
    try {
      const res = await registeredStorage.getItem(key as any);
      // Support synchronous implementations that return string
      return typeof res === 'string' ? res : (res as string | null);
    } catch (e) {
      return null;
    }
  }
  return fallbackStore.get(key) ?? null;
}

async function storageSetItem(key: string, value: string): Promise<void> {
  if (registeredStorage && typeof registeredStorage.setItem === 'function') {
    try {
      await registeredStorage.setItem(key as any, value as any);
      return;
    } catch (e) {
      // fallthrough to fallback
    }
  }
  fallbackStore.set(key, value);
}

export async function getStoredUser(): Promise<User | null> {
  try {
    const raw = await storageGetItem('user');
    if (!raw) return null;
    return JSON.parse(raw);
  } catch (e) {
    return null;
  }
}

export async function setStoredUser(user: User | null) {
  if (!user) {
    await storageSetItem('user', '');
    return;
  }
  await storageSetItem('user', JSON.stringify(user));
}

export function useUser() {
  const [user, setUser] = useState<User | null>(null);
  useEffect(() => {
    let mounted = true;
    (async () => {
      const u = await getStoredUser();
      if (mounted) setUser(u);
    })();
    return () => {
      mounted = false;
    };
  }, []);
  return user;
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
