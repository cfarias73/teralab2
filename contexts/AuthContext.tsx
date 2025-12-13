
import React, { createContext, useState, useEffect, useContext, useCallback } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '../services/supabaseClient';
import { UserProfile } from '../types'; // Import UserProfile

interface AuthContextType {
  session: Session | null;
  user: User | null;
  userProfile: UserProfile | null; // Added userProfile
  loading: boolean;
  signOut: () => Promise<void>;
  refreshUserProfile: () => Promise<void>; // Added refresh function
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null); // State for user profile
  const [loading, setLoading] = useState(true);

  const fetchUserProfile = useCallback(async (userId: string) => {
    const { data, error } = await supabase
      .from('profiles')
      .select('id, full_name, role, free_analyses_limit') // Select the new field
      .eq('id', userId)
      .single();

    if (error) {
      console.error('Error fetching user profile:', error.message || error);
      setUserProfile(null);
    } else if (data) {
      setUserProfile(data as UserProfile);
    }
  }, []); // No dependencies for fetchUserProfile

  const refreshUserProfile = useCallback(async () => {
    if (user?.id) {
      await fetchUserProfile(user.id);
    }
  }, [user, fetchUserProfile]);


  useEffect(() => {
    const initializeAuth = async () => {
        // 1. Get initial session
        const { data: { session } } = await supabase.auth.getSession();
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
            await fetchUserProfile(session.user.id);
        }
        setLoading(false);

        // 2. Listen for changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
            setSession(session);
            setUser(session?.user ?? null);
            
            if (session?.user) {
                await fetchUserProfile(session.user.id);
            } else {
                setUserProfile(null); // Clear profile if user logs out
            }
            setLoading(false);
        });

        return () => subscription.unsubscribe();
    };

    initializeAuth();
  }, [fetchUserProfile]); // fetchUserProfile is a dependency now


  const signOut = async () => {
    await supabase.auth.signOut();
  };

  const value = {
    session,
    user,
    userProfile, // Provided in context
    loading,
    signOut,
    refreshUserProfile // Provided in context
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
