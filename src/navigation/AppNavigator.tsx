import React from 'react';
import {NavigationContainer} from '@react-navigation/native';
import {createNativeStackNavigator} from '@react-navigation/native-stack';

import HomeScreen from '../screens/HomeScreen';
import AddCardScreen from '../screens/AddCardScreen';
import ReviewScreen from '../screens/ReviewScreen';
import BoxDetailsScreen from '../screens/BoxDetailsScreen';
import LearningSessionsScreen from '../screens/LearningSessionsScreen';
import ConfigureBoxIntervalsScreen from '../screens/ConfigureBoxIntervalsScreen';

export type RootStackParamList = {
  LearningSessions: undefined;
  Home: { sessionId: string };
  AddCard: { sessionId: string };
  Review: { sessionId: string };
  BoxDetails: { boxLevel: number; sessionId: string };
  ConfigureBoxIntervals: { sessionId: string };
};

const Stack = createNativeStackNavigator<RootStackParamList>();

const AppNavigator = () => {
  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName="LearningSessions"
        screenOptions={{
          headerShown: false,
          contentStyle: {backgroundColor: '#f9f9f9'},
          animation: 'slide_from_right',
        }}>
        <Stack.Screen name="LearningSessions" component={LearningSessionsScreen} />
        <Stack.Screen name="Home" component={HomeScreen} />
        <Stack.Screen name="AddCard" component={AddCardScreen} />
        <Stack.Screen name="Review" component={ReviewScreen} />
        <Stack.Screen name="BoxDetails" component={BoxDetailsScreen} />
        <Stack.Screen name="ConfigureBoxIntervals" component={ConfigureBoxIntervalsScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default AppNavigator;
