import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { useNavigation } from '@react-navigation/native';

import { generateWorkout } from '../utils/geminiApi';

export default function HomeScreen() {
  const navigation = useNavigation();

  // Mock data for history
  const history = [
    { id: 1, date: '10 Nov 2023', name: 'Duration' },
    { id: 2, date: '27 Dec 2023', name: 'Duration' },
    { id: 3, date: '18 Dec 2023', name: 'Name' }
  ];

  const handleAIGenerate = async () => {
    // Just a placeholder alert for the demo
    alert('Calling Gemini 3.7-flash to generate workout...');
    // const plan = await generateWorkout('build muscle');
    // alert(plan);
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Workout Buddy</Text>
      </View>
      
      <TouchableOpacity 
        style={styles.startBtn} 
        onPress={() => navigation.navigate('ActiveWorkout')}>
        <Text style={styles.startBtnTxt}>START NEW WORKOUT</Text>
      </TouchableOpacity>

      <TouchableOpacity 
        style={[styles.startBtn, { backgroundColor: '#8a2be2', marginTop: -20, marginBottom: 30 }]} 
        onPress={handleAIGenerate}>
        <Text style={styles.startBtnTxt}>✨ GENERATE WITH AI</Text>
      </TouchableOpacity>

      <Text style={styles.sectionTitle}>Progress History & Analysis</Text>
      
      {/* Fake Chart Area */}
      <View style={styles.chartCard}>
        <Text style={styles.chartTitle}>Strength Progression</Text>
        <View style={styles.chartPlaceholder}>
           <Text style={{color: '#999'}}>Chart placeholder (Max Squat, Bench)</Text>
        </View>
      </View>

      <Text style={styles.sectionTitle}>History</Text>
      {history.map(item => (
        <View key={item.id} style={styles.historyCard}>
          <View style={styles.historyIcon}><Text>📅</Text></View>
          <View>
            <Text style={styles.historyDate}>{item.date}</Text>
            <Text style={styles.historyName}>{item.name}</Text>
          </View>
        </View>
      ))}

    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5', padding: 15 },
  header: { alignItems: 'center', marginVertical: 20 },
  title: { fontSize: 28, fontWeight: 'bold', color: '#0bc0af' },
  startBtn: { backgroundColor: '#0bc0af', padding: 15, borderRadius: 10, alignItems: 'center', marginBottom: 30 },
  startBtnTxt: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: '#333', marginBottom: 10 },
  chartCard: { backgroundColor: '#fff', padding: 15, borderRadius: 10, marginBottom: 20 },
  chartTitle: { fontSize: 14, fontWeight: 'bold', marginBottom: 10 },
  chartPlaceholder: { height: 150, backgroundColor: '#f0f0f0', justifyContent: 'center', alignItems: 'center', borderRadius: 5 },
  historyCard: { flexDirection: 'row', backgroundColor: '#fff', padding: 15, borderRadius: 10, marginBottom: 10, alignItems: 'center' },
  historyIcon: { width: 40, height: 40, backgroundColor: '#e6f7f6', borderRadius: 20, justifyContent: 'center', alignItems: 'center', marginRight: 15 },
  historyDate: { fontSize: 16, fontWeight: 'bold', color: '#333' },
  historyName: { fontSize: 14, color: '#666' }
});
