'use client';

import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { findOrCreateUser, getUserById, type UserData } from '@/lib/actions';

export interface User {
  id: string;
  username: string;
  createdAt: string;
}

export interface UserContextType {
  user: User | null;
  isLoggedIn: boolean;
  login: (username: string) => Promise<void>;
  logout: () => void;
  isLoading: boolean;
  error: string | null;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

// Session storage key for current session (not persisted across browser restarts)
const SESSION_USER_KEY = 'fading-ink-session-user';

export function UserProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Check for existing session on mount
  useEffect(() => {
    const checkSession = async () => {
      try {
        const sessionUserId = sessionStorage.getItem(SESSION_USER_KEY);
        if (sessionUserId) {
          const userData = await getUserById(sessionUserId);
          if (userData) {
            setUser(userData);
          } else {
            sessionStorage.removeItem(SESSION_USER_KEY);
          }
        }
      } catch (e) {
        console.error('Failed to restore session:', e);
        sessionStorage.removeItem(SESSION_USER_KEY);
      } finally {
        setIsLoading(false);
      }
    };
    checkSession();
  }, []);

  const login = useCallback(async (username: string) => {
    setIsLoading(true);
    setError(null);
    try {
      // Find or create user in database
      const userData = await findOrCreateUser(username);
      setUser(userData);
      // Store user ID in session storage for current session only
      sessionStorage.setItem(SESSION_USER_KEY, userData.id);
    } catch (e) {
      setError('Failed to login. Please try again.');
      console.error('Login error:', e);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    sessionStorage.removeItem(SESSION_USER_KEY);
  }, []);

  return (
    <UserContext.Provider
      value={{
        user,
        isLoggedIn: !!user,
        login,
        logout,
        isLoading,
        error,
      }}
    >
      {children}
    </UserContext.Provider>
  );
}

export const useUser = () => {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
};
