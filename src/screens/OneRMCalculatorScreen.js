import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, ScrollView } from 'react-native';
import { useNavigation } from '@react-navigation/native';

export default function OneRMCalculatorScreen() {
  const navigation = useNavigation();
  const [weight, setWeight] = useState('100');
  const [reps, setReps] = useState('5');

  // Epley Formula: 1RM = Weight * (1 + Reps / 30)
  const calculate1RM = () => {
    const w = parseFloat(weight) || 0;
    const r = parseFloat(reps) || 0;
    if (w === 0 || r === 0) return 0;
    if (r === 1) return w;
    return w * (1 + r / 30);
  };

  const oneRM = calculate1RM();

  // Reverse Epley to estimate xRM: xRM = 1RM / (1 + x / 30)
  const getRM = (targetReps) => {
    if (targetReps === 1) return oneRM;
    return oneRM / (1 + targetReps / 30);
  };

  const rmList = [1, 2, 3, 4, 5, 6, 8, 10, 12, 15, 20];

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>1RM Calculator</Text>
      </View>

      <View style={styles.inputCard}>
        <View style={styles.row}>
          <View style={styles.halfInput}>
            <Text style={styles.label}>Weight Lifted</Text>
            <TextInput 
              style={styles.input} 
              value={weight} 
              onChangeText={setWeight} 
              keyboardType="numeric"
            />
          </View>
          <View style={styles.halfInput}>
            <Text style={styles.label}>Reps Completed</Text>
            <TextInput 
              style={styles.input} 
              value={reps} 
              onChangeText={setReps} 
              keyboardType="numeric"
            />
          </View>
        </View>
      </View>

      <View style={styles.resultCard}>
        <Text style={styles.estimatedText}>Estimated 1RM</Text>
        <Text style={styles.oneRMText}>{oneRM.toFixed(1)} <Text style={{fontSize: 24}}>kg/lbs</Text></Text>
      </View>

      <Text style={styles.sectionTitle}>Rep Max Estimates</Text>
      <View style={styles.table}>
        {rmList.map(rm => (
          <View key={rm} style={styles.tableRow}>
            <Text style={styles.tableCell}>{rm} RM</Text>
            <Text style={styles.tableCellValue}>{getRM(rm).toFixed(1)}</Text>
          </View>
        ))}
      </View>

      <TouchableOpacity style={styles.backBtn} onPress={() => navigation.navigate('Home')}>
        <Text style={styles.backBtnTxt}>BACK TO HOME</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5', padding: 23 },
  header: { alignItems: 'center', marginVertical: 30 },
  title: { fontSize: 36, fontWeight: 'bold', color: '#ff9800' },
  inputCard: { backgroundColor: '#fff', padding: 30, borderRadius: 15, marginBottom: 30 },
  row: { flexDirection: 'row', justifyContent: 'space-between' },
  halfInput: { width: '48%' },
  label: { fontSize: 21, fontWeight: 'bold', color: '#333', marginBottom: 8 },
  input: { backgroundColor: '#f9f9f9', padding: 18, borderRadius: 12, borderWidth: 1, borderColor: '#ddd', fontSize: 27, textAlign: 'center' },
  resultCard: { backgroundColor: '#1b2a47', padding: 30, borderRadius: 15, alignItems: 'center', marginBottom: 30 },
  estimatedText: { color: '#ccc', fontSize: 24, marginBottom: 8 },
  oneRMText: { color: '#0bc0af', fontSize: 72, fontWeight: 'bold' },
  sectionTitle: { fontSize: 27, fontWeight: 'bold', color: '#333', marginBottom: 15 },
  table: { backgroundColor: '#fff', borderRadius: 15, padding: 23, marginBottom: 45 },
  tableRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 15, borderBottomWidth: 1, borderBottomColor: '#eee' },
  tableCell: { fontSize: 24, fontWeight: 'bold', color: '#555' },
  tableCellValue: { fontSize: 24, fontWeight: 'bold', color: '#0bc0af' },
  backBtn: { backgroundColor: '#999', padding: 23, borderRadius: 15, alignItems: 'center', marginBottom: 60 },
  backBtnTxt: { color: '#fff', fontSize: 24, fontWeight: 'bold' }
});
