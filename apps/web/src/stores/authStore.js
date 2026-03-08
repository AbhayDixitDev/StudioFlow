import { create } from 'zustand';
import * as authApi from '../services/authApi.js';

const getStoredToken = () => localStorage.getItem('accessToken') || null;
const getStoredRefresh = () => localStorage.getItem('refreshToken') || null;

export const useAuthStore = create((set, get) => ({
  user: null,
  token: getStoredToken(),
  refreshToken: getStoredRefresh(),
  isAuthenticated: !!getStoredToken(),
  isLoading: false,
  error: null,

  login: async (email, password) => {
    set({ isLoading: true, error: null });
    try {
      const data = await authApi.login(email, password);
      localStorage.setItem('accessToken', data.accessToken);
      localStorage.setItem('refreshToken', data.refreshToken);
      set({
        user: data.user,
        token: data.accessToken,
        refreshToken: data.refreshToken,
        isAuthenticated: true,
        isLoading: false,
      });
      return data;
    } catch (err) {
      set({ isLoading: false, error: err.message });
      throw err;
    }
  },

  register: async (displayName, email, password) => {
    set({ isLoading: true, error: null });
    try {
      const data = await authApi.register(displayName, email, password);
      localStorage.setItem('accessToken', data.accessToken);
      localStorage.setItem('refreshToken', data.refreshToken);
      set({
        user: data.user,
        token: data.accessToken,
        refreshToken: data.refreshToken,
        isAuthenticated: true,
        isLoading: false,
      });
      return data;
    } catch (err) {
      set({ isLoading: false, error: err.message });
      throw err;
    }
  },

  logout: () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    set({
      user: null,
      token: null,
      refreshToken: null,
      isAuthenticated: false,
      error: null,
    });
  },

  refreshAuth: async () => {
    const token = get().refreshToken;
    if (!token) return;
    try {
      const data = await authApi.refreshToken(token);
      localStorage.setItem('accessToken', data.accessToken);
      localStorage.setItem('refreshToken', data.refreshToken);
      set({ token: data.accessToken, refreshToken: data.refreshToken });
    } catch {
      get().logout();
    }
  },

  fetchUser: async () => {
    try {
      const user = await authApi.getMe();
      set({ user, isAuthenticated: true });
    } catch {
      get().logout();
    }
  },
}));
