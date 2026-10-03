import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput } from 'react-native';

export default function ExerciseItem({ exercise, currentSet, totalSets, previousData, onLogSet }) {
  const [weight, setWeight] = useState('50');
  const [reps, setReps] = useState('12');

  const adjustValue = (setter, value, amount) => {
    const num = parseFloat(value) || 0;
    setter(Math.max(0, num + amount).toString());
  };

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Text style={styles.label}>CURRENT EXERCISE: </Text>
        <Text style={styles.title}>{exercise.name}</Text>
        <Text style={styles.setInfo}>SET {currentSet} / {totalSets}</Text>
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
    padding: 15,
    borderRadius: 15,
    marginVertical: 10,
  },
  header: {
    alignItems: 'center',
    marginBottom: 15,
  },
  label: { fontSize: 10, color: '#666', fontWeight: 'bold' },
  title: { fontSize: 24, fontWeight: 'bold', color: '#333' },
  setInfo: { fontSize: 12, color: '#666' },
  inputsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 15,
  },
  inputGroup: { flex: 1, marginHorizontal: 5 },
  inputLabel: { fontSize: 10, fontWeight: 'bold', color: '#666', marginBottom: 5, textAlign: 'center' },
  stepper: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 8, padding: 2 },
  stepBtn: { width: 30, height: 30, backgroundColor: '#eee', borderRadius: 15, justifyContent: 'center', alignItems: 'center' },
  stepTxt: { fontSize: 18, fontWeight: 'bold', color: '#333' },
  input: { flex: 1, textAlign: 'center', fontSize: 18, fontWeight: 'bold' },
  previousData: { textAlign: 'center', fontSize: 12, color: '#666', marginBottom: 15 },
  logBtn: { backgroundColor: '#4caf50', padding: 15, borderRadius: 25, alignItems: 'center' },
  logBtnTxt: { color: '#fff', fontSize: 16, fontWeight: 'bold' }
});
