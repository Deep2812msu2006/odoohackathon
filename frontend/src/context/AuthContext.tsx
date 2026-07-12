// src/context/AuthContext.tsx
import React, { createContext, useContext, useState, useEffect } from 'react';
import { apiClient } from '../api/apiClient';
import type { User, Role } from '../api/mockDb';

interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (email: string, password_hash: string) => Promise<void>;
  logout: () => Promise<void>;
  changeMockRole: (role: Role) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchMe = async () => {
      const storedToken = sessionStorage.getItem('to_token');
      if (storedToken) {
        try {
          const res = await apiClient.auth.me();
          setUser(res.data);
          setToken(storedToken);
        } catch (err) {
          sessionStorage.removeItem('to_token');
          sessionStorage.removeItem('to_auth_user');
        }
      }
      setLoading(false);
    };
    fetchMe();
  }, []);

  const login = async (email: string, password_hash: string) => {
    setLoading(true);
    try {
      const res = await apiClient.auth.login(email, password_hash);
      setUser(res.data.user);
      setToken(res.data.token);
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    setLoading(true);
    try {
      await apiClient.auth.logout();
      setUser(null);
      setToken(null);
    } finally {
      setLoading(false);
    }
  };

  // Helper for demo evaluation: allow switching user roles dynamically
  const changeMockRole = (role: Role) => {
    if (!user) return;
    const updatedUser: User = {
      ...user,
      role,
      name: `Mock ${role.replace('_', ' ').toLowerCase()}`
    };
    sessionStorage.setItem('to_auth_user', JSON.stringify(updatedUser));
    setUser(updatedUser);
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, logout, changeMockRole }}>
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
