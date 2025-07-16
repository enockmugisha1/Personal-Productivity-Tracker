import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useAuth } from './AuthContext';

type Theme = 'light' | 'dark' | 'system';

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
  setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, updateUserSettings } = useAuth();
  const [theme, setThemeState] = useState<Theme>('light');
  const [resolvedTheme, setResolvedTheme] = useState<'light' | 'dark'>('light');

  // Initialize theme from localStorage or user settings
  useEffect(() => {
    const storedTheme = localStorage.getItem('theme') as Theme;
    if (user?.settings?.theme) {
      setThemeState(user.settings.theme);
    } else if (storedTheme) {
      setThemeState(storedTheme);
    }
  }, [user]);

  // Handle system theme changes
  useEffect(() => {
    if (theme === 'system') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      const handleChange = (e: MediaQueryListEvent) => {
        setResolvedTheme(e.matches ? 'dark' : 'light');
      };

      // Set initial value
      setResolvedTheme(mediaQuery.matches ? 'dark' : 'light');

      // Listen for changes
      mediaQuery.addEventListener('change', handleChange);
      return () => mediaQuery.removeEventListener('change', handleChange);
    } else {
      setResolvedTheme(theme as 'light' | 'dark');
    }
  }, [theme]);

  // Apply theme class to the root element and save to localStorage
  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove('light', 'dark');
    root.classList.add(resolvedTheme);
    localStorage.setItem('theme', theme);
  }, [resolvedTheme, theme]);

  const setTheme = useCallback(async (newTheme: Theme) => {
    setThemeState(newTheme);
    if (user && updateUserSettings && user.settings) {
      await updateUserSettings({ 
        theme: newTheme === 'system' ? 'light' : newTheme, 
        emailNotifications: user.settings.emailNotifications || false,
        pushNotifications: user.settings.pushNotifications || false
      });
    }
  }, [user, updateUserSettings]);

  const toggleTheme = useCallback(async () => {
    const newTheme = theme === 'light' ? 'dark' : theme === 'dark' ? 'system' : 'light';
    await setTheme(newTheme);
  }, [theme, setTheme]);

  const value = { theme, toggleTheme, setTheme };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useThemeContext = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useThemeContext must be used within a ThemeProvider');
  }
  return context;
}; 
