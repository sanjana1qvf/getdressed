import { supabase } from '../../config/supabase';
import { User } from '../../utils/types';
import { EXPO_PUBLIC_SUPABASE_URL, EXPO_PUBLIC_SUPABASE_ANON_KEY } from '@env';

const supabaseUrl = EXPO_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = EXPO_PUBLIC_SUPABASE_ANON_KEY || '';

export interface AuthResponse {
  user: User | null;
  error: string | null;
}

export const authService = {
  // Sign up with email and password
  async signUp(email: string, password: string, name: string, age: number): Promise<AuthResponse> {
    try {
      // Check if Supabase is properly configured
      if (!supabaseUrl || !supabaseAnonKey) {
        // Fallback to mock authentication for testing
        console.log('Using mock authentication for signup');
        const mockUser: User = {
          id: `mock_${Date.now()}`,
          email: email,
          name: name,
          age: age,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
        return { user: mockUser, error: null };
      }

      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name,
            age,
          },
        },
      });

      if (error) {
        return { user: null, error: error.message };
      }

      if (data.user) {
        const user: User = {
          id: data.user.id,
          email: data.user.email!,
          name: data.user.user_metadata?.name || name,
          age: data.user.user_metadata?.age || age,
          created_at: data.user.created_at,
          updated_at: data.user.updated_at || data.user.created_at,
        };

        return { user, error: null };
      }

      return { user: null, error: 'Signup failed' };
    } catch (error) {
      console.error('Signup error:', error);
      return { user: null, error: 'An unexpected error occurred' };
    }
  },

  // Sign in with email and password
  async signIn(email: string, password: string): Promise<AuthResponse> {
    try {
      // Check if Supabase is properly configured
      if (!supabaseUrl || !supabaseAnonKey) {
        // Fallback to mock authentication for testing
        console.log('Using mock authentication for signin');
        const mockUser: User = {
          id: `mock_${Date.now()}`,
          email: email,
          name: 'Test User',
          age: 25,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
        return { user: mockUser, error: null };
      }

      if (!supabase.auth) {
        console.error('Supabase auth not configured');
        return { user: null, error: 'Authentication service not configured. Please check your setup.' };
      }

      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        console.error('Supabase auth error:', error);
        return { user: null, error: error.message };
      }

      if (data.user) {
        const user: User = {
          id: data.user.id,
          email: data.user.email!,
          name: data.user.user_metadata?.name || 'User',
          age: data.user.user_metadata?.age || 0,
          created_at: data.user.created_at,
          updated_at: data.user.updated_at || data.user.created_at,
        };

        return { user, error: null };
      }

      return { user: null, error: 'Login failed' };
    } catch (error) {
      console.error('Login error:', error);
      return { user: null, error: 'An unexpected error occurred. Please try again.' };
    }
  },

  // Sign out
  async signOut(): Promise<{ error: string | null }> {
    try {
      const { error } = await supabase.auth.signOut();
      return { error: error?.message || null };
    } catch (error) {
      console.error('Signout error:', error);
      return { error: 'An unexpected error occurred' };
    }
  },

  // Get current user
  async getCurrentUser(): Promise<AuthResponse> {
    try {
      const { data: { user }, error } = await supabase.auth.getUser();

      if (error || !user) {
        return { user: null, error: error?.message || 'No user found' };
      }

      const userProfile: User = {
        id: user.id,
        email: user.email!,
        name: user.user_metadata?.name || 'User',
        age: user.user_metadata?.age || 0,
        created_at: user.created_at,
        updated_at: user.updated_at || user.created_at,
      };

      return { user: userProfile, error: null };
    } catch (error) {
      console.error('Get current user error:', error);
      return { user: null, error: 'An unexpected error occurred' };
    }
  },

  // Listen to auth state changes
  onAuthStateChange(callback: (user: User | null) => void) {
    return supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session?.user) {
        const user: User = {
          id: session.user.id,
          email: session.user.email!,
          name: session.user.user_metadata?.name || 'User',
          age: session.user.user_metadata?.age || 0,
          created_at: session.user.created_at,
          updated_at: session.user.updated_at || session.user.created_at,
        };
        callback(user);
      } else if (event === 'SIGNED_OUT') {
        callback(null);
      }
    });
  },
}; 