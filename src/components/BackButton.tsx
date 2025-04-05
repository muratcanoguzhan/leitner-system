import React from 'react';
import { TouchableOpacity, StyleSheet, Text, ViewStyle } from 'react-native';
import { AppTheme } from '../utils/themes';

interface BackButtonProps {
  onPress: () => void;
  style?: ViewStyle;
}

const BackButton: React.FC<BackButtonProps> = ({ onPress, style }) => {
  return (
    <TouchableOpacity 
      style={[styles.backButton, style]} 
      onPress={onPress}
      activeOpacity={0.7}
    >
      <Text style={styles.backButtonText}>←</Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  backButton: {
    backgroundColor: 'transparent', // Make the background transparent
    width: 40,
    height: 40,
    borderRadius: 5,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backButtonText: {
    color: AppTheme.white, // Use white color for better visibility on colored headers
    fontSize: 28,
    fontWeight: 'bold',
  },
});

export default BackButton; 