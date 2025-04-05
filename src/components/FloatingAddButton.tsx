import React from 'react';
import { TouchableOpacity, StyleSheet, Text, ViewStyle } from 'react-native';
import { AppTheme } from '../utils/themes';

interface FloatingAddButtonProps {
  onPress: () => void;
  style?: ViewStyle;
}

const FloatingAddButton: React.FC<FloatingAddButtonProps> = ({ onPress, style }) => {
  return (
    <TouchableOpacity 
      style={[styles.addButton, style]} 
      onPress={onPress}
      activeOpacity={0.7}
    >
      <Text style={styles.addButtonText}>+</Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  addButton: {
    position: 'absolute',
    bottom: 25,
    right: 25,
    backgroundColor: AppTheme.main,
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3,
    zIndex: 999,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  addButtonText: {
    color: AppTheme.text.dark,
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
    lineHeight: 46,
  },
});

export default FloatingAddButton; 