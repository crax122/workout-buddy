import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';

export default function RestTimer({ initialSeconds, onSkip, nextExercise }) {
  const [seconds, setSeconds] = useState(initialSeconds);

  useEffect(() => {
    if (seconds > 0) {
      const interval = setInterval(() => setSeconds(s => s - 1), 1000);
      return () => clearInterval(interval);
    } else {
      onSkip(); // auto-advance
    }
  }, [seconds, onSkip]);

  const formatTime = (totalSeconds) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <View style={styles.card}>
      <Text style={styles.title}>COUNTDOWN:</Text>
      <View style={styles.timeControls}>
        <TouchableOpacity style={styles.adjustBtn} onPress={() => setSeconds(s => Math.max(0, s - 15))}>
          <Text style={styles.adjustBtnTxt}>-15s</Text>
        </TouchableOpacity>
        <Text style={styles.time}>{formatTime(seconds)}</Text>
        <TouchableOpacity style={styles.adjustBtn} onPress={() => setSeconds(s => s + 15)}>
          <Text style={styles.adjustBtnTxt}>+15s</Text>
        </TouchableOpacity>
      </View>
      
      <TouchableOpacity style={styles.skipBtn} onPress={onSkip}>
        <Text style={styles.skipBtnTxt}>SKIP REST</Text>
      </TouchableOpacity>

      {nextExercise && (
        <View style={styles.nextContainer}>
          <Text style={styles.nextLabel}>UP NEXT:</Text>
          <Text style={styles.nextExercise}>{nextExercise}</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 15,
    borderWidth: 2,
    borderColor: '#0bc0af',
    alignItems: 'center',
    marginVertical: 10,
  },
  title: { fontSize: 20, color: '#666', fontWeight: 'bold', marginBottom: 15 },
  timeControls: { flexDirection: 'row', alignItems: 'center', marginBottom: 25 },
  adjustBtn: { backgroundColor: '#e6f7f6', paddingVertical: 15, paddingHorizontal: 20, borderRadius: 15, marginHorizontal: 15 },
  adjustBtnTxt: { color: '#0bc0af', fontWeight: 'bold', fontSize: 22 },
  time: { fontSize: 64, fontWeight: 'bold', color: '#333' },
  skipBtn: { backgroundColor: '#fff', borderWidth: 2, borderColor: '#ccc', paddingVertical: 15, paddingHorizontal: 40, borderRadius: 30, marginBottom: 25 },
  skipBtnTxt: { color: '#666', fontSize: 22, fontWeight: 'bold' },
  nextContainer: { backgroundColor: '#0bc0af', width: '100%', padding: 20, borderRadius: 15, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  nextLabel: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  nextExercise: { color: '#fff', fontSize: 24, fontWeight: 'bold' }
});
