import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { useNavigation, useIsFocused } from '@react-navigation/native';
import { auth } from '../firebase';
import { signOut } from 'firebase/auth';
import { getTemplates, getHistory, clearHistory as dbClearHistory, deleteHistoryItem } from '../services/db';

export default function HomeScreen() {
  const navigation = useNavigation();
  const isFocused = useIsFocused();
  const [savedWorkouts, setSavedWorkouts] = useState([]);
  const [history, setHistory] = useState([]);

  useEffect(() => {
    if (isFocused) {
      loadWorkouts();
      loadHistory();
    }
  }, [isFocused]);

  const loadWorkouts = async () => {
    const templates = await getTemplates();
    setSavedWorkouts(templates);
  };

  const loadHistory = async () => {
    const h = await getHistory();
    // Sort history by date if you want, assuming date string format can be sorted, or let's reverse it to show newest first
    setHistory(h.reverse());
  };

  const clearHistory = async () => {
    const success = await dbClearHistory();
    if (success) {
      setHistory([]);
    }
  };

  const handleLogout = async () => {
    await signOut(auth);
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Workout Buddy</Text>
        <TouchableOpacity onPress={handleLogout}>
          <Text style={{color: '#ff4d4d', fontWeight: 'bold'}}>Logout</Text>
        </TouchableOpacity>
      </View>
      
      <View style={styles.actionCol}>
        <TouchableOpacity 
          style={[styles.startBtn, { marginBottom: 10 }]} 
          onPress={() => navigation.navigate('CreateWorkout')}>
          <Text style={styles.startBtnTxt}>+ CREATE NEW WORKOUT</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.startBtn, { backgroundColor: '#ff9800', marginBottom: 10 }]} 
          onPress={() => navigation.navigate('OneRMCalculator')}>
          <Text style={styles.startBtnTxt}>🔢 1RM CALCULATOR</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.startBtn, { backgroundColor: '#2196F3' }]} 
          onPress={() => navigation.navigate('Chrono')}>
          <Text style={styles.startBtnTxt}>⏱️ CHRONO & TIMER</Text>
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
          <View style={{flexDirection: 'row', gap: 10, width: '100%'}}>
            <TouchableOpacity 
              style={[styles.launchBtn, {backgroundColor: '#ff9800'}]}
              onPress={() => navigation.navigate('CreateWorkout', { editWorkout: workout })}>
              <Text style={styles.launchBtnTxt}>✏️ EDIT</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.launchBtn}
              onPress={() => navigation.navigate('ActiveWorkout', { workoutName: workout.name, exercises: workout.exercises })}>
              <Text style={styles.launchBtnTxt}>▶ START</Text>
            </TouchableOpacity>
          </View>
        </View>
      ))}

      <View style={{flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10}}>
        <Text style={[styles.sectionTitle, {marginBottom: 0}]}>History</Text>
        {history.length > 0 && (
          <TouchableOpacity onPress={clearHistory}>
            <Text style={{color: '#ff4d4d', fontWeight: 'bold'}}>Clear</Text>
          </TouchableOpacity>
        )}
      </View>
      
      {history.length === 0 && <Text style={{marginBottom: 20, fontStyle: 'italic'}}>No workout history yet.</Text>}
      {history.map(item => (
        <View key={item.id} style={styles.historyCard}>
          <TouchableOpacity style={{flex: 1, flexDirection: 'row', alignItems: 'center'}} onPress={() => navigation.navigate('HistoryDetails', { historyItem: item })}>
            <View style={styles.historyIcon}><Text>📅</Text></View>
            <View>
              <Text style={styles.historyDate}>{item.date}</Text>
              <Text style={styles.historyName}>{item.name} - Vol: {item.volume} kg</Text>
            </View>
          </TouchableOpacity>
          <TouchableOpacity 
            style={{padding: 10, backgroundColor: '#ffe6e6', borderRadius: 10}}
            onPress={async () => {
              if (window.confirm("Voulez-vous vraiment supprimer cet historique ?")) {
                const success = await deleteHistoryItem(item);
                if (success) {
                  loadHistory();
                } else {
                  window.alert("Erreur lors de la suppression");
                }
              }
            }}
          >
            <Text style={{fontSize: 18, color: '#ff4d4d'}}>❌</Text>
          </TouchableOpacity>
        </View>
      ))}

    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5', padding: 16 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginVertical: 16 },
  title: { fontSize: 26, fontWeight: 'bold', color: '#0bc0af' },
  actionCol: { flexDirection: 'column', marginBottom: 10 },
  startBtn: { backgroundColor: '#0bc0af', padding: 15, borderRadius: 12, alignItems: 'center', justifyContent: 'center', elevation: 2 },
  startBtnTxt: { color: '#fff', fontSize: 16, fontWeight: 'bold', textAlign: 'center' },
  savedCard: { flexDirection: 'column', backgroundColor: '#fff', padding: 16, borderRadius: 14, marginBottom: 14, elevation: 2 },
  savedTitle: { fontSize: 18, fontWeight: 'bold', color: '#333', marginBottom: 12 },
  launchBtn: { flex: 1, backgroundColor: '#4caf50', paddingVertical: 12, paddingHorizontal: 14, borderRadius: 10, alignItems: 'center' },
  launchBtnTxt: { color: '#fff', fontWeight: 'bold', fontSize: 15 },
  sectionTitle: { fontSize: 20, fontWeight: 'bold', color: '#333', marginBottom: 12 },
  chartCard: { backgroundColor: '#fff', padding: 16, borderRadius: 14, marginBottom: 18 },
  chartTitle: { fontSize: 16, fontWeight: 'bold', marginBottom: 12 },
  chartPlaceholder: { height: 150, backgroundColor: '#f0f0f0', justifyContent: 'center', alignItems: 'center', borderRadius: 10 },
  historyCard: { flexDirection: 'row', backgroundColor: '#fff', padding: 14, borderRadius: 14, marginBottom: 10, alignItems: 'center', elevation: 1 },
  historyIcon: { width: 42, height: 42, backgroundColor: '#e6f7f6', borderRadius: 21, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  historyDate: { fontSize: 15, fontWeight: 'bold', color: '#333' },
  historyName: { fontSize: 14, color: '#666' }
});
