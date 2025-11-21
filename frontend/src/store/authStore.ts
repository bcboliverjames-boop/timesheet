import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface User {
  id: string;
  email: string;
  name: string;
  role: string;
}

interface Tenant {
  id: string;
  name: string;
  subdomain: string;
}

interface AuthState {
  token: string | null;
  user: User | null;
  tenant: Tenant | null;
  isAuthenticated: boolean;
  login: (token: string, user: User, tenant: Tenant) => void;
  logout: () => void;
  updateUser: (user: Partial<User>) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      user: null,
      tenant: null,
      isAuthenticated: false,
      login: (token, user, tenant) => {
        set({
          token,
          user,
          tenant,
          isAuthenticated: true,
        });
      },
      logout: () => {
        set({
          token: null,
          user: null,
          tenant: null,
          isAuthenticated: false,
        });
      },
      updateUser: (user) => {
        set((state) => ({
          user: state.user ? { ...state.user, ...user } : null,
        }));
      },
    }),
    {
      name: 'auth-storage',
    }
  )
);

