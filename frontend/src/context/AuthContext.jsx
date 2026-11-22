import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api.js';

const AuthContext = createContext(null);

export const THAPAR_DEMO_ACCOUNTS = [
  {
    role: 'STUDENT',
    name: 'Aarav Sharma',
    email: 'student@thapar.edu',
    password: 'Thapar@2026',
    department: 'Computer Science & Engineering (CSED)',
    rollNumber: '102103456',
  },
  {
    role: 'FACULTY',
    name: 'Dr. Rajesh K. Bawa',
    email: 'faculty@thapar.edu',
    password: 'Thapar@2026',
    department: 'Computer Science & Engineering (CSED)',
    rollNumber: 'FAC-CSED-402',
  },
  {
    role: 'ADMIN',
    name: 'TIET Central Facilities & Estate Office',
    email: 'admin@thapar.edu',
    password: 'Thapar@2026',
    department: 'Estate & Administration Directorate',
    rollNumber: 'ADM-EST-01',
  },
];

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('resourcify_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [token, setToken] = useState(() => localStorage.getItem('resourcify_token') || null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) {
      localStorage.setItem('resourcify_user', JSON.stringify(user));
    } else {
      localStorage.removeItem('resourcify_user');
    }
  }, [user]);

  useEffect(() => {
    if (token) {
      localStorage.setItem('resourcify_token', token);
      localStorage.setItem('campusslot_token', token); // compatibility
    } else {
      localStorage.removeItem('resourcify_token');
      localStorage.removeItem('campusslot_token');
    }
  }, [token]);

  /**
   * Real login with email and password
   */
  const login = async (email, password) => {
    setLoading(true);
    try {
      const res = await api.post('/auth/login', { email, password });
      if (res.data?.success && res.data.data) {
        setUser(res.data.data.user);
        setToken(res.data.data.token);
        return { success: true, user: res.data.data.user };
      }
      return { success: false, error: res.data?.error || 'Login failed' };
    } catch (err) {
      return {
        success: false,
        error: err.response?.data?.error || err.message || 'Login failed. Please check your credentials.',
      };
    } finally {
      setLoading(false);
    }
  };

  /**
   * Real user registration for Thapar students & faculty
   */
  const register = async (userData) => {
    setLoading(true);
    try {
      const res = await api.post('/auth/register', userData);
      if (res.data?.success && res.data.data) {
        setUser(res.data.data.user);
        setToken(res.data.data.token);
        return { success: true, user: res.data.data.user };
      }
      return { success: false, error: res.data?.error || 'Registration failed' };
    } catch (err) {
      return {
        success: false,
        error: err.response?.data?.error || err.message || 'Registration failed.',
      };
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('resourcify_user');
    localStorage.removeItem('resourcify_token');
    localStorage.removeItem('campusslot_user');
    localStorage.removeItem('campusslot_token');
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        isAuthenticated: !!user,
        isAdmin: user?.role === 'ADMIN',
        isFaculty: user?.role === 'FACULTY',
        isStudent: user?.role === 'STUDENT',
        login,
        register,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
