// Define box color and style themes for use across the app
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