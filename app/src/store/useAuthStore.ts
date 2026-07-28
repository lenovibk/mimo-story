import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Child, Parent } from "@/types";

interface AuthState {
  token: string | null;
  parent: Parent | null;
  children: Child[];
  activeChildId: string | null;

  login: (token: string, parent: Parent, children: Child[]) => void;
  logout: () => void;
  setChildren: (children: Child[]) => void;
  addChild: (child: Child) => void;
  updateChild: (child: Child) => void;
  setActiveChild: (childId: string | null) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      parent: null,
      children: [],
      activeChildId: null,

      login: (token, parent, children) => set({ token, parent, children }),
      logout: () => set({ token: null, parent: null, children: [], activeChildId: null }),
      setChildren: (children) => set({ children }),
      addChild: (child) => set((state) => ({ children: [...state.children, child] })),
      updateChild: (child) =>
        set((state) => ({ children: state.children.map((c) => (c.id === child.id ? child : c)) })),
      setActiveChild: (childId) => set({ activeChildId: childId }),
    }),
    { name: "mimokids-auth" }
  )
);
