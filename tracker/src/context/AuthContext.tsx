import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';
import { auth as firebaseAuth } from '../config/firebase'; // Import Firebase auth
import { GoogleAuthProvider, signInWithPopup, onAuthStateChanged, signOut as firebaseSignOut, updateProfile } from 'firebase/auth'; // Import Firebase auth methods

interface User {
  id: string;
  email: string;
  displayName: string;
  photoURL?: string;
  createdAt: string;
  settings?: {
    theme: 'light' | 'dark';
    emailNotifications: boolean;
    pushNotifications: boolean;
  };
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, displayName: string) => Promise<void>;
  logout: () => Promise<void>;
  googleLogin: () => Promise<void>;
  updateUserSettings: (settings: User['settings']) => Promise<void>;
  updateProfilePicture: (file: File) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Configure axios defaults
axios.defaults.baseURL = 'http://localhost:5007'; // Adjust this to match your backend URL

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [authToken, setAuthToken] = useState<string | null>(null);

  // Set up axios interceptor for token
  useEffect(() => {
    const interceptor = axios.interceptors.request.use(
      async (config) => {
        // Use stored auth token if available (for backend JWT)
        if (authToken) {
          config.headers.Authorization = `Bearer ${authToken}`;
        } else if (firebaseAuth.currentUser) {
          // Otherwise use Firebase token
          try {
            const token = await firebaseAuth.currentUser.getIdToken(true);
            config.headers.Authorization = `Bearer ${token}`;
          } catch (error) {
            console.error('Error getting Firebase token:', error);
          }
        }
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    // Add response interceptor to handle 401 errors
    const responseInterceptor = axios.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401) {
          // Clear user state and redirect to login
          setUser(null);
          setAuthToken(null);
          firebaseAuth.signOut();
        }
        return Promise.reject(error);
      }
    );

    return () => {
      axios.interceptors.request.eject(interceptor);
      axios.interceptors.response.eject(responseInterceptor);
    };
  }, [authToken]);

  const verifyUser = async (firebaseUser: any) => {
    try {
      const token = await firebaseUser.getIdToken(true);
      
      const response = await axios.post('/api/auth/verify-token', {
        token,
        firebaseUid: firebaseUser.uid,
        email: firebaseUser.email,
        displayName: firebaseUser.displayName,
        photoURL: firebaseUser.photoURL
      });

      // Store the backend JWT token for future requests
      setAuthToken(response.data.token);
      setUser(response.data.user);
      setError(null);
    } catch (err: any) {
      console.error("Error verifying user profile:", err);
      setError(err.response?.data?.message || 'Failed to verify profile');
      setUser(null);
      setAuthToken(null);
    }
  };

  // Listen to Firebase auth state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(firebaseAuth, async (firebaseUser) => {
      setLoading(true);
      try {
        if (firebaseUser) {
          await verifyUser(firebaseUser);
        } else {
          setUser(null);
          setAuthToken(null);
        }
      } catch (err) {
        console.error("Auth state change error:", err);
        setUser(null);
        setAuthToken(null);
      } finally {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  const googleLogin = async () => {
    setError(null);
    setLoading(true);
    try {
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({
        prompt: 'select_account'
      });
      const result = await signInWithPopup(firebaseAuth, provider);
      await verifyUser(result.user);
    } catch (err: any) {
      console.error("Google Sign-In error:", err);
      setError(err.message || 'Google sign-in failed');
      setUser(null);
      setAuthToken(null);
    } finally {
      setLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    try {
      setError(null);
      setLoading(true);
      const response = await axios.post('/api/auth/login', {
        email,
        password
      });
      
      // Store the backend JWT token
      setAuthToken(response.data.token);
      setUser(response.data.user);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Login failed');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const register = async (email: string, password: string, displayName: string) => {
    try {
      setError(null);
      setLoading(true);
      const response = await axios.post('/api/auth/register', {
        email,
        password,
        displayName
      });
      
      // Store the backend JWT token
      setAuthToken(response.data.token);
      setUser(response.data.user);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Registration failed');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      setError(null);
      setLoading(true);
      await firebaseSignOut(firebaseAuth);
      setUser(null);
      setAuthToken(null);
    } catch (err: any) {
      setError(err.message || 'Logout failed');
      console.error("Logout error:", err);
    } finally {
      setLoading(false);
    }
  };

  const updateProfilePicture = async (file: File) => {
    try {
      setError(null);
      setLoading(true);

      const formData = new FormData();
      formData.append('photo', file);

      const response = await axios.post('/api/auth/upload-photo', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      if (firebaseAuth.currentUser) {
        await updateProfile(firebaseAuth.currentUser, {
          photoURL: response.data.photoURL
        });
        await verifyUser(firebaseAuth.currentUser);
      }

    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to update profile picture');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const updateUserSettings = async (settings: User['settings']) => {
    try {
      const response = await axios.patch('/api/auth/settings', { settings });
      setUser(response.data.user);
    } catch (error: any) {
      setError(error.response?.data?.message || 'Failed to update settings');
      throw error;
    }
  };

  const value = {
    user,
    loading,
    error,
    login,
    register,
    logout,
    googleLogin,
    updateUserSettings,
    updateProfilePicture
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}; 
