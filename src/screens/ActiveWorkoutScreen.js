import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, TextInput } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import GlobalTimer from '../components/GlobalTimer';
import ExerciseItem from '../components/ExerciseItem';
import RestTimer from '../components/RestTimer';
import TimedExerciseItem from '../components/TimedExerciseItem';
import { getHistory, enrichExercisesWithHistory, saveLocalWeights, saveExerciseNote } from '../services/db';

export default function ActiveWorkoutScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const workoutName = route.params?.workoutName || 'My Workout';
  
  const [timerActive, setTimerActive] = useState(true);
  const draftsRef = useRef({});
  const noteTimeoutRef = useRef(null);
  
  // Use exercises from route params, enriched with any cached previous weights and notes
  const [exercises, setExercises] = useState(() => {
    const raw = route.params?.exercises || [];
    const enriched = enrichExercisesWithHistory(raw, [], workoutName);
    return enriched.map(ex => ({
      ...ex,
      completed: false,
      completedSets: 0,
      loggedSets: []
    }));
  });

  const [activeExIndex, setActiveExIndex] = useState(0);
  const [isResting, setIsResting] = useState(false);

  useEffect(() => {
    let mounted = true;
    getHistory().then(history => {
      if (!mounted || !history || history.length === 0) return;
      setExercises(prev => {
        const enriched = enrichExercisesWithHistory(prev, history, workoutName);
        return prev.map((ex, idx) => {
          const enr = enriched[idx] || {};
          const shouldTakeEnrichedNote =
            (enr.noteUpdatedAt || 0) >= (ex.noteUpdatedAt || 0) &&
            (!ex.notes || enr.notes);
          return {
            ...ex,
            lastWeight: enr.lastWeight ?? ex.lastWeight,
            previousLoggedSets: enr.previousLoggedSets ?? ex.previousLoggedSets,
            prev: enr.prev ?? ex.prev,
            notes: shouldTakeEnrichedNote ? (enr.notes ?? ex.notes ?? '') : (ex.notes ?? ''),
            ...(shouldTakeEnrichedNote && enr.noteUpdatedAt ? { noteUpdatedAt: enr.noteUpdatedAt } : {})
          };
        });
      });
    });
    return () => {
      mounted = false;
      if (noteTimeoutRef.current) clearTimeout(noteTimeoutRef.current);
    };
  }, [workoutName]);

  const activeExercise = exercises[activeExIndex];

  const handleNoteChange = (text) => {
    const now = Date.now();
    const currentEx = exercises[activeExIndex];
    const updatedEx = {
      ...currentEx,
      notes: text,
      noteUpdatedAt: now
    };
    const updated = exercises.map((ex, idx) => (idx === activeExIndex ? updatedEx : ex));
    setExercises(updated);
    saveLocalWeights([updatedEx]);

    if (noteTimeoutRef.current) clearTimeout(noteTimeoutRef.current);
    noteTimeoutRef.current = setTimeout(() => {
      saveExerciseNote(updatedEx, text);
    }, 400);
  };

  const getInitialWeight = (ex) => {
    if (!ex) return '0';
    const setIdx = ex.completedSets || 0;
    const prevSets = ex.previousLoggedSets || [];
    if (ex.loggedSets && ex.loggedSets.length > 0) {
      const lastLogged = ex.loggedSets[ex.loggedSets.length - 1];
      if (
        setIdx > 0 &&
        prevSets[setIdx - 1] &&
        String(lastLogged.weight) === String(prevSets[setIdx - 1].weight) &&
        prevSets[setIdx]?.weight !== undefined
      ) {
        return String(prevSets[setIdx].weight);
      }
      return String(lastLogged.weight);
    }
    if (prevSets.length > 0 && prevSets[0].weight !== undefined) {
      return String(prevSets[0].weight);
    }
    if (ex.lastWeight !== undefined && ex.lastWeight !== null && ex.lastWeight !== '') {
      return String(ex.lastWeight);
    }
    return '0';
  };

  const handleLogSet = (data) => {
    const updated = exercises.map((ex, idx) => {
      if (idx !== activeExIndex) return ex;
      const newCompletedSets = ex.completedSets + 1;
      const newLoggedSets = [...(ex.loggedSets || []), data];
      const updatedEx = {
        ...ex,
        loggedSets: newLoggedSets,
        completedSets: newCompletedSets,
        completed: newCompletedSets >= ex.sets
      };
      saveLocalWeights([updatedEx]);
      return updatedEx;
    });
    
    setExercises(updated);
    
    const allCompleted = updated.every(e => e.completed);
    
    if (allCompleted) {
      handleEndWorkout(updated);
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

  const handleEndWorkout = (finalExercises) => {
    const baseExercises = Array.isArray(finalExercises) ? finalExercises : exercises;
    const exercisesToSave = baseExercises.map(ex => {
      if (ex.type !== 'time' && (!ex.loggedSets || ex.loggedSets.length === 0)) {
        const draft = draftsRef.current[ex.id];
        if (draft && draft.weight !== undefined && String(draft.weight) !== '0' && String(draft.weight).trim() !== '') {
          return {
            ...ex,
            loggedSets: [{ weight: String(draft.weight), reps: String(draft.reps || '10') }]
          };
        }
      }
      return ex;
    });

    saveLocalWeights(exercisesToSave);

    navigation.navigate('Summary', { 
      workoutName, 
      exercises: exercisesToSave
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
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 40 }}>
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
              key={activeExercise.id}
              exercise={activeExercise}
              onAdjustTime={(deltaSeconds, newRemainingSeconds) => {
                setExercises(prevExercises => prevExercises.map((ex, idx) => {
                  if (idx !== activeExIndex) return ex;
                  const currentDuration = ex.durationSeconds || 300;
                  return {
                    ...ex,
                    durationSeconds: Math.max(0, currentDuration + deltaSeconds),
                    remainingSeconds: newRemainingSeconds
                  };
                }));
              }}
              onComplete={() => {
                const updated = exercises.map((ex, idx) => {
                  if (idx !== activeExIndex) return ex;
                  return { ...ex, completed: true, remainingSeconds: 0 };
                });
                setExercises(updated);
                const allCompleted = updated.every(e => e.completed);
                if (allCompleted) handleEndWorkout(updated);
                else setIsResting(true);
              }}
            />
          ) : (
            <ExerciseItem 
              key={`${activeExercise.id}-${activeExercise.completedSets}`}
              exercise={activeExercise} 
              currentSet={activeExercise.completedSets + 1} 
              totalSets={activeExercise.sets} 
              previousData={activeExercise.prev || 'No previous data'}
              initialWeight={getInitialWeight(activeExercise)}
              initialReps={String(activeExercise.targetReps && activeExercise.targetReps.length > 0 ? (activeExercise.targetReps[activeExercise.completedSets] || 10) : 10)}
              onLogSet={handleLogSet}
              onAddSet={handleAddSet}
              onDraftChange={(exId, draft) => {
                draftsRef.current[exId] = draft;
              }}
            />
          )}

          <View style={styles.notesContainer}>
            <Text style={styles.notesLabel}>📝 Note ({activeExercise.name}) :</Text>
            <TextInput
              style={styles.notesInput}
              placeholder="Écrire ou modifier une note pour cet exercice..."
              value={activeExercise.notes || ''}
              onChangeText={handleNoteChange}
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
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5', padding: 14 },
  mainArea: { flex: 1, flexDirection: 'column', marginTop: 8 },
  tabContainer: { backgroundColor: '#1b2a47', borderRadius: 14, marginBottom: 12, paddingVertical: 8 },
  tabScroll: { paddingHorizontal: 10, alignItems: 'center' },
  exTabItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, paddingHorizontal: 16, borderRadius: 20, marginRight: 10, backgroundColor: '#2d436a' },
  exTabActiveItem: { backgroundColor: '#0bc0af' },
  exListCheck: { color: '#fff', marginRight: 6, fontSize: 16 },
  exListDot: { color: '#a0a0a0', marginRight: 6, fontSize: 16 },
  exTabTxt: { color: '#ccc', fontSize: 15, fontWeight: 'bold' },
  exTabActiveTxt: { color: '#fff' },
  content: { flex: 1 },
  backBtn: { backgroundColor: '#999', padding: 15, borderRadius: 12, alignItems: 'center', marginTop: 12 },
  backBtnTxt: { color: '#fff', fontSize: 15, fontWeight: 'bold' },
  chronoBtn: { backgroundColor: '#2196F3', padding: 12, borderRadius: 12, marginLeft: 8, elevation: 2 },
  chronoBtnTxt: { fontSize: 22 },
  notesContainer: { marginTop: 10, backgroundColor: '#fff', padding: 12, borderRadius: 12, borderWidth: 1, borderColor: '#0bc0af' },
  notesLabel: { fontSize: 14, fontWeight: 'bold', color: '#0bc0af', marginBottom: 6 },
  notesInput: { fontSize: 15, color: '#333', minHeight: 60, textAlignVertical: 'top' }
});
