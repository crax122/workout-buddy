import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, ScrollView, Alert } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { saveTemplate } from '../services/db';

export default function CreateWorkoutScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  
  const [workoutId, setWorkoutId] = useState(null);
  const [workoutName, setWorkoutName] = useState('My Workout');
  const [exercises, setExercises] = useState([]);
  
  const [newExerciseName, setNewExerciseName] = useState('');
  const [newExType, setNewExType] = useState('reps');
  const [newTimeInput, setNewTimeInput] = useState('5');
  const [newSetsInput, setNewSetsInput] = useState('3x10');
  const [newRestInput, setNewRestInput] = useState('60');
  const [editIndex, setEditIndex] = useState(null);

  useEffect(() => {
    if (route.params?.editWorkout) {
      const w = route.params.editWorkout;
      setWorkoutId(w.id);
      setWorkoutName(w.name);
      setExercises(w.exercises || []);
    }
  }, [route.params?.editWorkout]);

  const parseSets = (input) => {
    const parts = input.split(',').map(s => s.trim());
    let parsed = [];
    for (let part of parts) {
      if (part.includes('x')) {
        const [count, reps] = part.split('x').map(Number);
        if (!isNaN(count) && !isNaN(reps)) {
          for (let i = 0; i < count; i++) parsed.push(reps);
        }
      } else {
        const reps = Number(part);
        if (!isNaN(reps) && reps > 0) {
          parsed.push(reps);
        }
      }
    }
    return parsed;
  };

  const handleAddExercise = () => {
    if (!newExerciseName.trim()) {
      Alert.alert('Error', 'Please enter an exercise name');
      return;
    }
    
    let newEx;
    
    if (newExType === 'time') {
      const durationMins = parseFloat(newTimeInput);
      if (isNaN(durationMins) || durationMins <= 0) {
        Alert.alert('Error', 'Please enter a valid duration');
        return;
      }
      newEx = {
        id: editIndex !== null ? exercises[editIndex].id : Date.now().toString(),
        name: newExerciseName.trim(),
        type: 'time',
        durationSeconds: Math.floor(durationMins * 60),
        restTime: parseInt(newRestInput) || 60,
        completed: false
      };
    } else {
      const parsedTargetSets = parseSets(newSetsInput);
      if (parsedTargetSets.length === 0) {
        Alert.alert('Error', 'Please enter a valid sets format (e.g., "3x10" or "10,10,8")');
        return;
      }
      newEx = {
        id: editIndex !== null ? exercises[editIndex].id : Date.now().toString(),
        name: newExerciseName.trim(),
        type: 'reps',
        sets: parsedTargetSets.length,
        targetReps: parsedTargetSets,
        restTime: parseInt(newRestInput) || 60,
        completedSets: 0,
        prev: editIndex !== null ? exercises[editIndex].prev : 'No previous data',
        completed: false
      };
    }

    if (editIndex !== null) {
      const updated = [...exercises];
      updated[editIndex] = newEx;
      setExercises(updated);
      setEditIndex(null);
    } else {
      setExercises([...exercises, newEx]);
    }
    setNewExerciseName('');
    setNewSetsInput('3x10');
    setNewTimeInput('5');
    setNewExType('reps');
    setNewRestInput('60');
  };

  const handleEditExercise = (index) => {
    const ex = exercises[index];
    setNewExerciseName(ex.name);
    setNewRestInput(String(ex.restTime || 60));
    setNewExType(ex.type || 'reps');
    
    if (ex.type === 'time') {
      setNewTimeInput(String((ex.durationSeconds || 300) / 60));
    } else {
      if (ex.targetReps && ex.targetReps.length > 0) {
        const allSame = ex.targetReps.every(r => r === ex.targetReps[0]);
        if (allSame) {
          setNewSetsInput(`${ex.targetReps.length}x${ex.targetReps[0]}`);
        } else {
          setNewSetsInput(ex.targetReps.join(', '));
        }
      }
    }
    setEditIndex(index);
  };

  const handleRemoveExercise = (id) => {
    setExercises(exercises.filter(ex => ex.id !== id));
  };

  const handleSave = async () => {
    if (exercises.length === 0) {
      Alert.alert('Error', 'Please add at least one exercise.');
      return false;
    }

    try {
      const newTemplate = {
        id: workoutId ? workoutId : Date.now().toString(),
        name: workoutName,
        exercises: exercises
      };
      
      const success = await saveTemplate(newTemplate, workoutId);
      
      if (success) {
        if (!workoutId) {
          setWorkoutId(newTemplate.id);
        }
        Alert.alert('Success', 'Workout template saved!');
        return true;
      } else {
        Alert.alert('Error', 'Failed to save workout to cloud.');
        return false;
      }
    } catch(e) {
      console.error("Failed to save template", e);
      Alert.alert('Error', 'Failed to save workout');
      return false;
    }
  };

  const handleStart = async () => {
    // Optionally save before starting, but since the user can save explicitly, we'll just navigate
    // Actually, we probably still want to save when they start so they don't lose it if they didn't click save.
    const saved = await handleSave();
    if (saved) {
      navigation.navigate('ActiveWorkout', { workoutName, exercises });
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Create Workout</Text>
      </View>

      <Text style={styles.label}>Workout Name</Text>
      <TextInput 
        style={styles.input} 
        value={workoutName} 
        onChangeText={setWorkoutName} 
        placeholder="e.g. Leg Day"
      />

      <View style={styles.addSection}>
        <Text style={styles.sectionTitle}>Add Exercise</Text>
        <TextInput 
          style={styles.input} 
          value={newExerciseName} 
          onChangeText={setNewExerciseName} 
          placeholder="Exercise Name (e.g. Squats)"
        />

        <View style={styles.typeToggle}>
          <TouchableOpacity 
            style={[styles.typeBtn, newExType === 'reps' && styles.typeBtnActive]} 
            onPress={() => setNewExType('reps')}
          >
            <Text style={[styles.typeBtnTxt, newExType === 'reps' && styles.typeBtnTxtActive]}>Sets & Reps</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.typeBtn, newExType === 'time' && styles.typeBtnActive]} 
            onPress={() => setNewExType('time')}
          >
            <Text style={[styles.typeBtnTxt, newExType === 'time' && styles.typeBtnTxtActive]}>Timed (Chrono)</Text>
          </TouchableOpacity>
        </View>

        {newExType === 'reps' ? (
          <>
            <Text style={styles.label}>Sets & Reps (e.g. 2x10, 1x5)</Text>
            <TextInput 
              style={styles.input} 
              value={newSetsInput} 
              onChangeText={setNewSetsInput} 
              placeholder="e.g. 10,10,5 or 3x10"
            />
          </>
        ) : (
          <>
            <Text style={styles.label}>Duration (minutes)</Text>
            <TextInput 
              style={styles.input} 
              value={newTimeInput} 
              onChangeText={setNewTimeInput} 
              placeholder="e.g. 5"
              keyboardType="numeric"
            />
          </>
        )}
        
        <Text style={styles.label}>Rest Time (seconds)</Text>
        <TextInput 
          style={styles.input} 
          value={newRestInput} 
          onChangeText={setNewRestInput} 
          placeholder="e.g. 60"
          keyboardType="numeric"
        />
        <TouchableOpacity style={styles.addBtn} onPress={handleAddExercise}>
          <Text style={styles.addBtnTxt}>{editIndex !== null ? "UPDATE EXERCISE" : "+ ADD EXERCISE"}</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.listSection}>
        <Text style={styles.sectionTitle}>Exercises List</Text>
        {exercises.length === 0 && <Text style={styles.emptyText}>No exercises added yet.</Text>}
        {exercises.map((ex, index) => (
          <View key={ex.id} style={styles.exCard}>
            <View style={{ flex: 1 }}>
              <Text style={styles.exName}>{index + 1}. {ex.name}</Text>
              {ex.type === 'time' ? (
                <Text style={styles.exDetails}>⏱ {Math.floor((ex.durationSeconds || 0)/60)}m {(ex.durationSeconds || 0)%60}s • {ex.restTime || 60}s Rest</Text>
              ) : (
                <Text style={styles.exDetails}>{ex.targetReps ? ex.targetReps.join(', ') : ''} Reps ({ex.sets} Sets) • {ex.restTime || 60}s Rest</Text>
              )}
            </View>
            <View style={{ flexDirection: 'row' }}>
              <TouchableOpacity style={styles.editBtn} onPress={() => handleEditExercise(index)}>
                <Text style={styles.editBtnTxt}>✏️</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.removeBtn} onPress={() => handleRemoveExercise(ex.id)}>
                <Text style={styles.removeBtnTxt}>❌</Text>
              </TouchableOpacity>
            </View>
          </View>
        ))}
      </View>

      <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
        <Text style={styles.saveBtnTxt}>SAVE WORKOUT TEMPLATE</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.startBtn} onPress={handleStart}>
        <Text style={styles.startBtnTxt}>START WORKOUT</Text>
      </TouchableOpacity>
      
      <TouchableOpacity style={styles.backBtn} onPress={() => navigation.navigate('Home')}>
        <Text style={styles.backBtnTxt}>BACK TO HOME</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5', padding: 30 },
  header: { alignItems: 'center', marginVertical: 45 },
  title: { fontSize: 48, fontWeight: 'bold', color: '#0bc0af' },
  label: { fontSize: 30, fontWeight: 'bold', color: '#333', marginBottom: 15 },
  input: { backgroundColor: '#fff', padding: 30, borderRadius: 18, marginBottom: 30, borderWidth: 1, borderColor: '#ddd', fontSize: 30 },
  addSection: { backgroundColor: '#e6f7f6', padding: 30, borderRadius: 23, marginBottom: 45 },
  sectionTitle: { fontSize: 39, fontWeight: 'bold', color: '#333', marginBottom: 23 },
  typeToggle: { flexDirection: 'row', marginBottom: 30, gap: 15 },
  typeBtn: { flex: 1, padding: 20, backgroundColor: '#fff', borderRadius: 15, alignItems: 'center', borderWidth: 2, borderColor: '#ddd' },
  typeBtnActive: { borderColor: '#0bc0af', backgroundColor: '#e6f7f6' },
  typeBtnTxt: { fontSize: 24, fontWeight: 'bold', color: '#666' },
  typeBtnTxtActive: { color: '#0bc0af' },
  row: { flexDirection: 'row', justifyContent: 'space-between' },
  halfInput: { width: '48%' },
  addBtn: { backgroundColor: '#1b2a47', padding: 30, borderRadius: 18, alignItems: 'center', marginTop: 15 },
  addBtnTxt: { color: '#fff', fontWeight: 'bold', fontSize: 27 },
  listSection: { marginBottom: 45 },
  emptyText: { fontStyle: 'italic', color: '#888', fontSize: 27 },
  exCard: { flexDirection: 'column', backgroundColor: '#fff', padding: 30, borderRadius: 18, marginBottom: 23, elevation: 2 },
  exName: { fontSize: 36, fontWeight: 'bold', marginBottom: 15 },
  exDetails: { fontSize: 27, color: '#666', marginBottom: 23 },
  removeBtn: { padding: 23, backgroundColor: '#ffe6e6', borderRadius: 15, flex: 1, alignItems: 'center', marginLeft: 15 },
  removeBtnTxt: { fontSize: 33, color: '#ff4d4d', fontWeight: 'bold' },
  editBtn: { padding: 23, backgroundColor: '#e6f7f6', borderRadius: 15, flex: 1, alignItems: 'center' },
  editBtnTxt: { fontSize: 33, fontWeight: 'bold' },
  saveBtn: { backgroundColor: '#ff9800', padding: 38, borderRadius: 23, alignItems: 'center', marginBottom: 30 },
  saveBtnTxt: { color: '#fff', fontSize: 33, fontWeight: 'bold' },
  startBtn: { backgroundColor: '#4caf50', padding: 38, borderRadius: 23, alignItems: 'center', marginBottom: 30 },
  startBtnTxt: { color: '#fff', fontSize: 33, fontWeight: 'bold' },
  backBtn: { backgroundColor: '#999', padding: 30, borderRadius: 23, alignItems: 'center', marginBottom: 60 },
  backBtnTxt: { color: '#fff', fontSize: 30, fontWeight: 'bold' }
});
