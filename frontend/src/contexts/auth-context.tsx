import React, { createContext, useContext, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authAPI } from '@/lib/api';
import { User } from '@/types';
import { useAuthStore } from '@/store';
import { toast } from '@/store';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (data: any) => Promise<void>;
  logout: () => Promise<void>;
  googleAuth: () => void;
  forgotPassword: (email: string) => Promise<void>;
  resetPassword: (token: string, password: string) => Promise<void>;
  verifyEmail: (token: string) => Promise<void>;
  resendVerification: () => Promise<void>;
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
  children: React.ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const navigate = useNavigate();
  const { user, isAuthenticated, setUser, setTokens, clearAuth, setLoading } = useAuthStore();
  const [isInitializing, setIsInitializing] = useState(true);

  // Check for existing tokens and validate them on mount
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const accessToken = localStorage.getItem('accessToken');
        if (accessToken) {
          const response = await authAPI.getCurrentUser();
          if (response.success && response.data) {
            setUser(response.data);
          } else {
            // Token is invalid, clear auth
            clearAuth();
          }
        }
      } catch (error) {
        console.error('Auth initialization error:', error);
        clearAuth();
      } finally {
        setIsInitializing(false);
      }
    };

    initializeAuth();
  }, [setUser, clearAuth]);

  const login = async (email: string, password: string) => {
    try {
      setLoading(true);
      const response = await authAPI.login({ email, password });
      
      if (response.success && response.data) {
        const { user, accessToken, refreshToken } = response.data;
        setUser(user);
        setTokens(accessToken, refreshToken);
        localStorage.setItem('accessToken', accessToken);
        localStorage.setItem('refreshToken', refreshToken);
        toast.success('Login successful!');
        navigate('/');
      } else {
        throw new Error(response.message || 'Login failed');
      }
    } catch (error: any) {
      toast.error('Login failed', error.message);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const register = async (data: any) => {
    try {
      setLoading(true);
      const response = await authAPI.register(data);
      
      if (response.success && response.data) {
        const { user, accessToken, refreshToken } = response.data;
        setUser(user);
        setTokens(accessToken, refreshToken);
        localStorage.setItem('accessToken', accessToken);
        localStorage.setItem('refreshToken', refreshToken);
        toast.success('Registration successful! Please check your email for verification.');
        navigate('/');
      } else {
        throw new Error(response.message || 'Registration failed');
      }
    } catch (error: any) {
      toast.error('Registration failed', error.message);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      await authAPI.logout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      clearAuth();
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      toast.success('Logged out successfully');
      navigate('/login');
    }
  };

  const googleAuth = () => {
    authAPI.googleAuth();
  };

  const forgotPassword = async (email: string) => {
    try {
      setLoading(true);
      const response = await authAPI.forgotPassword(email);
      
      if (response.success) {
        toast.success('Password reset email sent!');
      } else {
        throw new Error(response.message || 'Failed to send reset email');
      }
    } catch (error: any) {
      toast.error('Failed to send reset email', error.message);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const resetPassword = async (token: string, password: string) => {
    try {
      setLoading(true);
      const response = await authAPI.resetPassword(token, password);
      
      if (response.success) {
        toast.success('Password reset successful!');
        navigate('/login');
      } else {
        throw new Error(response.message || 'Password reset failed');
      }
    } catch (error: any) {
      toast.error('Password reset failed', error.message);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const verifyEmail = async (token: string) => {
    try {
      setLoading(true);
      const response = await authAPI.verifyEmail(token);
      
      if (response.success) {
        toast.success('Email verified successfully!');
        // Refresh user data to update verification status
        const userResponse = await authAPI.getCurrentUser();
        if (userResponse.success && userResponse.data) {
          setUser(userResponse.data);
        }
      } else {
        throw new Error(response.message || 'Email verification failed');
      }
    } catch (error: any) {
      toast.error('Email verification failed', error.message);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const resendVerification = async () => {
    try {
      setLoading(true);
      const response = await authAPI.resendVerification();
      
      if (response.success) {
        toast.success('Verification email sent!');
      } else {
        throw new Error(response.message || 'Failed to send verification email');
      }
    } catch (error: any) {
      toast.error('Failed to send verification email', error.message);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const value: AuthContextType = {
    user,
    isAuthenticated,
    isLoading: isInitializing || useAuthStore.getState().isLoading,
    login,
    register,
    logout,
    googleAuth,
    forgotPassword,
    resetPassword,
    verifyEmail,
    resendVerification,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}; 