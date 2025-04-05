// Define box color and style themes for use across the app
import { TextStyle, ViewStyle } from 'react-native';

export interface BoxTheme {
  bg: string;          // Background color
  border: string;      // Border color
  header: string;      // Header background color
  icon: string;        // Icon emoji
}

export type BoxThemes = {
  [key: number]: BoxTheme;
};

export type ThemeMode = 'light' | 'dark';

// App-wide theme colors
export const AppTheme = {
  main: '#ffcc00',      // Main app color (changed from #4ecdc4)
  background: '#f9f9f9',
  text: {
    dark: '#333',
    medium: '#555',
    light: '#666',
  },
  white: '#fff',
  danger: '#ff6b6b',
  success: '#66cc66',
  yellow: '#ffcc00',   // Yellow color for highlights and buttons
};

// Dark mode theme colors
export const DarkAppTheme = {
  main: '#ffcc00',      // Keep the main accent color
  background: '#121212',
  text: {
    dark: '#ffffff',    // Make this white for better contrast
    medium: '#e0e0e0',    // Lighter gray for better visibility
    light: '#b0b0b0',    // Medium light gray for secondary text
  },
  white: '#1e1e1e',     // This is now dark
  danger: '#ff6b6b',    // Keep same danger color
  success: '#66cc66',   // Keep same success color
  yellow: '#ffcc00',    // Keep same yellow
};

// Get current theme based on mode
export const getTheme = (mode: ThemeMode) => {
  return mode === 'light' ? AppTheme : DarkAppTheme;
};

// Central definition of box themes
export const BOX_THEMES: BoxThemes = {
  1: { 
    bg: '#ffefef', 
    border: '#ff9999', 
    header: '#ff7070', 
    icon: '🔄'        // Red theme - daily review
  },  
  2: { 
    bg: '#fff4e3', 
    border: '#ffcc80', 
    header: '#ffb347', 
    icon: '🕒'        // Orange theme - short interval
  },  
  3: { 
    bg: '#e8f5ff', 
    border: '#8ccdff', 
    header: '#5eb3f6', 
    icon: '📋'        // Blue theme - medium interval (clipboard)
  },  
  4: { 
    bg: '#f0ebff', 
    border: '#c5b3ff', 
    header: '#a68aff', 
    icon: '📘'        // Purple theme - longer interval (notebook)
  },  
  5: { 
    bg: '#e6ffe6', 
    border: '#99e699', 
    header: '#66cc66', 
    icon: '🏆'        // Green theme - mastery
  }
};

// Dark mode box themes
export const DARK_BOX_THEMES: BoxThemes = {
  1: { 
    bg: '#3a1f1f', 
    border: '#cc3333',    // Brighter border
    header: '#801a1a', 
    icon: '🔄'        // Red theme - daily review (darker)
  },  
  2: { 
    bg: '#332717', 
    border: '#cc8833',    // Brighter border
    header: '#995c12', 
    icon: '🕒'        // Orange theme - short interval (darker)
  },  
  3: { 
    bg: '#172331', 
    border: '#3377cc',    // Brighter border
    header: '#19497d', 
    icon: '📋'        // Blue theme - medium interval (darker)
  },  
  4: { 
    bg: '#221e33', 
    border: '#6633cc',    // Brighter border
    header: '#3d2980', 
    icon: '📘'        // Purple theme - longer interval (darker)
  },  
  5: { 
    bg: '#1c331c', 
    border: '#33cc33',    // Brighter border
    header: '#1f661f', 
    icon: '🏆'        // Green theme - mastery (darker)
  }
};

// Helper function to get theme for a specific box level
export const getBoxTheme = (level: number, mode: ThemeMode = 'light'): BoxTheme => {
  const themes = mode === 'light' ? BOX_THEMES : DARK_BOX_THEMES;
  // Return the theme for the level, or default to the theme for level 1 if not found
  return themes[level] || themes[1];
};

// Application-wide component styling system
export const getAppStyles = (mode: ThemeMode) => {
  const theme = getTheme(mode);
  
  return {
    // Containers
    container: {
      main: {
        flex: 1,
        backgroundColor: theme.background,
      } as ViewStyle,
      card: {
        backgroundColor: theme.white,
        borderRadius: 12,
        padding: 16,
        marginBottom: 15,
        elevation: 3,
        shadowColor: mode === 'light' ? '#000' : '#fff',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: mode === 'light' ? 0.1 : 0.05,
        shadowRadius: 3,
      } as ViewStyle,
    },
    
    // Headers
    header: {
      main: {
        padding: 20,
        backgroundColor: theme.main,
        borderBottomLeftRadius: 15,
        borderBottomRightRadius: 15,
        elevation: 4,
        shadowColor: mode === 'light' ? '#000' : '#fff',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: mode === 'light' ? 0.2 : 0.1,
        shadowRadius: 4,
      } as ViewStyle,
      content: {
        alignItems: 'center',
        paddingVertical: 5,
      } as ViewStyle,
    },
    
    // Text styles
    text: {
      title: {
        fontSize: 24,
        fontWeight: 'bold',
        color: theme.text.dark,
      } as TextStyle,
      subtitle: {
        fontSize: 16,
        color: theme.text.light,
      } as TextStyle,
      header: {
        fontSize: 24,
        fontWeight: 'bold',
        color: mode === 'light' ? theme.white : theme.text.dark,
        textAlign: 'center',
      } as TextStyle,
      regular: {
        fontSize: 16, 
        color: theme.text.medium,
      } as TextStyle,
      small: {
        fontSize: 14, 
        color: theme.text.light,
      } as TextStyle,
    },
    
    // Form elements
    form: {
      label: {
        fontSize: 16,
        fontWeight: 'bold',
        marginBottom: 8,
        color: theme.text.dark,
      } as TextStyle,
      textArea: {
        backgroundColor: theme.white,
        borderWidth: 1,
        borderColor: mode === 'light' ? '#ddd' : '#444',
        borderRadius: 8,
        padding: 12,
        fontSize: 16,
        minHeight: 100,
        textAlignVertical: 'top',
        color: theme.text.dark,
      } as TextStyle,
    },
    
    // Buttons
    button: {
      primary: {
        backgroundColor: theme.main,
        paddingVertical: 12,
        paddingHorizontal: 16,
        borderRadius: 8,
        alignItems: 'center',
        justifyContent: 'center',
      } as ViewStyle,
      secondary: {
        backgroundColor: mode === 'light' ? '#ddd' : '#444',
        paddingVertical: 12,
        paddingHorizontal: 16,
        borderRadius: 8,
        alignItems: 'center',
        justifyContent: 'center',
      } as ViewStyle,
      danger: {
        backgroundColor: theme.danger,
        paddingVertical: 12,
        paddingHorizontal: 16,
        borderRadius: 8,
        alignItems: 'center',
        justifyContent: 'center',
      } as ViewStyle,
      primaryText: {
        color: mode === 'light' ? theme.white : theme.text.dark,
        fontWeight: 'bold',
        fontSize: 16,
      } as TextStyle,
      secondaryText: {
        color: theme.text.dark,
        fontWeight: 'bold',
        fontSize: 16,
      } as TextStyle,
      disabled: {
        opacity: 0.7,
      } as ViewStyle,
    },
    
    // Lists and stats
    list: {
      container: {
        padding: 20,
      } as ViewStyle,
      item: {
        backgroundColor: theme.white,
        borderRadius: 12,
        padding: 16,
        marginBottom: 12,
        elevation: 2,
        shadowColor: mode === 'light' ? '#000' : '#fff',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: mode === 'light' ? 0.1 : 0.05,
        shadowRadius: 2,
        borderLeftWidth: 4,
      } as ViewStyle,
    },
    
    // Stats display
    stats: {
      container: {
        backgroundColor: theme.white,
        borderRadius: 15,
        padding: 15,
        marginVertical: 10,
        elevation: 2,
        shadowColor: mode === 'light' ? '#000' : '#fff',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: mode === 'light' ? 0.1 : 0.05,
        shadowRadius: 3,
      } as ViewStyle,
    },
    
    // Loading states
    loading: {
      container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
      } as ViewStyle,
      text: {
        fontSize: 16,
        color: theme.text.light,
        marginTop: 10,
      } as TextStyle,
    },
  };
};

// Default styles with light theme
export const AppStyles = getAppStyles('light'); 