import { createClient } from "@supabase/supabase-js";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { EXPO_PUBLIC_SUPABASE_URL, EXPO_PUBLIC_SUPABASE_ANON_KEY } from "@env";

const supabaseUrl = EXPO_PUBLIC_SUPABASE_URL || "";
const supabaseAnonKey = EXPO_PUBLIC_SUPABASE_ANON_KEY || "";

// Check if we should use mock configuration
const useMockConfig = !supabaseUrl || !supabaseAnonKey || 
  supabaseUrl.includes("mock") || supabaseAnonKey.includes("mock");

let supabase;
let testSupabaseConnection;

if (useMockConfig) {
  console.log("Using mock Supabase configuration for testing");
  
  // Mock Supabase client
  const mockSupabase = {
    auth: {
      signInWithPassword: async () => ({ 
        data: null, 
        error: { message: "Mock auth - use real credentials" } 
      }),
      signUp: async () => ({ 
        data: null, 
        error: { message: "Mock auth - use real credentials" } 
      }),
      signOut: async () => ({ error: null }),
      getUser: async () => ({ data: { user: null }, error: null }),
      onAuthStateChange: () => ({ data: { subscription: null } }),
    },
    from: () => ({
      select: () => ({ 
        limit: () => Promise.resolve({ 
          data: null, 
          error: { message: "Mock database" } 
        }) 
      }),
    }),
  };
  
  supabase = mockSupabase;
  testSupabaseConnection = async () => {
    console.log("Mock Supabase connection test");
    return false;
  };
} else {
  console.log("Using real Supabase configuration");
  
  supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      storage: AsyncStorage,
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false,
    },
    global: {
      headers: {
        "X-Client-Info": "getDressed-app",
      },
    },
  });

  testSupabaseConnection = async () => {
    try {
      const { data, error } = await supabase.from("outfits").select("count").limit(1);
      if (error) {
        console.error("Supabase connection test failed:", error);
        return false;
      }
      console.log("Supabase connection test successful");
      return true;
    } catch (error) {
      console.error("Supabase connection test error:", error);
      return false;
    }
  };
}

export { supabase, testSupabaseConnection };
export default supabase;
