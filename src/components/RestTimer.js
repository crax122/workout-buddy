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
    padding: 18,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#0bc0af',
    alignItems: 'center',
    marginVertical: 10,
  },
  title: { fontSize: 16, color: '#666', fontWeight: 'bold', marginBottom: 12 },
  timeControls: { flexDirection: 'row', alignItems: 'center', marginBottom: 18 },
  adjustBtn: { backgroundColor: '#e6f7f6', paddingVertical: 10, paddingHorizontal: 14, borderRadius: 12, marginHorizontal: 10 },
  adjustBtnTxt: { color: '#0bc0af', fontWeight: 'bold', fontSize: 16 },
  time: { fontSize: 48, fontWeight: 'bold', color: '#333' },
  skipBtn: { backgroundColor: '#fff', borderWidth: 2, borderColor: '#ccc', paddingVertical: 12, paddingHorizontal: 30, borderRadius: 24, marginBottom: 18 },
  skipBtnTxt: { color: '#666', fontSize: 16, fontWeight: 'bold' },
  nextContainer: { backgroundColor: '#0bc0af', width: '100%', padding: 14, borderRadius: 12, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  nextLabel: { color: '#fff', fontSize: 13, fontWeight: 'bold' },
  nextExercise: { color: '#fff', fontSize: 18, fontWeight: 'bold' }
});
