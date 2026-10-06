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
            style={{padding: 25, backgroundColor: '#ffe6e6', borderRadius: 15}}
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
            <Text style={{fontSize: 36, color: '#ff4d4d'}}>❌</Text>
          </TouchableOpacity>
        </View>
      ))}

    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5', padding: 30 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginVertical: 45 },
  title: { fontSize: 54, fontWeight: 'bold', color: '#0bc0af' },
  actionCol: { flexDirection: 'column', marginBottom: 45 },
  startBtn: { backgroundColor: '#0bc0af', padding: 38, borderRadius: 23, alignItems: 'center', justifyContent: 'center', elevation: 3 },
  startBtnTxt: { color: '#fff', fontSize: 33, fontWeight: 'bold', textAlign: 'center' },
  savedCard: { flexDirection: 'column', backgroundColor: '#fff', padding: 38, borderRadius: 23, marginBottom: 30, elevation: 2 },
  savedTitle: { fontSize: 39, fontWeight: 'bold', color: '#333', marginBottom: 30 },
  launchBtn: { flex: 1, backgroundColor: '#4caf50', paddingVertical: 27, paddingHorizontal: 30, borderRadius: 18, alignItems: 'center' },
  launchBtnTxt: { color: '#fff', fontWeight: 'bold', fontSize: 30 },
  sectionTitle: { fontSize: 42, fontWeight: 'bold', color: '#333', marginBottom: 23 },
  chartCard: { backgroundColor: '#fff', padding: 30, borderRadius: 23, marginBottom: 38 },
  chartTitle: { fontSize: 30, fontWeight: 'bold', marginBottom: 23 },
  chartPlaceholder: { height: 300, backgroundColor: '#f0f0f0', justifyContent: 'center', alignItems: 'center', borderRadius: 15 },
  historyCard: { flexDirection: 'row', backgroundColor: '#fff', padding: 30, borderRadius: 23, marginBottom: 23, alignItems: 'center', elevation: 2 },
  historyIcon: { width: 90, height: 90, backgroundColor: '#e6f7f6', borderRadius: 45, justifyContent: 'center', alignItems: 'center', marginRight: 30 },
  historyDate: { fontSize: 33, fontWeight: 'bold', color: '#333' },
  historyName: { fontSize: 30, color: '#666' }
});
