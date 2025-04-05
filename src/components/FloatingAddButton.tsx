import React from 'react';
import { TouchableOpacity, StyleSheet, Text, ViewStyle } from 'react-native';
import { useTheme } from '../utils/ThemeContext';

interface FloatingAddButtonProps {
  onPress: () => void;
  style?: ViewStyle;
}

const FloatingAddButton: React.FC<FloatingAddButtonProps> = ({ onPress, style }) => {
  const { theme } = useTheme();
  
  return (
    <TouchableOpacity 
      style={[
        styles.addButton, 
        { 
          backgroundColor: theme.main,
          borderColor: 'rgba(255, 255, 255, 0.3)',
        },
        style
      ]} 
      onPress={onPress}
      activeOpacity={0.7}
    >
      <Text style={[styles.addButtonText, { color: '#000' }]}>+</Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  addButton: {
    position: 'absolute',
    bottom: 25,
    right: 25,
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    zIndex: 999,
    borderWidth: 2,
  },
  addButtonText: {
    fontSize: 32,
    fontWeight: 'bold',
    textAlign: 'center',
    lineHeight: 50,
  },
});

export default FloatingAddButton; 