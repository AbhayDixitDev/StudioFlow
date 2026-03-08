import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';

const JOBS_KEY = 'studioflow_jobs';

const useAppStore = create((set, get) => ({
  jobs: [],
  isLoading: true,

  loadJobs: async () => {
    try {
      const stored = await AsyncStorage.getItem(JOBS_KEY);
      if (stored) set({ jobs: JSON.parse(stored) });
    } catch {
      // ignore parse errors
    } finally {
      set({ isLoading: false });
    }
  },

  addJob: async (job) => {
    const jobs = [job, ...get().jobs].slice(0, 50);
    set({ jobs });
    await AsyncStorage.setItem(JOBS_KEY, JSON.stringify(jobs));
  },

  updateJob: async (id, updates) => {
    const jobs = get().jobs.map((j) => (j.id === id ? { ...j, ...updates } : j));
    set({ jobs });
    await AsyncStorage.setItem(JOBS_KEY, JSON.stringify(jobs));
  },

  clearJobs: async () => {
    set({ jobs: [] });
    await AsyncStorage.removeItem(JOBS_KEY);
  },
}));

export default useAppStore;
