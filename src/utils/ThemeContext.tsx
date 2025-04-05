import React, { createContext, useContext, useState, useEffect } from 'react';
import { useColorScheme, StatusBar } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ThemeMode, getAppStyles, getTheme } from './themes';

// Define the context type
type ThemeContextType = {
  themeMode: ThemeMode;
  toggleTheme: () => void;
  isDarkMode: boolean;
  styles: ReturnType<typeof getAppStyles>;
  theme: ReturnType<typeof getTheme>;
};

// Create context with default values
const ThemeContext = createContext<ThemeContextType>({
  themeMode: 'light',
  toggleTheme: () => {},
  isDarkMode: false,
  styles: getAppStyles('light'),
  theme: getTheme('light'),
});

// Theme storage key
const THEME_STORAGE_KEY = 'app_theme_mode';

// Theme provider component
export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Get device color scheme
  const deviceColorScheme = useColorScheme();
  
  // Initialize with system preference, fallback to light
  const [themeMode, setThemeMode] = useState<ThemeMode>(
    (deviceColorScheme as ThemeMode) || 'light'
  );

  // Load saved theme preference when component mounts
  useEffect(() => {
    const loadTheme = async () => {
      try {
        const savedTheme = await AsyncStorage.getItem(THEME_STORAGE_KEY);
        if (savedTheme !== null) {
          setThemeMode(savedTheme as ThemeMode);
        }
      } catch (error) {
        console.error('Failed to load theme preference:', error);
      }
    };
    
    loadTheme();
  }, []);

  // Save theme preference when it changes
  useEffect(() => {
    const saveTheme = async () => {
      try {
        await AsyncStorage.setItem(THEME_STORAGE_KEY, themeMode);
      } catch (error) {
        console.error('Failed to save theme preference:', error);
      }
    };
    
    saveTheme();
  }, [themeMode]);

  // Toggle between light and dark themes
  const toggleTheme = () => {
    setThemeMode(prev => (prev === 'light' ? 'dark' : 'light'));
  };

  // Get current theme and styles
  const styles = getAppStyles(themeMode);
  const theme = getTheme(themeMode);
  const isDarkMode = themeMode === 'dark';
  
  // Value to be provided by context
  const contextValue: ThemeContextType = {
    themeMode,
    toggleTheme,
    isDarkMode,
    styles,
    theme,
  };

  // Update StatusBar when theme changes
  useEffect(() => {
    StatusBar.setBarStyle(themeMode === 'dark' ? 'light-content' : 'dark-content');
    StatusBar.setBackgroundColor(themeMode === 'dark' ? '#121212' : theme.main);
  }, [themeMode, theme]);

  return (
    <ThemeContext.Provider value={contextValue}>
      {children}
    </ThemeContext.Provider>
  );
};

// Custom hook to use the theme context
export const useTheme = () => useContext(ThemeContext); 