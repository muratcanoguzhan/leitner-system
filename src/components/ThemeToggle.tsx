import React from 'react';
import { TouchableOpacity, StyleSheet, Text, Animated, Easing } from 'react-native';
import { useTheme } from '../utils/ThemeContext';

type ThemeToggleProps = {
  style?: object;
};

const ThemeToggle: React.FC<ThemeToggleProps> = ({ style }) => {
  const { toggleTheme, isDarkMode, theme } = useTheme();
  const [animatedValue] = React.useState(new Animated.Value(isDarkMode ? 1 : 0));

  React.useEffect(() => {
    Animated.timing(animatedValue, {
      toValue: isDarkMode ? 1 : 0,
      duration: 250,
      easing: Easing.linear,
      useNativeDriver: false,
    }).start();
  }, [isDarkMode, animatedValue]);

  const translateX = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [2, 32]
  });

  const bgColor = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: ['#f5f5f5', '#222222']
  });

  return (
    <TouchableOpacity
      onPress={toggleTheme}
      style={[
        styles.container, 
        style
      ]}
      activeOpacity={0.7}
    >
      <Animated.View
        style={[
          styles.toggleContainer,
          {
            backgroundColor: bgColor,
            borderColor: theme.main,
            borderWidth: 2,
          }
        ]}
      >
        <Text style={styles.iconLeft}>☀️</Text>
        <Animated.View 
          style={[
            styles.toggleButton, 
            { 
              backgroundColor: theme.main,
              transform: [{ translateX }] 
            }
          ]} 
        />
        <Text style={styles.iconRight}>🌙</Text>
      </Animated.View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 4,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 20,
  },
  toggleContainer: {
    width: 70,
    height: 34,
    borderRadius: 17,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 5,
  },
  toggleButton: {
    width: 26,
    height: 26,
    borderRadius: 13,
    position: 'absolute',
  },
  iconLeft: {
    fontSize: 16,
    marginLeft: 4,
  },
  iconRight: {
    fontSize: 16,
    marginRight: 4,
  }
});

export default ThemeToggle; 