import { createClient } from '@supabase/supabase-js';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

const isWeb = Platform.OS === 'web';

// Custom storage adapter using expo-secure-store for Native, fallback to localStorage on Web
const ExpoSecureStoreAdapter = {
  getItem: async (key: string): Promise<string | null> => {
    if (isWeb) {
      try {
        return localStorage.getItem(key);
      } catch {
        return null;
      }
    }
    try {
      return await SecureStore.getItemAsync(key);
    } catch {
      return null;
    }
  },
  setItem: async (key: string, value: string): Promise<void> => {
    if (isWeb) {
      try {
        localStorage.setItem(key, value);
      } catch (e) {
        console.warn('localStorage set failed', e);
      }
      return;
    }
    try {
      await SecureStore.setItemAsync(key, value);
    } catch (e) {
      console.warn('SecureStore set failed', e);
    }
  },
  removeItem: async (key: string): Promise<void> => {
    if (isWeb) {
      try {
        localStorage.removeItem(key);
      } catch {}
      return;
    }
    try {
      await SecureStore.deleteItemAsync(key);
    } catch (e) {
      console.warn('SecureStore delete failed', e);
    }
  },
};

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '';

console.log('[Supabase Client] Initializing...');
if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('[Supabase Client] WARNING: EXPO_PUBLIC_SUPABASE_URL or EXPO_PUBLIC_SUPABASE_ANON_KEY environment variables are missing! Make sure your client/.env file exists and contains these variables, then restart the Expo start command with the --clear flag.');
} else {
  console.log('[Supabase Client] Configured with URL:', supabaseUrl);
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: ExpoSecureStoreAdapter,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});
