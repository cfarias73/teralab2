
import React, { createContext, useState, useEffect, useContext, useCallback, useRef } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '../services/supabaseClient';
import { UserProfile } from '../types';

interface AuthContextType {
  session: Session | null;
  user: User | null;
  userProfile: UserProfile | null;
  loading: boolean;
  signOut: () => Promise<void>;
  refreshUserProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const isInitialLoad = useRef(true);

  const fetchUserProfile = useCallback(async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name, role, free_analyses_limit')
        .eq('id', userId)
        .single();

      if (error) {
        console.error('Error fetching user profile:', error.message || error);
        setUserProfile(null);
      } else if (data) {
        setUserProfile(data as UserProfile);
      }
    } catch (e) {
      console.error('Exception fetching user profile:', e);
      setUserProfile(null);
    }
  }, []);

  const refreshUserProfile = useCallback(async () => {
    if (user?.id) {
      await fetchUserProfile(user.id);
    }
  }, [user, fetchUserProfile]);

  useEffect(() => {
    const startTime = Date.now();
    const MIN_SPLASH_TIME = 2000; // 2 seconds minimum
    const MAX_SPLASH_TIME = 8000; // 8 seconds maximum - safety timeout

    // Safety timeout to prevent hanging forever
    const safetyTimeout = setTimeout(() => {
      console.warn('[Auth] Safety timeout - forcing splash to close');
      isInitialLoad.current = false;
      setLoading(false);
    }, MAX_SPLASH_TIME);

    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchUserProfile(session.user.id);
      }

      // Ensure splash shows for at least MIN_SPLASH_TIME
      const elapsed = Date.now() - startTime;
      const remainingTime = Math.max(0, MIN_SPLASH_TIME - elapsed);

      setTimeout(() => {
        clearTimeout(safetyTimeout); // Cancel safety timeout
        isInitialLoad.current = false;
        setLoading(false);
      }, remainingTime);
    }).catch((error) => {
      console.error('[Auth] getSession failed:', error);
      clearTimeout(safetyTimeout);
      isInitialLoad.current = false;
      setLoading(false);
    });

    // Listen for auth changes (but don't control loading on initial load)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchUserProfile(session.user.id);
      } else {
        setUserProfile(null);
      }
      // Only set loading false if not initial load (splash already handled it)
      if (!isInitialLoad.current) {
        setLoading(false);
      }
    });

    return () => {
      subscription.unsubscribe();
      clearTimeout(safetyTimeout);
    };
  }, [fetchUserProfile]);

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  const value = {
    session,
    user,
    userProfile,
    loading,
    signOut,
    refreshUserProfile
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
