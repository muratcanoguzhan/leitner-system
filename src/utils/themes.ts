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

// Helper function to get theme for a specific box level
export const getBoxTheme = (level: number): BoxTheme => {
  // Return the theme for the level, or default to the theme for level 1 if not found
  return BOX_THEMES[level] || BOX_THEMES[1];
};

// Application-wide component styling system
export const AppStyles = {
  // Containers
  container: {
    main: {
      flex: 1,
      backgroundColor: AppTheme.background,
    } as ViewStyle,
    card: {
      backgroundColor: AppTheme.white,
      borderRadius: 12,
      padding: 16,
      marginBottom: 15,
      elevation: 3,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 3,
    } as ViewStyle,
    modal: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
    } as ViewStyle,
    modalContent: {
      backgroundColor: AppTheme.white,
      borderRadius: 10,
      padding: 20,
      width: '80%',
      elevation: 5,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.25,
      shadowRadius: 3.84,
    } as ViewStyle,
  },
  
  // Headers
  header: {
    main: {
      padding: 20,
      backgroundColor: AppTheme.main,
      borderBottomLeftRadius: 15,
      borderBottomRightRadius: 15,
      elevation: 4,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.2,
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
      color: AppTheme.text.dark,
    } as TextStyle,
    subtitle: {
      fontSize: 16,
      color: AppTheme.text.light,
    } as TextStyle,
    header: {
      fontSize: 24,
      fontWeight: 'bold',
      color: AppTheme.white,
      textAlign: 'center',
    } as TextStyle,
    modalTitle: {
      fontSize: 20,
      fontWeight: 'bold',
      marginBottom: 20,
      color: AppTheme.text.dark,
      textAlign: 'center',
    } as TextStyle,
    regular: {
      fontSize: 16, 
      color: AppTheme.text.medium,
    } as TextStyle,
    small: {
      fontSize: 14, 
      color: AppTheme.text.light,
    } as TextStyle,
  },
  
  // Form elements
  form: {
    input: {
      backgroundColor: AppTheme.white,
      borderWidth: 1,
      borderColor: '#ddd',
      borderRadius: 8,
      padding: 12,
      fontSize: 16,
    } as TextStyle,
    label: {
      fontSize: 16,
      fontWeight: 'bold',
      marginBottom: 8,
      color: AppTheme.text.dark,
    } as TextStyle,
    textArea: {
      backgroundColor: AppTheme.white,
      borderWidth: 1,
      borderColor: '#ddd',
      borderRadius: 8,
      padding: 12,
      fontSize: 16,
      minHeight: 100,
      textAlignVertical: 'top',
    } as TextStyle,
  },
  
  // Buttons
  button: {
    primary: {
      backgroundColor: AppTheme.main,
      paddingVertical: 12,
      paddingHorizontal: 16,
      borderRadius: 8,
      alignItems: 'center',
      justifyContent: 'center',
    } as ViewStyle,
    secondary: {
      backgroundColor: '#ddd',
      paddingVertical: 12,
      paddingHorizontal: 16,
      borderRadius: 8,
      alignItems: 'center',
      justifyContent: 'center',
    } as ViewStyle,
    danger: {
      backgroundColor: AppTheme.danger,
      paddingVertical: 12,
      paddingHorizontal: 16,
      borderRadius: 8,
      alignItems: 'center',
      justifyContent: 'center',
    } as ViewStyle,
    success: {
      backgroundColor: AppTheme.success,
      paddingVertical: 12,
      paddingHorizontal: 16, 
      borderRadius: 8,
      alignItems: 'center',
      justifyContent: 'center',
    } as ViewStyle,
    primaryText: {
      color: AppTheme.white,
      fontWeight: 'bold',
      fontSize: 16,
    } as TextStyle,
    secondaryText: {
      color: AppTheme.text.dark,
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
      backgroundColor: AppTheme.white,
      borderRadius: 12,
      padding: 16,
      marginBottom: 12,
      elevation: 2,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.1,
      shadowRadius: 2,
      borderLeftWidth: 4,
    } as ViewStyle,
  },
  
  // Stats display
  stats: {
    container: {
      backgroundColor: AppTheme.white,
      borderRadius: 15,
      padding: 15,
      marginVertical: 10,
      elevation: 2,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 3,
    } as ViewStyle,
    row: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    } as ViewStyle,
    item: {
      alignItems: 'center',
      padding: 12,
    } as ViewStyle,
    value: {
      fontSize: 24,
      fontWeight: 'bold',
      color: AppTheme.text.dark,
    } as TextStyle,
    label: {
      fontSize: 14,
      color: AppTheme.text.light,
      marginTop: 4,
    } as TextStyle,
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
      color: AppTheme.text.light,
      marginTop: 10,
    } as TextStyle,
  },
}; 