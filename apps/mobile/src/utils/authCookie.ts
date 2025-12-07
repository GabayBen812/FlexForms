import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

const AUTH_COOKIE_KEY = 'authCookie';

let inMemoryCookie: string | null | undefined;

const isWeb = Platform.OS === 'web';

const getWebStorage = () => {
  if (typeof window === 'undefined') {
    return null;
  }
  try {
    return window.localStorage;
  } catch (error) {
    console.warn('Unable to access localStorage', error);
    return null;
  }
};

export async function getAuthCookie(): Promise<string | null> {
  if (inMemoryCookie !== undefined) {
    console.log('[authCookie] getAuthCookie from memory:', inMemoryCookie ? `${inMemoryCookie.substring(0, 20)}...` : 'null');
    return inMemoryCookie;
  }

  if (isWeb) {
    const storage = getWebStorage();
    const stored = storage?.getItem(AUTH_COOKIE_KEY) ?? null;
    inMemoryCookie = stored;
    console.log('[authCookie] getAuthCookie from web storage:', stored ? `${stored.substring(0, 20)}...` : 'null');
    return stored;
  }

  const stored = await SecureStore.getItemAsync(AUTH_COOKIE_KEY);
  inMemoryCookie = stored ?? null;
  console.log('[authCookie] getAuthCookie from SecureStore:', stored ? `${stored.substring(0, 20)}...` : 'null');
  return inMemoryCookie;
}

export async function setAuthCookie(cookie: string): Promise<void> {
  console.log('[authCookie] setAuthCookie:', cookie.substring(0, 30) + '...');
  inMemoryCookie = cookie;
  if (isWeb) {
    const storage = getWebStorage();
    storage?.setItem(AUTH_COOKIE_KEY, cookie);
    return;
  }

  await SecureStore.setItemAsync(AUTH_COOKIE_KEY, cookie);
  console.log('[authCookie] Cookie saved to SecureStore');
}

export async function clearAuthCookie(): Promise<void> {
  inMemoryCookie = null;
  if (isWeb) {
    const storage = getWebStorage();
    storage?.removeItem(AUTH_COOKIE_KEY);
    return;
  }

  await SecureStore.deleteItemAsync(AUTH_COOKIE_KEY);
}


