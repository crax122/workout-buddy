import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput } from 'react-native';

export default function RestTimer({
  initialSeconds,
  onSkip,
  nextExercise,
  exerciseName,
  note = '',
  onChangeNote
}) {
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
      <Text style={styles.title}>REPOS EN COURS :</Text>
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

      {onChangeNote && (
        <View style={styles.noteBox}>
          <Text style={styles.noteLabel}>📝 Commentaire ({exerciseName || 'Exercice'}) :</Text>
          <TextInput
            style={styles.noteInput}
            placeholder="Ajouter un commentaire pendant le repos..."
            placeholderTextColor="#888"
            value={note}
            onChangeText={onChangeNote}
            multiline
          />
        </View>
      )}

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
    padding: 14,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#0bc0af',
    alignItems: 'center',
    marginVertical: 6,
  },
  title: { fontSize: 14, color: '#666', fontWeight: 'bold', marginBottom: 6 },
  timeControls: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  adjustBtn: { backgroundColor: '#e6f7f6', paddingVertical: 8, paddingHorizontal: 12, borderRadius: 10, marginHorizontal: 10 },
  adjustBtnTxt: { color: '#0bc0af', fontWeight: 'bold', fontSize: 15 },
  time: { fontSize: 42, fontWeight: 'bold', color: '#333' },
  skipBtn: { backgroundColor: '#fff', borderWidth: 2, borderColor: '#ccc', paddingVertical: 8, paddingHorizontal: 24, borderRadius: 20, marginBottom: 12 },
  skipBtnTxt: { color: '#666', fontSize: 14, fontWeight: 'bold' },
  noteBox: { width: '100%', backgroundColor: '#f4fbfa', padding: 10, borderRadius: 12, borderWidth: 1, borderColor: '#0bc0af', marginBottom: 12 },
  noteLabel: { fontSize: 13, fontWeight: 'bold', color: '#0bc0af', marginBottom: 4 },
  noteInput: { fontSize: 15, color: '#111111', minHeight: 54, textAlignVertical: 'top' },
  nextContainer: { backgroundColor: '#0bc0af', width: '100%', padding: 12, borderRadius: 12, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  nextLabel: { color: '#fff', fontSize: 12, fontWeight: 'bold' },
  nextExercise: { color: '#fff', fontSize: 16, fontWeight: 'bold' }
});
