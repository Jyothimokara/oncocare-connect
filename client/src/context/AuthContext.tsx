import React, { createContext, useState, useEffect, useContext, useRef } from 'react';
import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import { supabase } from '../utils/supabase';

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: 'patient' | 'staff';
  dob?: string;
  gender?: string;
  phone?: string;
  emergencyContactName?: string;
  emergencyContactPhone?: string;
}

interface AuthContextType {
  user: UserProfile | null;
  isOnboarded: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  register: (profile: Omit<UserProfile, 'id' | 'role'>, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<{ success: boolean; error?: string }>;
  completeOnboarding: () => Promise<void>;
  resetOnboarding: () => Promise<void>;
  updateProfile: (profile: Partial<Omit<UserProfile, 'id' | 'email' | 'role'>>) => Promise<{ success: boolean; error?: string }>;
  resetPassword: (email: string) => Promise<{ success: boolean; error?: string }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const SECURE_KEYS = {
  ONBOARDED: 'oncocare_onboarded',
};

const isWeb = Platform.OS === 'web';

const getSecureItem = async (key: string): Promise<string | null> => {
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
};

const setSecureItem = async (key: string, value: string): Promise<void> => {
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
};

const deleteSecureItem = async (key: string): Promise<void> => {
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
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isOnboarded, setIsOnboarded] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  
  const isLoggingInRef = useRef<boolean>(false);

  const fetchAndSetProfile = async (userId: string, email: string): Promise<{ success: boolean; error?: string } | void> => {
    let retries = 3;
    let delay = 500;

    while (retries > 0) {
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', userId)
          .single();

        if (!error && data) {
          setUser({
            id: data.id,
            name: data.full_name,
            email: data.email,
            role: 'patient',
            dob: data.date_of_birth || undefined,
            gender: data.gender || undefined,
            phone: data.phone || undefined,
            emergencyContactName: data.emergency_contact_name || undefined,
            emergencyContactPhone: data.emergency_contact_phone || undefined,
          });
          setIsLoading(false);
          return { success: true };
        }

        // If it's a specific no rows error (trigger insertion delay), wait and retry
        if (error && error.code === 'PGRST116') {
          console.warn(`Profile row not found yet. Retrying in ${delay}ms... (${retries} retries left)`);
          retries--;
          if (retries > 0) {
            await new Promise(resolve => setTimeout(resolve, delay));
            continue;
          }
        }

        // Other database or permission errors: fail immediately
        console.error('Failed to select from profiles database:', error?.message || 'Unknown error');
        setUser(null);
        setIsLoading(false);
        return { success: false, error: error?.message || 'Database query error' };
      } catch (err: any) {
        console.error('Exception fetching profile row:', err);
        setUser(null);
        setIsLoading(false);
        return { success: false, error: err.message || 'Failed to fetch user profile' };
      }
    }

    setUser(null);
    setIsLoading(false);
    return { success: false, error: 'User profile row could not be created in time.' };
  };

  useEffect(() => {
    let authListener: any = null;

    async function initializeAuth() {
      try {
        // Load onboarding state
        const storedOnboarded = await getSecureItem(SECURE_KEYS.ONBOARDED);
        if (storedOnboarded === 'true') {
          setIsOnboarded(true);
        }
      } catch (error) {
        console.error('Failed to load onboarding state', error);
      }

      // Listen for authentication changes
      const { data: { subscription } } = supabase.auth.onAuthStateChange(
        async (event, session) => {
          if (isLoggingInRef.current) {
            return;
          }

          setIsLoading(true);
          if (session?.user) {
            await fetchAndSetProfile(session.user.id, session.user.email || '');
          } else {
            setUser(null);
            setIsLoading(false);
          }
        }
      );
      authListener = subscription;
    }

    initializeAuth();

    return () => {
      if (authListener) {
        authListener.unsubscribe();
      }
    };
  }, []);

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    isLoggingInRef.current = true;
    try {
      if (!email || !password) {
        isLoggingInRef.current = false;
        return { success: false, error: 'Email and password are required.' };
      }

      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        isLoggingInRef.current = false;
        return { success: false, error: error.message };
      }

      if (data.user) {
        const result = await fetchAndSetProfile(data.user.id, data.user.email || '');
        if (result && !result.success) {
          isLoggingInRef.current = false;
          return { success: false, error: result.error };
        }
        isLoggingInRef.current = false;
        return { success: true };
      }
      isLoggingInRef.current = false;
      return { success: false, error: 'Failed to retrieve authenticated user session.' };
    } catch (err: any) {
      isLoggingInRef.current = false;
      return { success: false, error: err.message || 'An error occurred during login. Please try again.' };
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (profile: Omit<UserProfile, 'id' | 'role'>, password: string) => {
    setIsLoading(true);
    try {
      if (!profile.email || !profile.name || !password) {
        return { success: false, error: 'Name, email, and password are required.' };
      }

      const { data, error } = await supabase.auth.signUp({
        email: profile.email,
        password: password,
        options: {
          data: {
            full_name: profile.name,
            phone: profile.phone || '',
            date_of_birth: profile.dob || '',
            gender: profile.gender || '',
          },
        },
      });

      if (error) {
        return { success: false, error: error.message };
      }

      if (data.user) {
        if (data.session) {
          // Fetch and set user profile (relying on PostgreSQL trigger schema insert)
          const result = await fetchAndSetProfile(data.user.id, data.user.email || '');
          if (result && !result.success) {
            return { success: false, error: result.error };
          }
          return { success: true };
        } else {
          // If session is null, email confirmation is required or session is not established
          setUser(null);
          setIsLoading(false);
          return {
            success: true,
            needsConfirmation: true,
            message: 'Registration successful! Please check your email to verify your account before logging in.'
          };
        }
      }
      return { success: false, error: 'Account created, but failed to initialize login session.' };
    } catch (err: any) {
      return { success: false, error: err.message || 'An error occurred during registration. Please try again.' };
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    setIsLoading(true);
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      setUser(null);
      return { success: true };
    } catch (error: any) {
      console.error('Failed to logout', error);
      return { success: false, error: error.message || 'Failed to logout' };
    } finally {
      setIsLoading(false);
    }
  };

  const completeOnboarding = async () => {
    try {
      await setSecureItem(SECURE_KEYS.ONBOARDED, 'true');
      setIsOnboarded(true);
    } catch (error) {
      console.error('Failed to save onboarding state', error);
    }
  };

  const resetOnboarding = async () => {
    try {
      await deleteSecureItem(SECURE_KEYS.ONBOARDED);
      setIsOnboarded(false);
    } catch (error) {
      console.error('Failed to reset onboarding state', error);
    }
  };

  const updateProfile = async (profileUpdate: Partial<Omit<UserProfile, 'id' | 'email' | 'role'>>) => {
    try {
      if (!user) return { success: false, error: 'No user authenticated.' };

      // Map local Profile fields to DB snake_case columns
      const dbUpdate: any = {};
      if (profileUpdate.name !== undefined) dbUpdate.full_name = profileUpdate.name;
      if (profileUpdate.phone !== undefined) dbUpdate.phone = profileUpdate.phone;
      if (profileUpdate.dob !== undefined) dbUpdate.date_of_birth = profileUpdate.dob;
      if (profileUpdate.gender !== undefined) dbUpdate.gender = profileUpdate.gender;
      if (profileUpdate.emergencyContactName !== undefined) dbUpdate.emergency_contact_name = profileUpdate.emergencyContactName;
      if (profileUpdate.emergencyContactPhone !== undefined) dbUpdate.emergency_contact_phone = profileUpdate.emergencyContactPhone;

      const { error } = await supabase
        .from('profiles')
        .update(dbUpdate)
        .eq('id', user.id);

      if (error) {
        console.error('Failed to update public profiles table:', error.message);
        return { success: false, error: error.message };
      }

      // Sync local state
      setUser(prev => prev ? { ...prev, ...profileUpdate } : null);
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message || 'Failed to update profile.' };
    }
  };

  const resetPassword = async (email: string) => {
    setIsLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: Platform.select({
          web: window.location.origin + '/login',
          default: undefined,
        }),
      });

      if (error) {
        return { success: false, error: error.message };
      }
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message || 'Failed to dispatch password recovery link.' };
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isOnboarded,
        isLoading,
        login,
        register,
        logout,
        completeOnboarding,
        resetOnboarding,
        updateProfile,
        resetPassword,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
