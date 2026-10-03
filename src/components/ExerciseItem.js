import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput } from 'react-native';

export default function ExerciseItem({ exercise, currentSet, totalSets, previousData, initialWeight = '0', initialReps = '10', onLogSet }) {
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
    padding: 25,
    borderRadius: 20,
    marginVertical: 15,
  },
  header: {
    alignItems: 'center',
    marginBottom: 25,
  },
  label: { fontSize: 16, color: '#666', fontWeight: 'bold', marginBottom: 5 },
  title: { fontSize: 32, fontWeight: 'bold', color: '#333', textAlign: 'center' },
  setInfo: { fontSize: 20, color: '#666', marginTop: 10, fontWeight: 'bold' },
  inputsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 25,
  },
  inputGroup: { flex: 1, marginHorizontal: 10 },
  inputLabel: { fontSize: 16, fontWeight: 'bold', color: '#666', marginBottom: 10, textAlign: 'center' },
  stepper: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 15, padding: 5 },
  stepBtn: { width: 60, height: 60, backgroundColor: '#eee', borderRadius: 30, justifyContent: 'center', alignItems: 'center' },
  stepTxt: { fontSize: 36, fontWeight: 'bold', color: '#333' },
  input: { flex: 1, textAlign: 'center', fontSize: 28, fontWeight: 'bold' },
  previousData: { textAlign: 'center', fontSize: 18, color: '#666', marginBottom: 25, fontStyle: 'italic' },
  logBtn: { backgroundColor: '#4caf50', padding: 25, borderRadius: 30, alignItems: 'center' },
  logBtnTxt: { color: '#fff', fontSize: 24, fontWeight: 'bold' }
});
