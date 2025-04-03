import React from 'react';
import {NavigationContainer} from '@react-navigation/native';
import {createNativeStackNavigator} from '@react-navigation/native-stack';

import HomeScreen from '../screens/HomeScreen';
import AddCardScreen from '../screens/AddCardScreen';
import ReviewScreen from '../screens/ReviewScreen';
import BoxDetailsScreen from '../screens/BoxDetailsScreen';
import LeitnerSystemsScreen from '../screens/LeitnerSystemsScreen';

export type RootStackParamList = {
  LeitnerSystems: undefined;
  Home: { systemId: string };
  AddCard: { systemId: string };
  Review: { systemId: string };
  BoxDetails: { boxLevel: number; systemId: string };
};

const Stack = createNativeStackNavigator<RootStackParamList>();

const AppNavigator = () => {
  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName="LeitnerSystems"
        screenOptions={{
          headerShown: false,
          contentStyle: {backgroundColor: '#f9f9f9'},
          animation: 'slide_from_right',
        }}>
        <Stack.Screen name="LeitnerSystems" component={LeitnerSystemsScreen} />
        <Stack.Screen name="Home" component={HomeScreen} />
        <Stack.Screen name="AddCard" component={AddCardScreen} />
        <Stack.Screen name="Review" component={ReviewScreen} />
        <Stack.Screen name="BoxDetails" component={BoxDetailsScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default AppNavigator;
