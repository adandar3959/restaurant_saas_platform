import { createContext, useContext, useReducer, useEffect } from 'react';
import axios from 'axios';

const API_BASE = 'http://localhost:5000/api/v1';

// API response shape from this backend:
//   { success: true, message: "...", data: { user: {...}, token: "..." } }
// So we always destructure as:  const { user, token } = response.data.data

const AuthContext = createContext(null);

// ─── Reducer ───────────────────────────────────────────────────────────────
const initialState = {
  user:       null,
  token:      null,
  isLoading:  false,
  error:      null,
  isHydrated: false,
};

function authReducer(state, action) {
  switch (action.type) {
    case 'LOADING':      return { ...state, isLoading: true, error: null };
    case 'LOGIN_SUCCESS':return { ...state, isLoading: false, error: null, user: action.payload.user, token: action.payload.token };
    case 'LOGOUT':       return { ...initialState, isHydrated: true };
    case 'ERROR':        return { ...state, isLoading: false, error: action.payload };
    case 'CLEAR_ERROR':  return { ...state, error: null };
    case 'UPDATE_USER':  return { ...state, user: { ...state.user, ...action.payload } };
    case 'SET_HYDRATED': return { ...state, isHydrated: true };
    default:             return state;
  }
}

// ─── Provider ──────────────────────────────────────────────────────────────
export function AuthProvider({ children }) {
  const [state, dispatch] = useReducer(authReducer, initialState);

  // Rehydrate from localStorage — SET_HYDRATED must always fire so guards unblock
  useEffect(() => {
    try {
      const token = localStorage.getItem('rms_token');
      const raw   = localStorage.getItem('rms_user');
      if (token && raw) {
        const user = JSON.parse(raw);
        // Validate that the stored object really is a user (has role)
        if (user && user.role) {
          dispatch({ type: 'LOGIN_SUCCESS', payload: { token, user } });
          axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        } else {
          // Stale / corrupted data — clear it
          localStorage.removeItem('rms_token');
          localStorage.removeItem('rms_user');
        }
      }
    } catch {
      localStorage.removeItem('rms_token');
      localStorage.removeItem('rms_user');
    } finally {
      dispatch({ type: 'SET_HYDRATED' });
    }
  }, []);

  // ── Login ──────────────────────────────────────────────────────────────
  // Backend: POST /auth/login → { success, message, data: { user, token } }
  const login = async (email, password) => {
    dispatch({ type: 'LOADING' });
    try {
      const res = await axios.post(`${API_BASE}/auth/login`, { email, password });
      const { user, token } = res.data.data; // ← correct extraction

      localStorage.setItem('rms_token', token);
      localStorage.setItem('rms_user', JSON.stringify(user));
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;

      dispatch({ type: 'LOGIN_SUCCESS', payload: { token, user } });
      return { success: true, role: user.role, restaurantId: user.restaurantId };
    } catch (err) {
      const msg = err.response?.data?.message || 'Login failed. Please try again.';
      dispatch({ type: 'ERROR', payload: msg });
      return { success: false, error: msg };
    }
  };

  // ── Customer Signup ────────────────────────────────────────────────────
  // Backend: POST /auth/register → { success, message, data: { user, token } }
  const register = async (name, email, password) => {
    dispatch({ type: 'LOADING' });
    try {
      const res = await axios.post(`${API_BASE}/auth/register`, { name, email, passwordHash: password });
      const { user, token } = res.data.data;

      localStorage.setItem('rms_token', token);
      localStorage.setItem('rms_user', JSON.stringify(user));
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;

      dispatch({ type: 'LOGIN_SUCCESS', payload: { token, user } });
      return { success: true };
    } catch (err) {
      const msg = err.response?.data?.message || 'Registration failed. Please try again.';
      dispatch({ type: 'ERROR', payload: msg });
      return { success: false, error: msg };
    }
  };

  // ── Onboard (Admin + Restaurant) ───────────────────────────────────────
  // Backend: POST /auth/onboard → { success, message, data: { user, tenant, token } }
  const onboard = async ({ name, email, password, restaurantName, planType }) => {
    dispatch({ type: 'LOADING' });
    try {
      const res = await axios.post(`${API_BASE}/auth/onboard`, {
        name, email, password, restaurantName, planType,
      });
      const { user, token } = res.data.data;
      // user.restaurantId is populated by the backend after tenant creation

      localStorage.setItem('rms_token', token);
      localStorage.setItem('rms_user', JSON.stringify(user));
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;

      dispatch({ type: 'LOGIN_SUCCESS', payload: { token, user } });
      return { success: true, restaurantId: user.restaurantId };
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

  // ── Role-based route helper (case-insensitive) ─────────────────────────
  const getDashboardRoute = (role, restaurantId) => {
    const r = (role || '').toLowerCase();
    if (r === 'superadmin')  return '/superadmin';
    if (r === 'admin')       return `/admin/${restaurantId}`;
    if (r === 'manager')     return `/admin/${restaurantId}`;
    if (r === 'chef')        return `/kitchen/${restaurantId}`;
    if (r === 'waiter')      return `/waiter/${restaurantId}`;
    if (r === 'driver')      return `/driver/${restaurantId}`;
    if (r === 'customer')    return '/account';
    return '/';
  };

  // ── Update User Local State ──────────────────────────────────────────
  const updateUser = (userData) => {
    // action.payload in UPDATE_USER is merged with existing user state
    const newUser = { ...state.user, ...userData };
    localStorage.setItem('rms_user', JSON.stringify(newUser));
    dispatch({ type: 'UPDATE_USER', payload: userData });
  };

  return (
    <AuthContext.Provider value={{ ...state, login, register, onboard, logout, clearError, updateUser, getDashboardRoute }}>
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
