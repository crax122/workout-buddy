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
      <Text style={styles.time}>{formatTime(seconds)}</Text>
      
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
  title: { fontSize: 14, color: '#666', fontWeight: 'bold', marginBottom: 10 },
  time: { fontSize: 48, fontWeight: 'bold', color: '#333', marginBottom: 20 },
  skipBtn: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#ccc', paddingVertical: 10, paddingHorizontal: 30, borderRadius: 25, marginBottom: 20 },
  skipBtnTxt: { color: '#666', fontSize: 16, fontWeight: 'bold' },
  nextContainer: { backgroundColor: '#0bc0af', width: '100%', padding: 15, borderRadius: 10, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  nextLabel: { color: '#fff', fontSize: 10, fontWeight: 'bold' },
  nextExercise: { color: '#fff', fontSize: 18, fontWeight: 'bold' }
});
