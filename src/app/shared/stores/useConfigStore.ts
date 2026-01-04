import { create } from 'zustand';
import { persist } from 'zustand/middleware';

type ConfigState = {
  companyId: string | null;
  userId: string | null;
  userName: string | null;
  setCompanyId: (id: string) => void;
  setUserData: (userId: string, userName: string) => void;
  clearUserData: () => void;
};

export const useConfigStore = create<ConfigState>()(
  persist(
    (set) => ({
      companyId: null,
      userId: null,
      userName: null,
      setCompanyId: (id: string) => set({ companyId: id }),
      setUserData: (userId: string, userName: string) => 
        set({ userId, userName }),
      clearUserData: () => 
        set({ userId: null, userName: null }),
    }),
    {
      name: 'config-store',
      storage: {
        getItem: (name) => {
          const item = sessionStorage.getItem(name);
          return item ? JSON.parse(item) : null;
        },
        setItem: (name, value) => {
          sessionStorage.setItem(name, JSON.stringify(value));
        },
        removeItem: (name) => {
          sessionStorage.removeItem(name);
        },
      },
    }
  )
);