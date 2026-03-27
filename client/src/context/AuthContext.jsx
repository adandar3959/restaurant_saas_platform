import { createContext, useContext, useReducer, useEffect } from 'react';
import axios from 'axios';

const API_BASE = 'http://localhost:5000/api/v1';

// ─── Context ───────────────────────────────────────────────────────────────
const AuthContext = createContext(null);

// ─── Reducer ───────────────────────────────────────────────────────────────
const initialState = {
  user: null,
  token: null,
  isLoading: false,
  error: null,
};

function authReducer(state, action) {
  switch (action.type) {
    case 'LOADING':
      return { ...state, isLoading: true, error: null };
    case 'LOGIN_SUCCESS':
      return { ...state, isLoading: false, user: action.payload.user, token: action.payload.token, error: null };
    case 'LOGOUT':
      return { ...initialState };
    case 'ERROR':
      return { ...state, isLoading: false, error: action.payload };
    case 'CLEAR_ERROR':
      return { ...state, error: null };
    case 'UPDATE_USER':
      return { ...state, user: { ...state.user, ...action.payload } };
    default:
      return state;
  }
}

// ─── Provider ──────────────────────────────────────────────────────────────
export function AuthProvider({ children }) {
  const [state, dispatch] = useReducer(authReducer, initialState);

  // Rehydrate from localStorage on mount
  useEffect(() => {
    const token = localStorage.getItem('rms_token');
    const user  = localStorage.getItem('rms_user');
    if (token && user) {
      dispatch({ type: 'LOGIN_SUCCESS', payload: { token, user: JSON.parse(user) } });
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    }
  }, []);

  // ── Login ──────────────────────────────────────────────────────────────
  const login = async (email, password) => {
    dispatch({ type: 'LOADING' });
    try {
      const { data } = await axios.post(`${API_BASE}/auth/login`, { email, password });
      const { token, data: userData } = data;

      localStorage.setItem('rms_token', token);
      localStorage.setItem('rms_user', JSON.stringify(userData));
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;

      dispatch({ type: 'LOGIN_SUCCESS', payload: { token, user: userData } });
      return { success: true, role: userData.role, restaurantId: userData.restaurantId };
    } catch (err) {
      const msg = err.response?.data?.message || 'Login failed. Please try again.';
      dispatch({ type: 'ERROR', payload: msg });
      return { success: false, error: msg };
    }
  };

  // ── Customer Signup ────────────────────────────────────────────────────
  const register = async (name, email, password) => {
    dispatch({ type: 'LOADING' });
    try {
      const { data } = await axios.post(`${API_BASE}/auth/register`, {
        name,
        email,
        passwordHash: password,
      });
      const { token, data: userData } = data;

      localStorage.setItem('rms_token', token);
      localStorage.setItem('rms_user', JSON.stringify(userData));
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;

      dispatch({ type: 'LOGIN_SUCCESS', payload: { token, user: userData } });
      return { success: true };
    } catch (err) {
      const msg = err.response?.data?.message || 'Registration failed. Please try again.';
      dispatch({ type: 'ERROR', payload: msg });
      return { success: false, error: msg };
    }
  };

  // ── Restaurant Onboarding (Admin + Restaurant in one shot) ─────────────
  const onboard = async ({ name, email, password, restaurantName, planType }) => {
    dispatch({ type: 'LOADING' });
    try {
      const { data } = await axios.post(`${API_BASE}/auth/onboard`, {
        name,
        email,
        password,
        restaurantName,
        planType,
      });
      const { token, data: userData } = data;

      localStorage.setItem('rms_token', token);
      localStorage.setItem('rms_user', JSON.stringify(userData));
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;

      dispatch({ type: 'LOGIN_SUCCESS', payload: { token, user: userData } });
      return { success: true };
    } catch (err) {
      const msg = err.response?.data?.message || 'Onboarding failed. Please try again.';
      dispatch({ type: 'ERROR', payload: msg });
      return { success: false, error: msg };
    }
  };

  // ── Logout ─────────────────────────────────────────────────────────────
  const logout = () => {
    localStorage.removeItem('rms_token');
    localStorage.removeItem('rms_user');
    delete axios.defaults.headers.common['Authorization'];
    dispatch({ type: 'LOGOUT' });
  };

  const clearError = () => dispatch({ type: 'CLEAR_ERROR' });

  // ── Role-based route helper ────────────────────────────────────────────
  const getDashboardRoute = (role, restaurantId) => {
    switch (role) {
      case 'SuperAdmin': return '/superadmin/dashboard';
      case 'Admin':      return `/admin/${restaurantId}/dashboard`;
      case 'Manager':    return `/manager/${restaurantId}/dashboard`;
      case 'Chef':       return `/kitchen/${restaurantId}`;
      case 'Waiter':     return `/waiter/${restaurantId}`;
      case 'Driver':     return `/driver/${restaurantId}`;
      case 'Customer':   return '/account';
      default:           return '/';
    }
  };

  return (
    <AuthContext.Provider value={{ ...state, login, register, onboard, logout, clearError, getDashboardRoute }}>
      {children}
    </AuthContext.Provider>
  );
}

// ─── Hook ──────────────────────────────────────────────────────────────────
export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
