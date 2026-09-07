import { create } from "zustand";
import type { RawSubscribedModules } from "../utils/subscriptionTypes";

export interface LoginUser {
  userId: string;
  employeeId: string | null;
  firstName: string;
  lastName: string;
  roles?: string[];
  subscribed_modules?: RawSubscribedModules;
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