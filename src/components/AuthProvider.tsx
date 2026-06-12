import React, { createContext, useContext, useState, ReactNode } from 'react';
import { UserProfile, MOCK_USERS, UserPersona } from '../lib/mockBackend';

interface AuthContextType {
  user: UserProfile | null;
  login: (persona: UserPersona) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);

  const login = (persona: UserPersona) => {
    setUser(MOCK_USERS[persona]);
  };

  const logout = () => {
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
