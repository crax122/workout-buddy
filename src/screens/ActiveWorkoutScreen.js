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
    
    const allCompleted = updated.every(e => e.completed);
    
    if (allCompleted) {
      handleEndWorkout();
    } else {
      setIsResting(true);
    }
  };

  const handleSkipRest = () => {
    setIsResting(false);
    if (exercises[activeExIndex].completed) {
      if (activeExIndex < exercises.length - 1) {
        setActiveExIndex(activeExIndex + 1);
      }
    }
  };

  const handleEndWorkout = () => {
    // Pass both workoutName and exercises to calculate volume and save history.
    navigation.navigate('Summary', { 
      workoutName: route.params?.workoutName || 'My Workout', 
      exercises 
    });
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
        {/* Active List (Horizontal Scroll / Tabs style) */}
        <View style={styles.tabContainer}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabScroll}>
            {exercises.map((ex, idx) => (
              <TouchableOpacity 
                key={ex.id} 
                style={[styles.exTabItem, idx === activeExIndex && styles.exTabActiveItem]} 
                onPress={() => { setActiveExIndex(idx); setIsResting(false); }}
              >
                {ex.completed ? <Text style={styles.exListCheck}>✓</Text> : <Text style={styles.exListDot}>•</Text>}
                <Text style={[styles.exTabTxt, idx === activeExIndex && styles.exTabActiveTxt]}>{ex.name}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        <View style={styles.content}>
          {isResting ? (
            <RestTimer 
              initialSeconds={exercises[activeExIndex].restTime || 60} 
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
      <View style={{ flexDirection: 'row', gap: 10, marginTop: 10 }}>
        <TouchableOpacity style={[styles.backBtn, { flex: 1, marginTop: 0, backgroundColor: '#ff4d4d' }]} onPress={() => navigation.navigate('Home')}>
          <Text style={styles.backBtnTxt}>CANCEL WORKOUT</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.backBtn, { flex: 1, marginTop: 0, backgroundColor: '#4caf50' }]} onPress={handleEndWorkout}>
          <Text style={styles.backBtnTxt}>FINISH & SAVE</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5', padding: 10 },
  mainArea: { flex: 1, flexDirection: 'column', marginTop: 10 },
  tabContainer: { backgroundColor: '#1b2a47', borderRadius: 10, marginBottom: 10, paddingVertical: 5 },
  tabScroll: { paddingHorizontal: 10, alignItems: 'center' },
  exTabItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8, paddingHorizontal: 15, borderRadius: 20, marginRight: 10, backgroundColor: '#2d436a' },
  exTabActiveItem: { backgroundColor: '#0bc0af' },
  exListCheck: { color: '#fff', marginRight: 5, fontSize: 12 },
  exListDot: { color: '#a0a0a0', marginRight: 5, fontSize: 12 },
  exTabTxt: { color: '#ccc', fontSize: 14, fontWeight: 'bold' },
  exTabActiveTxt: { color: '#fff' },
  content: { flex: 1 },
  backBtn: { backgroundColor: '#999', padding: 15, borderRadius: 10, alignItems: 'center', marginTop: 10 },
  backBtnTxt: { color: '#fff', fontSize: 16, fontWeight: 'bold' }
});

