import React, { createContext, useContext, useState, ReactNode } from 'react';
import axios from 'axios';

interface User {
  id: string;
  username: string;
  email: string;
  role: string;
  contact_number?: string;
}

interface ProfileData {
  name: string;
  email: string;
}

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  updateProfile: (profileData: ProfileData) => Promise<boolean>;
  updatePassword: (currentPassword: string, newPassword: string) => Promise<boolean>;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

// Base URL for API calls
const API_BASE_URL = 'http://localhost:3001';

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => {
    // Check if user is stored in localStorage on initial load
    const savedUser = localStorage.getItem('user');
    return savedUser ? JSON.parse(savedUser) : null;
  });

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      const response = await axios.post(`${API_BASE_URL}/api/login`, {
        email,
        password
      });
      
      if (response.data.success && response.data.user) {
        setUser(response.data.user);
        // Save user to localStorage for persistence
        localStorage.setItem('user', JSON.stringify(response.data.user));
        return true;
      }
      return false;
    } catch (error) {
      console.error('Login error:', error);
      return false;
    }
  };

  const logout = () => {
    setUser(null);
    // Clear user from localStorage
    localStorage.removeItem('user');
  };

  const updateProfile = async (profileData: ProfileData): Promise<boolean> => {
    // In a real app, this would call your backend API
    if (user) {
      // Implement real API call here
      return true;
    }
    return false;
  };

  const updatePassword = async (currentPassword: string, newPassword: string): Promise<boolean> => {
    // Implement real API call here
    return false;
  };

  const value = {
    user,
    login,
    logout,
    updateProfile,
    updatePassword,
    isAuthenticated: !!user
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
