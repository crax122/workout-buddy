import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput } from 'react-native';

export default function ExerciseItem({ exercise, currentSet, totalSets, previousData, initialWeight = '0', initialReps = '10', onLogSet, onAddSet }) {
  const [weight, setWeight] = useState(initialWeight);
  const [reps, setReps] = useState(initialReps);

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
    padding: 38,
    borderRadius: 30,
    marginVertical: 23,
  },
  header: {
    alignItems: 'center',
    marginBottom: 38,
  },
  label: { fontSize: 24, color: '#666', fontWeight: 'bold', marginBottom: 8 },
  title: { fontSize: 48, fontWeight: 'bold', color: '#333', textAlign: 'center' },
  setInfo: { fontSize: 30, color: '#666', fontWeight: 'bold', marginRight: 15 },
  addSetBtn: { backgroundColor: '#0bc0af', paddingVertical: 10, paddingHorizontal: 20, borderRadius: 15 },
  addSetBtnTxt: { color: '#fff', fontSize: 24, fontWeight: 'bold' },
  inputsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 38,
  },
  inputGroup: { flex: 1, marginHorizontal: 10 },
  inputLabel: { fontSize: 24, fontWeight: 'bold', color: '#666', marginBottom: 15, textAlign: 'center' },
  stepper: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 23, padding: 8 },
  stepBtn: { width: 90, height: 90, backgroundColor: '#eee', borderRadius: 45, justifyContent: 'center', alignItems: 'center' },
  stepTxt: { fontSize: 54, fontWeight: 'bold', color: '#333' },
  input: { flex: 1, textAlign: 'center', fontSize: 42, fontWeight: 'bold' },
  previousData: { textAlign: 'center', fontSize: 27, color: '#666', marginBottom: 38, fontStyle: 'italic' },
  logBtn: { backgroundColor: '#4caf50', padding: 38, borderRadius: 45, alignItems: 'center' },
  logBtnTxt: { color: '#fff', fontSize: 36, fontWeight: 'bold' }
});
