import React, { useMemo, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { saveHistory as dbSaveHistory } from '../services/db';

export default function SummaryScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const savedRef = useRef(false);
  
  const exercises = route.params?.exercises || [];
  const workoutName = route.params?.workoutName || 'Completed Workout';
  
  const totalVolume = useMemo(() => {
    let vol = 0;
    exercises.forEach(ex => {
      if (ex.loggedSets) {
        ex.loggedSets.forEach(set => {
          const w = parseFloat(set.weight) || 0;
          const r = parseFloat(set.reps) || 0;
          vol += (w * r);
        });
      }
    });
    return vol;
  }, [exercises]);

  useEffect(() => {
    if (!savedRef.current) {
      saveHistory();
      savedRef.current = true;
    }
  }, []);

  const saveHistory = async () => {
    const historyItem = {
      id: Date.now().toString(),
      date: new Date().toLocaleDateString(),
      name: workoutName,
      volume: totalVolume,
      exercises: exercises
    };
    
    await dbSaveHistory(historyItem);
  };

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <View style={styles.header}>
          <Text style={styles.title}>Workout Summary</Text>
        </View>

        <View style={styles.details}>
          <Text style={styles.detailText}>Volume: {totalVolume} kg</Text>
        </View>

        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.navigate('Home')}>
          <Text style={styles.backBtnTxt}>BACK TO HOME</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5', justifyContent: 'center', alignItems: 'center', padding: 20 },
  card: { backgroundColor: '#fff', width: '100%', borderRadius: 15, overflow: 'hidden', elevation: 5 },
  header: { backgroundColor: '#0bc0af', padding: 20, alignItems: 'center' },
  title: { color: '#fff', fontSize: 24, fontWeight: 'bold' },
  subtitle: { color: '#fff', fontSize: 18 },
  details: { padding: 30, alignItems: 'center' },
  detailText: { fontSize: 18, color: '#333', marginBottom: 10, fontWeight: 'bold' },
  backBtn: { backgroundColor: '#999', padding: 15, margin: 20, borderRadius: 25, alignItems: 'center' },
  backBtnTxt: { color: '#fff', fontSize: 16, fontWeight: 'bold' }
});
