import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { useNavigation, useIsFocused } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function HomeScreen() {
  const navigation = useNavigation();
  const isFocused = useIsFocused();
  const [savedWorkouts, setSavedWorkouts] = useState([]);

  useEffect(() => {
    if (isFocused) {
      loadWorkouts();
    }
  }, [isFocused]);

  const loadWorkouts = async () => {
    try {
      const stored = await AsyncStorage.getItem('@workout_templates');
      if (stored) {
        setSavedWorkouts(JSON.parse(stored));
      }
    } catch (e) {
      console.error("Failed to load workouts", e);
    }
  };

  // Mock data for history
  const history = [
    { id: 1, date: '10 Nov 2023', name: 'Duration' },
    { id: 2, date: '27 Dec 2023', name: 'Duration' },
    { id: 3, date: '18 Dec 2023', name: 'Name' }
  ];

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Workout Buddy</Text>
      </View>
      
      <View style={styles.actionRow}>
        <TouchableOpacity 
          style={[styles.startBtn, { flex: 1, marginRight: 5 }]} 
          onPress={() => navigation.navigate('CreateWorkout')}>
          <Text style={styles.startBtnTxt}>+ CREATE NEW WORKOUT</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.startBtn, { flex: 1, marginLeft: 5, backgroundColor: '#ff9800' }]} 
          onPress={() => navigation.navigate('OneRMCalculator')}>
          <Text style={styles.startBtnTxt}>🔢 1RM CALCULATOR</Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity 
        style={[styles.startBtn, { backgroundColor: '#e91e63', marginBottom: 30 }]} 
        onPress={() => navigation.navigate('CardioZones')}>
        <Text style={[styles.startBtnTxt, {fontSize: 16}]}>❤️ CARDIO ZONES (Karvonen)</Text>
      </TouchableOpacity>

      <Text style={styles.sectionTitle}>Saved Workouts</Text>
      {savedWorkouts.length === 0 && <Text style={{marginBottom: 20, fontStyle: 'italic'}}>No saved workouts yet.</Text>}
      {savedWorkouts.map(workout => (
        <View key={workout.id} style={styles.savedCard}>
          <Text style={styles.savedTitle}>{workout.name}</Text>
          <TouchableOpacity 
            style={styles.launchBtn}
            onPress={() => navigation.navigate('ActiveWorkout', { workoutName: workout.name, exercises: workout.exercises })}>
            <Text style={styles.launchBtnTxt}>▶ START</Text>
          </TouchableOpacity>
        </View>
      ))}

      <Text style={styles.sectionTitle}>Progress History & Analysis</Text>
      
      {/* Fake Chart Area */}
      <View style={styles.chartCard}>
        <Text style={styles.chartTitle}>Strength Progression</Text>
        <View style={styles.chartPlaceholder}>
           <Text style={{color: '#999'}}>Chart placeholder (Max Squat, Bench)</Text>
        </View>
      </View>

      <Text style={styles.sectionTitle}>History</Text>
      {history.map(item => (
        <View key={item.id} style={styles.historyCard}>
          <View style={styles.historyIcon}><Text>📅</Text></View>
          <View>
            <Text style={styles.historyDate}>{item.date}</Text>
            <Text style={styles.historyName}>{item.name}</Text>
          </View>
        </View>
      ))}

    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5', padding: 15 },
  header: { alignItems: 'center', marginVertical: 20 },
  title: { fontSize: 28, fontWeight: 'bold', color: '#0bc0af' },
  actionRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20 },
  startBtn: { backgroundColor: '#0bc0af', padding: 15, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  startBtnTxt: { color: '#fff', fontSize: 12, fontWeight: 'bold', textAlign: 'center' },
  savedCard: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#fff', padding: 15, borderRadius: 10, marginBottom: 10 },
  savedTitle: { fontSize: 16, fontWeight: 'bold', color: '#333' },
  launchBtn: { backgroundColor: '#4caf50', paddingVertical: 8, paddingHorizontal: 15, borderRadius: 20 },
  launchBtnTxt: { color: '#fff', fontWeight: 'bold' },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: '#333', marginBottom: 10 },
  chartCard: { backgroundColor: '#fff', padding: 15, borderRadius: 10, marginBottom: 20 },
  chartTitle: { fontSize: 14, fontWeight: 'bold', marginBottom: 10 },
  chartPlaceholder: { height: 150, backgroundColor: '#f0f0f0', justifyContent: 'center', alignItems: 'center', borderRadius: 5 },
  historyCard: { flexDirection: 'row', backgroundColor: '#fff', padding: 15, borderRadius: 10, marginBottom: 10, alignItems: 'center' },
  historyIcon: { width: 40, height: 40, backgroundColor: '#e6f7f6', borderRadius: 20, justifyContent: 'center', alignItems: 'center', marginRight: 15 },
  historyDate: { fontSize: 16, fontWeight: 'bold', color: '#333' },
  historyName: { fontSize: 14, color: '#666' }
});
