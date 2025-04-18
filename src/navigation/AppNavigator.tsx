import React from 'react';
import {NavigationContainer} from '@react-navigation/native';
import {createNativeStackNavigator} from '@react-navigation/native-stack';

import BoxesScreen from '../screens/BoxesScreen';
import AddCardScreen from '../screens/AddCardScreen';
import ReviewScreen from '../screens/ReviewScreen';
import BoxDetailsScreen from '../screens/BoxDetailsScreen';
import LearningSessionsScreen from '../screens/LearningSessionsScreen';
import ConfigureBoxIntervalsScreen from '../screens/ConfigureBoxIntervalsScreen';
import EditCardScreen from '../screens/EditCardScreen';
import {useTheme} from '../utils/ThemeContext';

export type RootStackParamList = {
  LearningSessions: undefined;
  Boxes: { sessionId: string };
  AddCard: { sessionId: string };
  Review: { sessionId: string };
  BoxDetails: { boxLevel: number; sessionId: string };
  ConfigureBoxIntervals: { sessionId: string };
  EditCard: { cardId: string };
};

const Stack = createNativeStackNavigator<RootStackParamList>();

const AppNavigator = () => {
  const {theme} = useTheme();
  
  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName="LearningSessions"
        screenOptions={{
          headerShown: false,
          contentStyle: {backgroundColor: theme.background},
          animation: 'slide_from_right',
        }}>
        <Stack.Screen name="LearningSessions" component={LearningSessionsScreen} />
        <Stack.Screen name="Boxes" component={BoxesScreen} />
        <Stack.Screen name="AddCard" component={AddCardScreen} />
        <Stack.Screen name="Review" component={ReviewScreen} />
        <Stack.Screen name="BoxDetails" component={BoxDetailsScreen} />
        <Stack.Screen name="ConfigureBoxIntervals" component={ConfigureBoxIntervalsScreen} />
        <Stack.Screen name="EditCard" component={EditCardScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default AppNavigator;
