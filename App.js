import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import HomeScreen from './src/screens/HomeScreen';
import CreateWorkoutScreen from './src/screens/CreateWorkoutScreen';
import ActiveWorkoutScreen from './src/screens/ActiveWorkoutScreen';
import SummaryScreen from './src/screens/SummaryScreen';
import OneRMCalculatorScreen from './src/screens/OneRMCalculatorScreen';
import CardioZonesScreen from './src/screens/CardioZonesScreen';
import HistoryDetailsScreen from './src/screens/HistoryDetailsScreen';

const Stack = createNativeStackNavigator();

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Home" screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Home" component={HomeScreen} />
        <Stack.Screen name="CreateWorkout" component={CreateWorkoutScreen} />
        <Stack.Screen name="ActiveWorkout" component={ActiveWorkoutScreen} />
        <Stack.Screen name="Summary" component={SummaryScreen} />
        <Stack.Screen name="OneRMCalculator" component={OneRMCalculatorScreen} />
        <Stack.Screen name="CardioZones" component={CardioZonesScreen} />
        <Stack.Screen name="HistoryDetails" component={HistoryDetailsScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
