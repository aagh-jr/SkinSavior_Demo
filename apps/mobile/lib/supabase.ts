import AsyncStorage from "@react-native-async-storage/async-storage";
import { createSupabaseClient } from "@skinsavior/core/supabase";

// Mobile Supabase client. Reuses the shared cross-platform factory from
// @skinsavior/core, injecting AsyncStorage for the auth session (no localStorage
// on React Native) and disabling URL session detection.
export const supabase = createSupabaseClient({
  url: process.env.EXPO_PUBLIC_SUPABASE_URL ?? "",
  anonKey: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? "",
  storage: AsyncStorage,
  detectSessionInUrl: false,
});
