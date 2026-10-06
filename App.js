import React, { useState, useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from './src/firebase';

import LoginScreen from './src/screens/LoginScreen';
import HomeScreen from './src/screens/HomeScreen';
import CreateWorkoutScreen from './src/screens/CreateWorkoutScreen';
import ActiveWorkoutScreen from './src/screens/ActiveWorkoutScreen';
import SummaryScreen from './src/screens/SummaryScreen';
import OneRMCalculatorScreen from './src/screens/OneRMCalculatorScreen';
import CardioZonesScreen from './src/screens/CardioZonesScreen';
import HistoryDetailsScreen from './src/screens/HistoryDetailsScreen';
import ChronoScreen from './src/screens/ChronoScreen';
import { ActivityIndicator, View } from 'react-native';

const Stack = createNativeStackNavigator();

export default function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#0bc0af" />
      </View>
    );
  }

  if (!user) {
    return <LoginScreen />;
  }

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
        <Stack.Screen name="Chrono" component={ChronoScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
