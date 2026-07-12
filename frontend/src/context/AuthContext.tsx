// src/context/AuthContext.tsx
import React, { createContext, useContext, useState, useEffect } from 'react';
import { apiClient } from '../api/apiClient';
import type { User, Role } from '../api/mockDb';

interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (email: string, password_hash: string, role: string) => Promise<void>;
  register: (name: string, email: string, password_hash: string, confirm_password: string, role: string) => Promise<void>;
  verifyRegistration: (email: string, otp: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const normalizeUser = (u: any): User => ({
    ...u,
    role: u.role ? u.role.replace(' ', '_') : u.role
  });

  const setNormalizedUser = (u: any) => {
    setUser(u ? normalizeUser(u) : null);
  };

  useEffect(() => {
    const fetchMe = async () => {
      const storedToken = sessionStorage.getItem('to_token');
      if (storedToken) {
        try {
          const res = await apiClient.auth.me();
          setNormalizedUser(res.data);
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

  const login = async (email: string, password_hash: string, role: string) => {
    setLoading(true);
    try {
      const res = await apiClient.auth.login(email, password_hash, role);
      setNormalizedUser(res.data.user);
      setToken(res.data.token);
    } finally {
      setLoading(false);
    }
  };

  const register = async (name: string, email: string, password_hash: string, confirm_password: string, role: string) => {
    setLoading(true);
    try {
      await apiClient.auth.register(name, email, password_hash, confirm_password, role);
    } finally {
      setLoading(false);
    }
  };

  const verifyRegistration = async (email: string, otp: string) => {
    setLoading(true);
    try {
      const res = await apiClient.auth.verifyRegistration(email, otp);
      setNormalizedUser(res.data.user);
      setToken(res.data.token);
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    setLoading(true);
    try {
      await apiClient.auth.logout();
      setNormalizedUser(null);
      setToken(null);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, register, verifyRegistration, logout }}>
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
