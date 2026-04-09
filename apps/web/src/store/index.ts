import { create } from 'zustand';
import type { User, KanbanBoard, Notification } from '../types';

interface AppState {
  user: User | null;
  token: string | null;
  kanban: KanbanBoard | null;
  notifications: Notification[];
  isAuthenticated: boolean;
  
  setUser: (user: User | null) => void;
  setToken: (token: string | null) => void;
  setKanban: (kanban: KanbanBoard | null) => void;
  setNotifications: (notifications: Notification[]) => void;
  logout: () => void;
}

export const useStore = create<AppState>((set) => ({
  user: null,
  token: localStorage.getItem('token'),
  kanban: null,
  notifications: [],
  isAuthenticated: !!localStorage.getItem('token'),
  
  setUser: (user) => set({ user, isAuthenticated: !!user }),
  setToken: (token) => {
    if (token) localStorage.setItem('token', token);
    else localStorage.removeItem('token');
    set({ token, isAuthenticated: !!token });
  },
  setKanban: (kanban) => set({ kanban }),
  setNotifications: (notifications) => set({ notifications }),
  logout: () => {
    localStorage.removeItem('token');
    set({ user: null, token: null, isAuthenticated: false, kanban: null });
  },
}));