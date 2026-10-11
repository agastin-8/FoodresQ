import { createContext, useContext, useState, useEffect } from 'react';
import { authApi } from '../services/api';

const AuthContext = createContext(null);

// Demo fallback users
export const DEMO_USERS = {
  donor: {
    id: 1,
    name: 'Green Kitchen Restaurant',
    email: 'donor@foodlink.demo',
    role: 'donor',
    location: 'Koramangala, Bangalore',
    lat: 12.9352,
    lng: 77.6245,
    phone: '+91 98765 43210',
  },
  ngo: {
    id: 2,
    name: 'FeedIndia Foundation',
    email: 'ngo@foodlink.demo',
    role: 'ngo',
    location: 'Indiranagar, Bangalore',
    lat: 12.9784,
    lng: 77.6408,
    phone: '+91 98765 43211',
    coverageArea: '10 km radius',
    capacity: 200,
    currentLoad: 45,
  },
  admin: {
    id: 3,
    name: 'FoodLink Admin',
    email: 'admin@foodlink.demo',
    role: 'admin',
  },
  volunteer: {
    id: 4,
    name: 'Ramesh Kumar',
    email: 'volunteer@foodlink.demo',
    role: 'volunteer',
    location: 'Koramangala, Bangalore',
    lat: 12.9350,
    lng: 77.6250,
    phone: '+91 98765 43213',
    vehicle: 'Honda Activa (KA-01-EQ-9876)',
  },
};

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      const saved = localStorage.getItem('foodlink_user');
      if (!saved || saved === 'undefined' || saved === 'null') {
        return DEMO_USERS.donor;
      }
      return JSON.parse(saved);
    } catch (e) {
      return DEMO_USERS.donor;
    }
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) {
      localStorage.setItem('foodlink_user', JSON.stringify(user));
    } else {
      localStorage.removeItem('foodlink_user');
      localStorage.removeItem('foodlink_token');
    }
  }, [user]);

  // Check current session on mount if token exists
  useEffect(() => {
    const token = localStorage.getItem('foodlink_token');
    if (token) {
      authApi
        .getMe()
        .then((res) => {
          if (res?.user) setUser(res.user);
        })
        .catch(() => {
          // Stay with current demo state
        });
    }
  }, []);

  const login = async (email, password, role) => {
    setLoading(true);
    try {
      const data = await authApi.login(email, password || 'password123', role);
      if (data?.user) {
        setUser(data.user);
        setLoading(false);
        return data.user;
      }
    } catch (err) {
      console.warn('Backend login fallback to local demo account:', err.message);
    }

    const demoUser = DEMO_USERS[role] || DEMO_USERS.donor;
    const localUser = { ...demoUser, email: email || demoUser.email };
    setUser(localUser);
    setLoading(false);
    return localUser;
  };

  const register = async (userData) => {
    setLoading(true);
    try {
      const data = await authApi.register(userData);
      if (data?.user) {
        setUser(data.user);
        setLoading(false);
        return data.user;
      }
    } catch (err) {
      console.warn('Backend register fallback to local demo:', err.message);
    }

    const newUser = {
      id: Date.now(),
      ...userData,
    };
    setUser(newUser);
    setLoading(false);
    return newUser;
  };

  const logout = () => {
    try {
      authApi.logout();
    } catch (e) {}
    localStorage.removeItem('foodlink_user');
    localStorage.removeItem('foodlink_token');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, register, logout, loading }}>
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
