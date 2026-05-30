import { create } from 'zustand';

const useAuthStore = create((set, get) => ({
  user: null,
  token: null,
  isAuthenticated: false,
  loading: true,

  initialize: () => {
    if (typeof window !== 'undefined') {
      const storedToken = localStorage.getItem('agenthire_token');
      const storedUser = localStorage.getItem('agenthire_user');
      if (storedToken && storedUser) {
        set({
          token: storedToken,
          user: JSON.parse(storedUser),
          isAuthenticated: true,
          loading: false
        });
      } else {
        set({ loading: false });
      }
    } else {
      set({ loading: false });
    }
  },

  login: (userData, token) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('agenthire_token', token);
      localStorage.setItem('agenthire_user', JSON.stringify(userData));
    }
    set({
      user: userData,
      token,
      isAuthenticated: true,
      loading: false
    });
  },

  logout: () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('agenthire_token');
      localStorage.removeItem('agenthire_user');
    }
    set({
      user: null,
      token: null,
      isAuthenticated: false,
      loading: false
    });
  },

  getAuthHeaders: () => {
    const { token } = get();
    return token ? { 'Authorization': `Bearer ${token}` } : {};
  }
}));

export default useAuthStore;
