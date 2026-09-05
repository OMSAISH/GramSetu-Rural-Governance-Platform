import React, { createContext, useContext, useState } from 'react';

export interface UserProfile {
  id: number;
  name: string;
  phone_number: string;
  preferred_language: string;
  role: 'citizen' | 'official';
  age?: number;
  annual_income?: number;
  income_bracket?: string;
  occupation?: string;
  land_owned_acres?: number;
  category?: string;
  gender?: string;
  has_disability?: string;
}

interface AuthContextType {
  user: UserProfile | null;
  token: string | null;
  role: 'citizen' | 'official' | null;
  isAuthenticated: boolean;
  login: (token: string, user: UserProfile) => void;
  logout: () => void;
  updateUser: (updatedFields: Partial<UserProfile>) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('gramsetu_token'));
  const [user, setUser] = useState<UserProfile | null>(() => {
    const saved = localStorage.getItem('gramsetu_user');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return null;
      }
    }
    return null;
  });

  const login = (newToken: string, newUser: UserProfile) => {
    setToken(newToken);
    setUser(newUser);
    localStorage.setItem('gramsetu_token', newToken);
    localStorage.setItem('gramsetu_user', JSON.stringify(newUser));
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('gramsetu_token');
    localStorage.removeItem('gramsetu_user');
  };

  const updateUser = (updatedFields: Partial<UserProfile>) => {
    if (!user) return;
    const updated = { ...user, ...updatedFields };
    setUser(updated);
    localStorage.setItem('gramsetu_user', JSON.stringify(updated));
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        role: user?.role || null,
        isAuthenticated: !!token && !!user,
        login,
        logout,
        updateUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
