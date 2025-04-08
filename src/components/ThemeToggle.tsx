import React from 'react';
import { TouchableOpacity, StyleSheet, Animated, Easing, View, Text } from 'react-native';
import { useTheme } from '../utils/ThemeContext';

type ThemeToggleProps = {
  style?: object;
};

const ThemeToggle: React.FC<ThemeToggleProps> = ({ style }) => {
  const { toggleTheme, isDarkMode } = useTheme();
  const [animValue] = React.useState(new Animated.Value(isDarkMode ? 1 : 0));

  React.useEffect(() => {
    Animated.timing(animValue, {
      toValue: isDarkMode ? 1 : 0,
      duration: 400,
      easing: Easing.bezier(0.4, 0.0, 0.2, 1),
      useNativeDriver: true,
    }).start();
  }, [isDarkMode, animValue]);

  const sunOpacity = animValue.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 0]
  });

  const moonOpacity = animValue.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 1]
  });

  const rotate = animValue.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg']
  });

  const translateY = animValue.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0, -8, 0]
  });

  return (
    <TouchableOpacity
      onPress={toggleTheme}
      style={[
        styles.container, 
        style
      ]}
      activeOpacity={0.7}
      hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
    >
      <View style={styles.iconWrapper}>
        {/* Sun Icon */}
        <Animated.View 
          style={[
            styles.iconPosition,
            {
              opacity: sunOpacity,
              transform: [
                { rotate },
                { translateY }
              ]
            }
          ]}
        >
          <Text style={[
            styles.emojiIcon,
            isDarkMode ? styles.darkShadow : styles.lightShadow
          ]}>☀️</Text>
        </Animated.View>

        {/* Moon Icon */}
        <Animated.View 
          style={[
            styles.iconPosition,
            {
              opacity: moonOpacity,
              transform: [
                { rotate: rotate },
                { translateY }
              ]
            }
          ]}
        >
          <Text style={[
            styles.emojiIcon,
            isDarkMode ? styles.darkShadow : styles.lightShadow
          ]}>🌙</Text>
        </Animated.View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconWrapper: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconPosition: {
    position: 'absolute',
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emojiIcon: {
    fontSize: 24
  },
  lightShadow: {
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
  darkShadow: {
    textShadowColor: 'rgba(0, 0, 0, 0.7)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  }
});

export default ThemeToggle; 