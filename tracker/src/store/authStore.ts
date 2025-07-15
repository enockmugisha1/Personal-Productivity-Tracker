import { create } from 'zustand';
import { auth } from '../config/firebase';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  User
} from 'firebase/auth';
import toast from 'react-hot-toast';

interface AuthState {
  user: User | null;
  loading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  loading: true,
  error: null,

  login: async (email: string, password: string) => {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      set({ user: userCredential.user, error: null });
      toast.success('Logged in successfully');
    } catch (error: any) {
      set({ error: error.message });
      toast.error(error.message);
    }
  },

  register: async (email: string, password: string) => {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      set({ user: userCredential.user, error: null });
      toast.success('Account created successfully');
    } catch (error: any) {
      set({ error: error.message });
      toast.error(error.message);
    }
  },

  logout: async () => {
    try {
      await signOut(auth);
      set({ user: null, error: null });
      toast.success('Logged out successfully');
    } catch (error: any) {
      set({ error: error.message });
      toast.error(error.message);
    }
  },
}));

// Set up auth state listener
onAuthStateChanged(auth, (user) => {
  useAuthStore.setState({ user, loading: false });
}); 