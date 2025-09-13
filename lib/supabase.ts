import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!;

// Choose a storage adapter that is safe across platforms (web/native/SSR)
// - Web: wrap window.localStorage with async API
// - React Native: use AsyncStorage
// - SSR/Node: use in-memory fallback to avoid referencing window
const getStorage = () => {
  // React Native runtime
  if (typeof navigator !== 'undefined' && (navigator as any).product === 'ReactNative') {
    return AsyncStorage;
  }

  // Browser (web)
  if (typeof window !== 'undefined' && typeof window.localStorage !== 'undefined') {
    return {
      getItem: (key: string) => Promise.resolve(window.localStorage.getItem(key)),
      setItem: (key: string, value: string) => {
        window.localStorage.setItem(key, value);
        return Promise.resolve();
      },
      removeItem: (key: string) => {
        window.localStorage.removeItem(key);
        return Promise.resolve();
      },
    };
  }

  // SSR / Node fallback (non-persistent)
  const memory = new Map<string, string>();
  return {
    getItem: async (key: string) => memory.get(key) ?? null,
    setItem: async (key: string, value: string) => {
      memory.set(key, value);
    },
    removeItem: async (key: string) => {
      memory.delete(key);
    },
  };
};

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: getStorage(),
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});
