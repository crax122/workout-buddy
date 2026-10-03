import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import GlobalTimer from '../components/GlobalTimer';
import ExerciseItem from '../components/ExerciseItem';
import RestTimer from '../components/RestTimer';

export default function ActiveWorkoutScreen() {
  const navigation = useNavigation();
  const [timerActive, setTimerActive] = useState(true);
  
  const [exercises, setExercises] = useState([
    { id: 1, name: 'Squats', sets: 4, completedSets: 1, prev: '40kg x 10', completed: false },
    { id: 2, name: 'Glute Bridges', sets: 3, completedSets: 0, prev: '20kg x 12', completed: false },
    { id: 3, name: 'Deadlifts', sets: 3, completedSets: 0, prev: '60kg x 8', completed: false },
  ]);

  const [activeExIndex, setActiveExIndex] = useState(0);
  const [isResting, setIsResting] = useState(false);

  const activeExercise = exercises[activeExIndex];

  const handleLogSet = (data) => {
    // Increment set
    const updated = [...exercises];
    updated[activeExIndex].completedSets += 1;
    
    if (updated[activeExIndex].completedSets >= updated[activeExIndex].sets) {
      updated[activeExIndex].completed = true;
      setExercises(updated);
      setIsResting(true);
    } else {
      setExercises(updated);
      setIsResting(true);
    }
  };

  const handleSkipRest = () => {
    setIsResting(false);
    if (exercises[activeExIndex].completed) {
      if (activeExIndex < exercises.length - 1) {
        setActiveExIndex(activeExIndex + 1);
      } else {
        // Workout Done!
        Alert.alert("Workout Completed!", "All exercises finished.");
      }
    }
  };

  const handleEndWorkout = () => {
    navigation.navigate('Summary');
  };

  return (
    <View style={styles.container}>
      <GlobalTimer 
        isActive={timerActive} 
        onPause={() => setTimerActive(false)} 
        onPlay={() => setTimerActive(true)} 
        onEnd={handleEndWorkout} 
      />

      <View style={styles.mainArea}>
        {/* Active List (Sidebar style or top bar) */}
        <View style={styles.sidebar}>
          <Text style={styles.sidebarTitle}>Mes Entrainements</Text>
          <ScrollView>
            {exercises.map((ex, idx) => (
              <TouchableOpacity key={ex.id} style={[styles.exListItem, idx === activeExIndex && styles.exListActiveItem]} onPress={() => { setActiveExIndex(idx); setIsResting(false); }}>
                {ex.completed ? <Text style={styles.exListCheck}>✓</Text> : <Text style={styles.exListDot}>•</Text>}
                <Text style={[styles.exListTxt, idx === activeExIndex && styles.exListActiveTxt]}>{ex.name}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        <View style={styles.content}>
          {isResting ? (
            <RestTimer 
              initialSeconds={60} 
              onSkip={handleSkipRest} 
              nextExercise={
                exercises[activeExIndex].completed && activeExIndex < exercises.length - 1 
                  ? exercises[activeExIndex+1].name 
                  : activeExercise.name
              }
            />
          ) : (
            <ExerciseItem 
              exercise={activeExercise} 
              currentSet={activeExercise.completedSets + 1} 
              totalSets={activeExercise.sets} 
              previousData={activeExercise.prev}
              onLogSet={handleLogSet}
            />
          )}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5', padding: 10 },
  mainArea: { flex: 1, flexDirection: 'row', marginTop: 10 },
  sidebar: { width: 120, backgroundColor: '#1b2a47', borderRadius: 10, padding: 5, marginRight: 10 },
  sidebarTitle: { color: '#fff', fontSize: 12, fontWeight: 'bold', marginBottom: 10, textAlign: 'center', marginTop: 5 },
  exListItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8, paddingHorizontal: 5, borderRadius: 5, marginBottom: 5 },
  exListActiveItem: { backgroundColor: '#0bc0af' },
  exListCheck: { color: '#a0a0a0', marginRight: 5, fontSize: 12 },
  exListDot: { color: '#a0a0a0', marginRight: 5, fontSize: 12 },
  exListTxt: { color: '#fff', fontSize: 12 },
  exListActiveTxt: { fontWeight: 'bold' },
  content: { flex: 1 }
});
