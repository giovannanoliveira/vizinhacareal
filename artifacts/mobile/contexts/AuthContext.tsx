import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  getMe,
  login as apiLogin,
  logout as apiLogout,
  register as apiRegister,
  setAuthTokenGetter,
  type Usuario,
} from '@workspace/api-client-react';

const TOKEN_KEY = '@vizinhanca_token';

let currentToken: string | null = null;
setAuthTokenGetter(() => currentToken);

export type User = Usuario;

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const token = await AsyncStorage.getItem(TOKEN_KEY);
        if (token) {
          currentToken = token;
          const me = await getMe();
          setUser(me);
        }
      } catch {
        // Session expired or unreachable — clear the stale token.
        currentToken = null;
        await AsyncStorage.removeItem(TOKEN_KEY);
      } finally {
        setIsLoading(false);
      }
    })();
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const session = await apiLogin({ email: email.trim(), password });
    currentToken = session.token;
    await AsyncStorage.setItem(TOKEN_KEY, session.token);
    setUser(session.user);
  }, []);

  const register = useCallback(async (name: string, email: string, password: string) => {
    const session = await apiRegister({ name, email: email.trim(), password });
    currentToken = session.token;
    await AsyncStorage.setItem(TOKEN_KEY, session.token);
    setUser(session.user);
  }, []);

  const logout = useCallback(async () => {
    try {
      await apiLogout();
    } catch {
      // Ignore network errors — clear local state regardless.
    }
    currentToken = null;
    await AsyncStorage.removeItem(TOKEN_KEY);
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, isLoading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
