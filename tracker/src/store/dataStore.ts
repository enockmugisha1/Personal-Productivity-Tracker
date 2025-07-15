import { create } from 'zustand';
import axios from 'axios';
import { auth as firebaseAuth } from '../config/firebase';

interface Stats {
  totalTasks: number;
  completedTasks: number;
  activeGoals: number;
  activeHabits: number;
  totalNotes: number;
}

interface DataState {
  stats: Stats;
  loading: boolean;
  error: string | null;
  fetchStats: () => Promise<void>;
}

const initialStats: Stats = {
  totalTasks: 0,
  completedTasks: 0,
  activeGoals: 0,
  activeHabits: 0,
  totalNotes: 0,
};

export const useDataStore = create<DataState>((set) => ({
  stats: initialStats,
  loading: false,
  error: null,
  fetchStats: async () => {
    try {
      // Check if user is authenticated
      if (!firebaseAuth.currentUser) {
        set({ error: 'User not authenticated', loading: false });
        return;
      }

      set({ loading: true, error: null });
      
      // Get fresh token (Firebase will handle token refresh automatically)
      const token = await firebaseAuth.currentUser.getIdToken(true);
      
      const response = await axios.get('/api/stats', {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      
      set({ stats: response.data, loading: false });
    } catch (error: any) {
      console.error('Failed to fetch stats', error);
      if (error.response?.status === 401) {
        set({ error: 'Authentication required', loading: false, stats: initialStats });
      } else {
        set({ error: 'Failed to fetch dashboard stats.', loading: false, stats: initialStats });
      }
    }
  },
})); 