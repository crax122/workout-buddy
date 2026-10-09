import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, TextInput } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import GlobalTimer from '../components/GlobalTimer';
import ExerciseItem from '../components/ExerciseItem';
import RestTimer from '../components/RestTimer';
import TimedExerciseItem from '../components/TimedExerciseItem';

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
    const updated = exercises.map((ex, idx) => {
      if (idx !== activeExIndex) return ex;
      const newCompletedSets = ex.completedSets + 1;
      return {
        ...ex,
        loggedSets: [...(ex.loggedSets || []), data],
        completedSets: newCompletedSets,
        completed: newCompletedSets >= ex.sets
      };
    });
    
    setExercises(updated);
    
    const allCompleted = updated.every(e => e.completed);
    
    if (allCompleted) {
      handleEndWorkout();
    } else {
      setIsResting(true);
    }
  };

  const handleAddSet = () => {
    const updated = exercises.map((ex, idx) => {
      if (idx !== activeExIndex) return ex;
      const targetReps = ex.targetReps ? [...ex.targetReps, ex.targetReps[ex.targetReps.length - 1] || 10] : [10];
      const newSets = ex.sets + 1;
      return {
        ...ex,
        sets: newSets,
        targetReps,
        completed: ex.completedSets >= newSets
      };
    });
    setExercises(updated);
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
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <GlobalTimer 
          isActive={timerActive} 
          onPause={() => setTimerActive(false)} 
          onPlay={() => setTimerActive(true)} 
          onEnd={handleEndWorkout} 
        />
        <TouchableOpacity style={styles.chronoBtn} onPress={() => navigation.navigate('Chrono')}>
          <Text style={styles.chronoBtnTxt}>⏱️</Text>
        </TouchableOpacity>
      </View>

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
          ) : activeExercise.type === 'time' ? (
            <TimedExerciseItem 
              exercise={activeExercise} 
              onComplete={() => {
                const updated = exercises.map((ex, idx) => {
                  if (idx !== activeExIndex) return ex;
                  return { ...ex, completed: true };
                });
                setExercises(updated);
                const allCompleted = updated.every(e => e.completed);
                if (allCompleted) handleEndWorkout();
                else setIsResting(true);
              }}
            />
          ) : (
            <ExerciseItem 
              exercise={activeExercise} 
              currentSet={activeExercise.completedSets + 1} 
              totalSets={activeExercise.sets} 
              previousData={activeExercise.prev}
              initialWeight={activeExercise.loggedSets && activeExercise.loggedSets.length > 0 ? activeExercise.loggedSets[activeExercise.loggedSets.length - 1].weight : '0'}
              initialReps={String(activeExercise.targetReps && activeExercise.targetReps.length > 0 ? (activeExercise.targetReps[activeExercise.completedSets] || 10) : 10)}
              onLogSet={handleLogSet}
              onAddSet={handleAddSet}
            />
          )}

          <View style={styles.notesContainer}>
            <TextInput
              style={styles.notesInput}
              placeholder="Notes / Ajustements pour cet exercice..."
              value={activeExercise.notes || ''}
              onChangeText={(text) => {
                const updated = [...exercises];
                updated[activeExIndex].notes = text;
                setExercises(updated);
              }}
              multiline
            />
          </View>
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
  container: { flex: 1, backgroundColor: '#f5f5f5', padding: 23 },
  mainArea: { flex: 1, flexDirection: 'column', marginTop: 15 },
  tabContainer: { backgroundColor: '#1b2a47', borderRadius: 23, marginBottom: 23, paddingVertical: 15 },
  tabScroll: { paddingHorizontal: 15, alignItems: 'center' },
  exTabItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 23, paddingHorizontal: 38, borderRadius: 45, marginRight: 23, backgroundColor: '#2d436a' },
  exTabActiveItem: { backgroundColor: '#0bc0af' },
  exListCheck: { color: '#fff', marginRight: 15, fontSize: 30 },
  exListDot: { color: '#a0a0a0', marginRight: 15, fontSize: 30 },
  exTabTxt: { color: '#ccc', fontSize: 33, fontWeight: 'bold' },
  exTabActiveTxt: { color: '#fff' },
  content: { flex: 1 },
  backBtn: { backgroundColor: '#999', padding: 38, borderRadius: 23, alignItems: 'center', marginTop: 23 },
  backBtnTxt: { color: '#fff', fontSize: 33, fontWeight: 'bold' },
  chronoBtn: { backgroundColor: '#2196F3', padding: 15, borderRadius: 15, marginLeft: 10, elevation: 2 },
  chronoBtnTxt: { fontSize: 30 },
  notesContainer: { marginTop: 15, backgroundColor: '#fff', padding: 15, borderRadius: 15 },
  notesInput: { fontSize: 24, color: '#333', minHeight: 80, textAlignVertical: 'top' }
});

