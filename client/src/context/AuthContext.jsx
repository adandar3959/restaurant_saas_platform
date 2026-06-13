import { createContext, useContext, useReducer, useEffect } from 'react';
import axios from 'axios';

const API_BASE = 'http://localhost:5000/api/v1';

const AuthContext = createContext(null);

const initialState = {
  user: null,
  token: null,
  isLoading: false,
  error: null,
  isHydrated: false,
};

function authReducer(state, action) {
  switch (action.type) {
    case 'LOADING': return { ...state, isLoading: true, error: null };
    case 'LOGIN_SUCCESS': return { ...state, isLoading: false, error: null, user: action.payload.user, token: action.payload.token };
    case 'LOGOUT': return { ...initialState, isHydrated: true };
    case 'ERROR': return { ...state, isLoading: false, error: action.payload };
    case 'CLEAR_ERROR': return { ...state, error: null };
    case 'UPDATE_USER': return { ...state, user: { ...state.user, ...action.payload } };
    case 'SET_HYDRATED': return { ...state, isHydrated: true };
    default: return state;
  }
}

export function AuthProvider({ children }) {
  const [state, dispatch] = useReducer(authReducer, initialState);

  useEffect(() => {
    try {
      const token = localStorage.getItem('rms_token');
      const raw = localStorage.getItem('rms_user');
      if (token && raw) {
        const user = JSON.parse(raw);
        if (user && user.role) {
          dispatch({ type: 'LOGIN_SUCCESS', payload: { token, user } });
          axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        } else {
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

    // Global interceptor to catch suspended accounts securely at the API level
    const interceptor = axios.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 403 && error.response?.data?.message === 'RESTAURANT_SUSPENDED') {
          localStorage.removeItem('rms_token');
          localStorage.removeItem('rms_user');
          delete axios.defaults.headers.common['Authorization'];
          window.location.href = '/suspended';
        }
        return Promise.reject(error);
      }
    );

    return () => axios.interceptors.response.eject(interceptor);
  }, []);

  const login = async (email, password, restaurantId = null) => {
    dispatch({ type: 'LOADING' });
    try {
      const res = await axios.post(`${API_BASE}/auth/login`, { email, password, restaurantId });
      const { user, token } = res.data.data;

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

  const customerRegister = async (name, email, password, restaurantId = null) => {
    dispatch({ type: 'LOADING' });
    try {
      const res = await axios.post(`${API_BASE}/auth/customer/register`, {
        name, email, password, restaurantId,
      });
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

  const onboard = async ({ name, email, password, restaurantName, planType }) => {
    dispatch({ type: 'LOADING' });
    try {
      const res = await axios.post(`${API_BASE}/auth/onboard`, {
        name, email, password, restaurantName, planType,
      });
      const { user, token } = res.data.data;

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

  const logout = () => {
    axios.post(`${API_BASE}/auth/logout`).catch(err => console.error('Failed to log out on server:', err));
    localStorage.removeItem('rms_token');
    localStorage.removeItem('rms_user');
    delete axios.defaults.headers.common['Authorization'];
    dispatch({ type: 'LOGOUT' });
  };

  const clearError = () => dispatch({ type: 'CLEAR_ERROR' });

  const getDashboardRoute = (role, restaurantId) => {
    const r = (role || '').toLowerCase();
    if (r === 'superadmin') return '/superadmin';
    if (r === 'admin') return `/admin/${restaurantId}`;
    if (r === 'manager') return `/admin/${restaurantId}`;
    if (r === 'chef') return `/kitchen/${restaurantId}`;
    if (r === 'waiter') return `/waiter/${restaurantId}`;
    if (r === 'driver') return `/driver/${restaurantId}`;
    if (r === 'customer') return '/account';
    return '/';
  };

  const updateUser = async (userData) => {
    try {
      const res = await axios.patch(`${API_BASE}/auth/me`, userData);
      const updatedUser = res.data?.data || res.data;
      const newUser = { ...state.user, ...updatedUser };
      localStorage.setItem('rms_user', JSON.stringify(newUser));
      dispatch({ type: 'UPDATE_USER', payload: updatedUser });
      return { success: true };
    } catch (err) {
      console.error('Failed to update profile:', err);
      return { success: false, error: err.response?.data?.message || 'Update failed' };
    }
  };

  return (
    <AuthContext.Provider value={{ ...state, login, register, customerRegister, onboard, logout, clearError, updateUser, getDashboardRoute }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
