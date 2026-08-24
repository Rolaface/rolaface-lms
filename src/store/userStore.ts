import { create } from "zustand";

export interface LoginUser {
  userId: string;
  employeeId: string | null;
  firstName: string;
  lastName: string;
  roles?: string[];
  [key: string]: any;
}

interface UserState {
  user: LoginUser | null;
  setUser: (user: LoginUser | null) => void;
  clearUser: () => void;
}

export const useUserStore = create<UserState>((set) => ({
  user: null,
  setUser: (user) => set({ user }),
  clearUser: () => set({ user: null }),
}));