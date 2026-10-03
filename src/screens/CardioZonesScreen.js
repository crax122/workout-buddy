import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, ScrollView } from 'react-native';
import { useNavigation } from '@react-navigation/native';

export default function CardioZonesScreen() {
  const navigation = useNavigation();
  const [age, setAge] = useState('30');
  const [restingHR, setRestingHR] = useState('60');

  const calcMaxHR = () => 220 - (parseInt(age) || 0);
  const maxHR = calcMaxHR();
  const restHR = parseInt(restingHR) || 0;
  const hrr = maxHR - restHR; // Heart Rate Reserve

  const getKarvonen = (percent) => {
    if (restHR === 0 || maxHR <= 0) return 0;
    return Math.round((hrr * (percent / 100)) + restHR);
  };

  const zones = [
    { percent: 50, label: 'Warm Up / Recovery' },
    { percent: 60, label: 'Fat Burn' },
    { percent: 70, label: 'Aerobic Zone (Endurance)' },
    { percent: 80, label: 'Anaerobic Zone (Resistance)' },
    { percent: 90, label: 'VO2 Max (Maximum Effort)' },
    { percent: 100, label: 'Maximum Heart Rate' }
  ];

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Cardio Zones (Karvonen)</Text>
      </View>

      <View style={styles.inputCard}>
        <View style={styles.row}>
          <View style={styles.halfInput}>
            <Text style={styles.label}>Age</Text>
            <TextInput 
              style={styles.input} 
              value={age} 
              onChangeText={setAge} 
              keyboardType="numeric"
            />
          </View>
          <View style={styles.halfInput}>
            <Text style={styles.label}>Resting HR (BPM)</Text>
            <TextInput 
              style={styles.input} 
              value={restingHR} 
              onChangeText={setRestingHR} 
              keyboardType="numeric"
            />
          </View>
        </View>
      </View>

      <View style={styles.resultCard}>
        <Text style={styles.estimatedText}>Estimated Max HR</Text>
        <Text style={styles.maxHRText}>{maxHR} <Text style={{fontSize: 24}}>BPM</Text></Text>
      </View>

      <Text style={styles.sectionTitle}>Training Zones</Text>
      <View style={styles.table}>
        {zones.map((zone, index) => {
          let color = '#555';
          if (zone.percent === 70) color = '#4caf50'; // Aerobic (Green)
          if (zone.percent === 80) color = '#ff9800'; // Anaerobic (Orange)
          if (zone.percent === 90 || zone.percent === 100) color = '#f44336'; // Max (Red)
          
          return (
            <View key={zone.percent} style={styles.tableRow}>
              <View style={styles.cellLeft}>
                <Text style={styles.tablePercent}>{zone.percent} %</Text>
                <Text style={[styles.tableLabel, {color: color}]}>{zone.label}</Text>
              </View>
              <Text style={styles.tableBPM}>{getKarvonen(zone.percent)} BPM</Text>
            </View>
          );
        })}
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
  title: { fontSize: 36, fontWeight: 'bold', color: '#e91e63' },
  inputCard: { backgroundColor: '#fff', padding: 30, borderRadius: 15, marginBottom: 30 },
  row: { flexDirection: 'row', justifyContent: 'space-between' },
  halfInput: { width: '48%' },
  label: { fontSize: 21, fontWeight: 'bold', color: '#333', marginBottom: 8 },
  input: { backgroundColor: '#f9f9f9', padding: 18, borderRadius: 12, borderWidth: 1, borderColor: '#ddd', fontSize: 27, textAlign: 'center' },
  resultCard: { backgroundColor: '#1b2a47', padding: 30, borderRadius: 15, alignItems: 'center', marginBottom: 30 },
  estimatedText: { color: '#ccc', fontSize: 24, marginBottom: 8 },
  maxHRText: { color: '#e91e63', fontSize: 72, fontWeight: 'bold' },
  sectionTitle: { fontSize: 27, fontWeight: 'bold', color: '#333', marginBottom: 15 },
  table: { backgroundColor: '#fff', borderRadius: 15, padding: 23, marginBottom: 45 },
  tableRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 18, borderBottomWidth: 1, borderBottomColor: '#eee' },
  cellLeft: { flex: 1 },
  tablePercent: { fontSize: 24, fontWeight: 'bold', color: '#333' },
  tableLabel: { fontSize: 18, marginTop: 3 },
  tableBPM: { fontSize: 30, fontWeight: 'bold', color: '#e91e63' },
  backBtn: { backgroundColor: '#999', padding: 23, borderRadius: 15, alignItems: 'center', marginBottom: 60 },
  backBtnTxt: { color: '#fff', fontSize: 24, fontWeight: 'bold' }
});
