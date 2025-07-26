import { create } from 'zustand';

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
  fetchStats: (apiClient: any) => Promise<void>;
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
  fetchStats: async (apiClient) => {
    try {
      set({ loading: true, error: null });
      
      const response = await apiClient.get('/api/stats');
      
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