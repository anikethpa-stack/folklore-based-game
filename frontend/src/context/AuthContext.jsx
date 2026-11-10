import React, { createContext, useContext, useState, useEffect } from 'react';
import authApi from '../api/authApi';
import { setAccessToken } from '../api/axios';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState(null);

  // Silent session restoration on initial application load or refresh
  useEffect(() => {
    let isMounted = true;

    const restoreSession = async () => {
      try {
        // Attempt silent refresh via the HttpOnly cookie
        const data = await authApi.refresh();
        if (isMounted && data?.user) {
          setUser(data.user);
        }
      } catch (err) {
        // Not an error to show user - simply means no active session cookie
        if (isMounted) {
          setUser(null);
          setAccessToken(null);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    restoreSession();

    return () => {
      isMounted = false;
    };
  }, []);

  const login = async (identifier, password) => {
    setLoading(true);
    setAuthError(null);
    try {
      const data = await authApi.login({ identifier, password });
      setUser(data.user);
      return { success: true, user: data.user };
    } catch (err) {
      const message = err.response?.data?.message || 'Failed to login. Please check your credentials.';
      setAuthError(message);
      return { success: false, message };
    } finally {
      setLoading(false);
    }
  };

  const register = async (username, email, password) => {
    setLoading(true);
    setAuthError(null);
    try {
      const data = await authApi.register({ username, email, password });
      setUser(data.user);
      return { success: true, user: data.user };
    } catch (err) {
      const message = err.response?.data?.message || 'Failed to register. Please check your details.';
      setAuthError(message);
      return { success: false, message };
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    setLoading(true);
    try {
      await authApi.logout();
    } catch (err) {
      console.warn('Logout error ignored during session cleanup:', err.message);
    } finally {
      setUser(null);
      setAccessToken(null);
      setLoading(false);
    }
  };

  const clearAuthError = () => {
    setAuthError(null);
  };

  const value = {
    user,
    loading,
    authError,
    isAuthenticated: !!user,
    isAdmin: user?.role === 'admin',
    login,
    register,
    logout,
    clearAuthError,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;

