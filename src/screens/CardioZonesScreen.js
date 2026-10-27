import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, ScrollView, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { cardioSessions, fatigueSessions } from '../data/cardioSessions';

export default function CardioZonesScreen() {
  const navigation = useNavigation();
  const [age, setAge] = useState('44');
  const [restingHR, setRestingHR] = useState('70');
  const [selectedCardio, setSelectedCardio] = useState(null);

  const ageVal = parseInt(age, 10) || 44;
  const calcMaxHR = () => 220 - ageVal;
  const maxHR = calcMaxHR();
  const restHR = parseInt(restingHR, 10) || 70;
  const hrr = maxHR - restHR; // Heart Rate Reserve

  const getKarvonen = (percent) => {
    if (restHR <= 0 || maxHR <= 0) return 0;
    return Math.round((hrr * (percent / 100)) + restHR);
  };

  const adjustAge = (delta) => {
    setAge(String(Math.max(10, Math.min(100, ageVal + delta))));
  };

  const adjustRestingHR = (delta) => {
    setRestingHR(String(Math.max(30, Math.min(150, restHR + delta))));
  };

  const zones = [
    { percent: 50, label: 'Warm Up / Recovery' },
    { percent: 60, label: 'Fat Burn' },
    { percent: 70, label: 'Aerobic Zone (Endurance)' },
    { percent: 80, label: 'Anaerobic Zone (Resistance)' },
    { percent: 90, label: 'VO2 Max (Maximum Effort)' },
    { percent: 100, label: 'Maximum Heart Rate' }
  ];

  const [fatigueIndex, setFatigueIndex] = useState(0);

  const generateRandomCardio = () => {
    const isTired = window.confirm("Êtes-vous particulièrement fatigué aujourd'hui ?\n\n(OK = Oui, Annuler = Non)");
    
    if (isTired) {
      const keys = ['A', 'B'];
      const key = keys[fatigueIndex % 2];
      const session = fatigueSessions[key];
      setSelectedCardio({
        name: session.name,
        protocol: session.protocol,
        duration: session.duration,
        note: session.advantage,
        isFatigue: true
      });
      setFatigueIndex(fatigueIndex + 1);
    } else {
      const randomIndex = Math.floor(Math.random() * cardioSessions.length);
      const session = cardioSessions[randomIndex];
      setSelectedCardio({
        name: session.name,
        protocol: session.protocol,
        duration: session.duration,
        note: session.goal,
        isFatigue: false
      });
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 40 }}>
      <View style={styles.header}>
        <Text style={styles.title}>Cardio Zones (Karvonen)</Text>
      </View>

      <TouchableOpacity style={styles.randomBtn} onPress={generateRandomCardio}>
        <Text style={styles.randomBtnTxt}>🎲 GÉNÉRER UN CARDIO ALÉATOIRE</Text>
      </TouchableOpacity>

      {selectedCardio && (
        <View style={styles.cardioCard}>
          <Text style={styles.cardioName}>{selectedCardio.name}</Text>
          <Text style={styles.cardioProtocol}>{selectedCardio.protocol}</Text>
          <Text style={styles.cardioDuration}>⏱ {selectedCardio.duration}</Text>
          <Text style={styles.cardioNote}>{selectedCardio.isFatigue ? "💡 " : "🎯 "}{selectedCardio.note}</Text>
          <View style={styles.cardioZonesMini}>
            <Text style={styles.cardioZonesMiniTitle}>
              ❤️ Vos Zones (Âge: {ageVal} • Repos: {restHR} BPM • Max: {maxHR} BPM) :
            </Text>
            <Text style={styles.cardioZonesMiniTxt}>
              50%: {getKarvonen(50)} BPM • 60%: {getKarvonen(60)} BPM • 70%: {getKarvonen(70)} BPM • 80%: {getKarvonen(80)} BPM • 90%: {getKarvonen(90)} BPM
            </Text>
          </View>
          
          <TouchableOpacity 
            style={[styles.randomBtn, { backgroundColor: '#1b2a47', marginTop: 15, marginBottom: 0, padding: 15 }]} 
            onPress={() => {
              const zonesSummary = zones
                .map(z => `${z.percent}% (${z.label}): ${getKarvonen(z.percent)} BPM`)
                .join(' | ');
              navigation.navigate('ActiveWorkout', { 
                workoutName: 'Cardio: ' + selectedCardio.name,
                exercises: [{
                  id: Date.now().toString(),
                  name: selectedCardio.name,
                  type: 'time',
                  durationSeconds: 15 * 60, // Default to 15 mins
                  restTime: 0,
                  completed: false,
                  protocol: selectedCardio.protocol,
                  cardioInfo: {
                    age: ageVal,
                    restingHR: restHR,
                    maxHR,
                    zones: zones.map(z => ({
                      percent: z.percent,
                      label: z.label,
                      bpm: getKarvonen(z.percent)
                    }))
                  },
                  notes: `${selectedCardio.protocol}\nZones (Âge ${ageVal}, Repos ${restHR} BPM, Max ${maxHR} BPM) : ${zonesSummary}`
                }]
              });
            }}
          >
            <Text style={[styles.randomBtnTxt, { fontSize: 18 }]}>▶ DÉMARRER CE CARDIO</Text>
          </TouchableOpacity>
        </View>
      )}

      <View style={styles.inputCard}>
        <View style={styles.row}>
          <View style={styles.halfInput}>
            <Text style={styles.label}>Age : {ageVal} ans</Text>
            <View style={styles.stepperRow}>
              <TouchableOpacity style={styles.stepBtn} onPress={() => adjustAge(-1)}>
                <Text style={styles.stepBtnTxt}>-</Text>
              </TouchableOpacity>
              <TextInput 
                style={styles.input} 
                value={String(age)} 
                onChangeText={setAge} 
                placeholder="44"
                placeholderTextColor="#666"
                keyboardType="numeric"
              />
              <TouchableOpacity style={styles.stepBtn} onPress={() => adjustAge(1)}>
                <Text style={styles.stepBtnTxt}>+</Text>
              </TouchableOpacity>
            </View>
          </View>
          <View style={styles.halfInput}>
            <Text style={styles.label}>Resting HR : {restHR} BPM</Text>
            <View style={styles.stepperRow}>
              <TouchableOpacity style={styles.stepBtn} onPress={() => adjustRestingHR(-1)}>
                <Text style={styles.stepBtnTxt}>-</Text>
              </TouchableOpacity>
              <TextInput 
                style={styles.input} 
                value={String(restingHR)} 
                onChangeText={setRestingHR} 
                placeholder="70"
                placeholderTextColor="#666"
                keyboardType="numeric"
              />
              <TouchableOpacity style={styles.stepBtn} onPress={() => adjustRestingHR(1)}>
                <Text style={styles.stepBtnTxt}>+</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </View>

      <View style={styles.resultCard}>
        <Text style={styles.summaryPill}>Âge : {ageVal} ans  •  Resting HR : {restHR} BPM</Text>
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
  container: { flex: 1, backgroundColor: '#f5f5f5', paddingHorizontal: 14, paddingTop: 8 },
  header: { alignItems: 'center', marginVertical: 8 },
  title: { fontSize: 21, fontWeight: 'bold', color: '#e91e63' },
  randomBtn: { backgroundColor: '#4caf50', paddingVertical: 11, paddingHorizontal: 14, borderRadius: 10, alignItems: 'center', marginBottom: 10, elevation: 2 },
  randomBtnTxt: { color: '#fff', fontSize: 15, fontWeight: 'bold' },
  cardioCard: { backgroundColor: '#e6f7f6', padding: 12, borderRadius: 12, marginBottom: 12, borderWidth: 2, borderColor: '#0bc0af' },
  cardioName: { fontSize: 16, fontWeight: 'bold', color: '#333', marginBottom: 4 },
  cardioProtocol: { fontSize: 14, color: '#444', marginBottom: 4, fontStyle: 'italic' },
  cardioDuration: { fontSize: 14, fontWeight: 'bold', color: '#e91e63', marginBottom: 4 },
  cardioNote: { fontSize: 13, color: '#666' },
  cardioZonesMini: { backgroundColor: '#fff', padding: 8, borderRadius: 8, marginTop: 8, borderWidth: 1, borderColor: '#ccebe8' },
  cardioZonesMiniTitle: { fontSize: 12, fontWeight: 'bold', color: '#1b2a47', marginBottom: 2 },
  cardioZonesMiniTxt: { fontSize: 12, fontWeight: 'bold', color: '#e91e63' },
  inputCard: { backgroundColor: '#fff', padding: 10, borderRadius: 12, marginBottom: 10 },
  row: { flexDirection: 'row', justifyContent: 'space-between' },
  halfInput: { width: '48%' },
  label: { fontSize: 13, fontWeight: 'bold', color: '#1b2a47', marginBottom: 4, textAlign: 'center' },
  stepperRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f9f9f9', borderRadius: 10, borderWidth: 1, borderColor: '#ddd', padding: 3 },
  stepBtn: { width: 30, height: 32, backgroundColor: '#e6f7f6', borderRadius: 8, justifyContent: 'center', alignItems: 'center' },
  stepBtnTxt: { fontSize: 18, fontWeight: 'bold', color: '#1b2a47' },
  input: { flex: 1, minWidth: 36, paddingVertical: 4, paddingHorizontal: 4, fontSize: 17, fontWeight: 'bold', color: '#111111', textAlign: 'center' },
  resultCard: { backgroundColor: '#1b2a47', paddingVertical: 10, paddingHorizontal: 14, borderRadius: 12, alignItems: 'center', marginBottom: 10 },
  summaryPill: { color: '#4dd0e1', fontSize: 13, fontWeight: 'bold', marginBottom: 2 },
  estimatedText: { color: '#ccc', fontSize: 13, marginBottom: 2 },
  maxHRText: { color: '#e91e63', fontSize: 32, fontWeight: 'bold' },
  sectionTitle: { fontSize: 16, fontWeight: 'bold', color: '#333', marginBottom: 6 },
  table: { backgroundColor: '#fff', borderRadius: 12, paddingHorizontal: 12, paddingVertical: 6, marginBottom: 16 },
  tableRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 6, borderBottomWidth: 1, borderBottomColor: '#eee' },
  cellLeft: { flex: 1 },
  tablePercent: { fontSize: 14, fontWeight: 'bold', color: '#333' },
  tableLabel: { fontSize: 12, marginTop: 1 },
  tableBPM: { fontSize: 16, fontWeight: 'bold', color: '#e91e63' },
  backBtn: { backgroundColor: '#999', padding: 12, borderRadius: 10, alignItems: 'center', marginBottom: 30 },
  backBtnTxt: { color: '#fff', fontSize: 15, fontWeight: 'bold' }
});
