import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput } from 'react-native';

export default function ExerciseItem({ exercise, currentSet, totalSets, previousData, initialWeight = '0', initialReps = '10', onLogSet, onAddSet, onDraftChange }) {
  const [weight, setWeight] = useState(String(initialWeight));
  const [reps, setReps] = useState(String(initialReps));

  useEffect(() => {
    setWeight(String(initialWeight));
    setReps(String(initialReps));
  }, [exercise.id, currentSet, initialWeight, initialReps]);

  useEffect(() => {
    if (onDraftChange) {
      onDraftChange(exercise.id, { weight, reps });
    }
  }, [exercise.id, weight, reps]);

  const adjustValue = (setter, value, amount) => {
    const num = parseFloat(value) || 0;
    setter(Math.max(0, num + amount).toString());
  };

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Text style={styles.label}>CURRENT EXERCISE: </Text>
        <Text style={styles.title}>{exercise.name}</Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: 15 }}>
          <Text style={styles.setInfo}>SET {currentSet} / {totalSets}</Text>
          {onAddSet && (
            <TouchableOpacity style={styles.addSetBtn} onPress={onAddSet}>
              <Text style={styles.addSetBtnTxt}>+ 1 SET</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
      
      <View style={styles.inputsContainer}>
        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>WEIGHT (kg)</Text>
          <View style={styles.stepper}>
            <TouchableOpacity onPress={() => adjustValue(setWeight, weight, -2.5)} style={styles.stepBtn}><Text style={styles.stepTxt}>-</Text></TouchableOpacity>
            <TextInput style={styles.input} value={weight} onChangeText={setWeight} keyboardType="numeric" />
            <TouchableOpacity onPress={() => adjustValue(setWeight, weight, 2.5)} style={styles.stepBtn}><Text style={styles.stepTxt}>+</Text></TouchableOpacity>
          </View>
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>REPS</Text>
          <View style={styles.stepper}>
            <TouchableOpacity onPress={() => adjustValue(setReps, reps, -1)} style={styles.stepBtn}><Text style={styles.stepTxt}>-</Text></TouchableOpacity>
            <TextInput style={styles.input} value={reps} onChangeText={setReps} keyboardType="numeric" />
            <TouchableOpacity onPress={() => adjustValue(setReps, reps, 1)} style={styles.stepBtn}><Text style={styles.stepTxt}>+</Text></TouchableOpacity>
          </View>
        </View>
      </View>
      
      <Text style={styles.previousData}>PREVIOUS DATA: {previousData}</Text>
      
      <TouchableOpacity style={styles.logBtn} onPress={() => onLogSet({ weight, reps })}>
        <Text style={styles.logBtnTxt}>LOG SET</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#e6f7f6',
    padding: 16,
    borderRadius: 16,
    marginVertical: 10,
  },
  header: {
    alignItems: 'center',
    marginBottom: 16,
  },
  label: { fontSize: 13, color: '#666', fontWeight: 'bold', marginBottom: 4 },
  title: { fontSize: 22, fontWeight: 'bold', color: '#333', textAlign: 'center' },
  setInfo: { fontSize: 16, color: '#666', fontWeight: 'bold', marginRight: 10 },
  addSetBtn: { backgroundColor: '#0bc0af', paddingVertical: 6, paddingHorizontal: 12, borderRadius: 10 },
  addSetBtnTxt: { color: '#fff', fontSize: 14, fontWeight: 'bold' },
  inputsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  inputGroup: { flex: 1, marginHorizontal: 4 },
  inputLabel: { fontSize: 13, fontWeight: 'bold', color: '#666', marginBottom: 8, textAlign: 'center' },
  stepper: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 12, padding: 4 },
  stepBtn: { width: 40, height: 40, backgroundColor: '#eee', borderRadius: 20, justifyContent: 'center', alignItems: 'center' },
  stepTxt: { fontSize: 22, fontWeight: 'bold', color: '#333' },
  input: { flex: 1, minWidth: 40, textAlign: 'center', fontSize: 20, fontWeight: 'bold', paddingVertical: 4 },
  previousData: { textAlign: 'center', fontSize: 14, color: '#666', marginBottom: 16, fontStyle: 'italic' },
  logBtn: { backgroundColor: '#4caf50', padding: 16, borderRadius: 14, alignItems: 'center' },
  logBtnTxt: { color: '#fff', fontSize: 18, fontWeight: 'bold' }
});
