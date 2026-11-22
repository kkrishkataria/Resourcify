import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api.js';

const AuthContext = createContext(null);

export const DEMO_PROFILES = [
  {
    id: 'demo-student-01',
    name: 'Alex Johnson',
    email: 'alex.student@campusslot.edu',
    role: 'STUDENT',
    department: 'Computer Science & Engineering',
  },
  {
    id: 'demo-faculty-01',
    name: 'Dr. Marcus Roberts',
    email: 'prof.roberts@campusslot.edu',
    role: 'FACULTY',
    department: 'Electrical Engineering & AI',
  },
  {
    id: 'demo-admin-01',
    name: 'Campus Operations Admin',
    email: 'admin@campusslot.edu',
    role: 'ADMIN',
    department: 'Facilities & Campus Administration',
  },
];

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('campusslot_user');
    return saved ? JSON.parse(saved) : DEMO_PROFILES[0];
  });
  const [token, setToken] = useState(() => localStorage.getItem('campusslot_token') || 'mock-jwt-student-demo-student-01');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) {
      localStorage.setItem('campusslot_user', JSON.stringify(user));
    } else {
      localStorage.removeItem('campusslot_user');
    }
  }, [user]);

  useEffect(() => {
    if (token) {
      localStorage.setItem('campusslot_token', token);
    } else {
      localStorage.removeItem('campusslot_token');
    }
  }, [token]);

  const switchProfile = (profile) => {
    setUser(profile);
    const mockToken = `mock-jwt-${profile.role.toLowerCase()}-${profile.id}`;
    setToken(mockToken);
  };

  const loginWithCredentials = async (email, role) => {
    setLoading(true);
    try {
      const res = await api.post('/auth/login', { email, role });
      if (res.data?.success && res.data.data) {
        setUser(res.data.data.user);
        setToken(res.data.data.token);
        return { success: true };
      }
      return { success: false, error: 'Login failed' };
    } catch (err) {
      return { success: false, error: err.response?.data?.error || err.message };
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
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
        switchProfile,
        loginWithCredentials,
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
