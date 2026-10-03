import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import GlobalTimer from '../components/GlobalTimer';
import ExerciseItem from '../components/ExerciseItem';
import RestTimer from '../components/RestTimer';

export default function ActiveWorkoutScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  
  const [timerActive, setTimerActive] = useState(true);
  
  // Use exercises from route params, or default fallback
  const [exercises, setExercises] = useState(route.params?.exercises || []);

  const [activeExIndex, setActiveExIndex] = useState(0);
  const [isResting, setIsResting] = useState(false);

  const activeExercise = exercises[activeExIndex];

  const handleLogSet = (data) => {
    const updated = [...exercises];
    const ex = updated[activeExIndex];
    
    // Initialize loggedSets array if not present
    if (!ex.loggedSets) ex.loggedSets = [];
    
    // Save the logged set data (weight, reps)
    ex.loggedSets.push(data);
    ex.completedSets += 1;
    
    if (ex.completedSets >= ex.sets) {
      ex.completed = true;
    }
    
    setExercises(updated);
    setIsResting(true);
  };

  const handleSkipRest = () => {
    setIsResting(false);
    if (exercises[activeExIndex].completed) {
      if (activeExIndex < exercises.length - 1) {
        setActiveExIndex(activeExIndex + 1);
      } else {
        Alert.alert("Workout Completed!", "All exercises finished.");
      }
    }
  };

  const handleEndWorkout = () => {
    // We don't have access to the exact seconds in GlobalTimer directly unless we lift the state up, 
    // but for now let's just pass the exercises to calculate volume.
    navigation.navigate('Summary', { exercises });
  };

  if (!activeExercise) {
    return (
      <View style={styles.container}>
        <Text>No exercises found.</Text>
        <TouchableOpacity onPress={() => navigation.navigate('Home')}><Text>Go Back</Text></TouchableOpacity>
      </View>
    );
  }

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
          <Text style={styles.sidebarTitle}>My Exercises</Text>
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
              initialWeight={activeExercise.loggedSets && activeExercise.loggedSets.length > 0 ? activeExercise.loggedSets[activeExercise.loggedSets.length - 1].weight : '0'}
              initialReps={String(activeExercise.targetReps ? activeExercise.targetReps[activeExercise.completedSets] || 10 : 10)}
              onLogSet={handleLogSet}
            />
          )}
        </View>
      </View>
      <TouchableOpacity style={styles.backBtn} onPress={() => navigation.navigate('Home')}>
        <Text style={styles.backBtnTxt}>BACK TO HOME</Text>
      </TouchableOpacity>
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
  content: { flex: 1 },
  backBtn: { backgroundColor: '#999', padding: 10, borderRadius: 10, alignItems: 'center', marginTop: 10 },
  backBtnTxt: { color: '#fff', fontSize: 16, fontWeight: 'bold' }
});
