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
    padding: 30,
    borderRadius: 23,
    borderWidth: 2,
    borderColor: '#0bc0af',
    alignItems: 'center',
    marginVertical: 15,
  },
  title: { fontSize: 30, color: '#666', fontWeight: 'bold', marginBottom: 23 },
  timeControls: { flexDirection: 'row', alignItems: 'center', marginBottom: 38 },
  adjustBtn: { backgroundColor: '#e6f7f6', paddingVertical: 23, paddingHorizontal: 30, borderRadius: 23, marginHorizontal: 15 },
  adjustBtnTxt: { color: '#0bc0af', fontWeight: 'bold', fontSize: 33 },
  time: { fontSize: 96, fontWeight: 'bold', color: '#333' },
  skipBtn: { backgroundColor: '#fff', borderWidth: 2, borderColor: '#ccc', paddingVertical: 23, paddingHorizontal: 60, borderRadius: 45, marginBottom: 38 },
  skipBtnTxt: { color: '#666', fontSize: 33, fontWeight: 'bold' },
  nextContainer: { backgroundColor: '#0bc0af', width: '100%', padding: 30, borderRadius: 23, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  nextLabel: { color: '#fff', fontSize: 24, fontWeight: 'bold' },
  nextExercise: { color: '#fff', fontSize: 36, fontWeight: 'bold' }
});
