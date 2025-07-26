import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';
import { auth as firebaseAuth } from '../config/firebase'; // Import Firebase auth
import { GoogleAuthProvider, signInWithPopup, onAuthStateChanged, signOut as firebaseSignOut, updateProfile } from 'firebase/auth'; // Import Firebase auth methods
import { API_CONFIG } from '../config/api';

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
  apiClient: typeof apiClient;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Create axios instance with proper configuration
const apiClient = axios.create({
  baseURL: API_CONFIG.baseURL,
  timeout: API_CONFIG.timeout,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [authToken, setAuthToken] = useState<string | null>(() => {
    // Initialize from localStorage if available
    return localStorage.getItem('authToken');
  });

  // Persist authToken to localStorage whenever it changes
  useEffect(() => {
    if (authToken) {
      localStorage.setItem('authToken', authToken);
    } else {
      localStorage.removeItem('authToken');
    }
  }, [authToken]);

  // Initialize authentication state on mount
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        // Check if we have a stored token
        const storedToken = localStorage.getItem('authToken');
        if (storedToken) {
          // Validate the token with the backend
          const response = await apiClient.get('/api/auth/me');
          setUser(response.data.user);
          setAuthToken(storedToken);
        }
      } catch (error) {
        // If token validation fails, clear it
        console.log('Token validation failed, clearing stored token');
        localStorage.removeItem('authToken');
        setAuthToken(null);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();
  }, []);

  // Set up apiClient interceptor for token
  useEffect(() => {
    const interceptor = apiClient.interceptors.request.use(
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
    const responseInterceptor = apiClient.interceptors.response.use(
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
      apiClient.interceptors.request.eject(interceptor);
      apiClient.interceptors.response.eject(responseInterceptor);
    };
  }, [authToken]);

  const verifyUser = async (firebaseUser: any) => {
    try {
      console.log('🔐 Getting Firebase ID token for user:', firebaseUser.email);
      const token = await firebaseUser.getIdToken(true);
      
      // Check if token is from the correct Firebase project
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        const tokenProjectId = payload.aud;
        const expectedProjectId = 'productivity-tracker-f6149';
        
        if (tokenProjectId !== expectedProjectId) {
          console.warn(`🚨 Token project mismatch! Expected: ${expectedProjectId}, Got: ${tokenProjectId}`);
          console.log('🧹 Signing out user to clear old project tokens...');
          
          // Sign out the user to clear the old tokens
          await firebaseSignOut(firebaseAuth);
          setUser(null);
          setAuthToken(null);
          setError('Authentication expired. Please sign in again.');
          return;
        }
      } catch (tokenParseError) {
        console.error('Error parsing token:', tokenParseError);
      }
      
      console.log('📤 Sending verification request to backend:', {
        firebaseUid: firebaseUser.uid,
        email: firebaseUser.email,
        displayName: firebaseUser.displayName,
        photoURL: firebaseUser.photoURL
      });
      
      const response = await apiClient.post('/api/auth/verify-token', {
        token,
        firebaseUid: firebaseUser.uid,
        email: firebaseUser.email,
        displayName: firebaseUser.displayName,
        photoURL: firebaseUser.photoURL
      });

      console.log('✅ Backend verification successful:', response.data.user);
      
      // Store the backend JWT token for future requests
      setAuthToken(response.data.token);
      setUser(response.data.user);
      setError(null);
    } catch (err: any) {
      console.error("❌ Error verifying user profile:", {
        message: err.message,
        status: err.response?.status,
        statusText: err.response?.statusText,
        data: err.response?.data,
        config: {
          url: err.config?.url,
          method: err.config?.method,
          baseURL: err.config?.baseURL
        }
      });
      setError(err.response?.data?.message || err.message || 'Failed to verify profile');
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
      const response = await apiClient.post('/api/auth/login', {
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
      const response = await apiClient.post('/api/auth/register', {
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

      const response = await apiClient.post('/api/auth/upload-photo', formData, {
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
      const response = await apiClient.patch('/api/auth/settings', { settings });
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
    updateProfilePicture,
    apiClient
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
