import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Audio } from 'expo-av';

export default function TimedExerciseItem({ exercise, onComplete }) {
  const [seconds, setSeconds] = useState(exercise.durationSeconds || 300);
  const [isActive, setIsActive] = useState(false);
  const [sound, setSound] = useState(null);

  useEffect(() => {
    let interval = null;
    if (isActive && seconds > 0) {
      interval = setInterval(() => {
        setSeconds((s) => s - 1);
      }, 1000);
    } else if (isActive && seconds === 0) {
      setIsActive(false);
      playSound();
      onComplete(); // Move to rest
    }
    return () => clearInterval(interval);
  }, [isActive, seconds]);

  useEffect(() => {
    return sound
      ? () => {
          sound.unloadAsync();
        }
      : undefined;
  }, [sound]);

  async function playSound() {
    try {
      // Create a simple beep or use a default sound if possible.
      // We don't have an asset file, so let's try to just use an external URI or ignore it if not possible?
      // Actually, we can fetch a public domain beep sound.
      const { sound } = await Audio.Sound.createAsync(
        { uri: 'https://cdn.pixabay.com/download/audio/2021/08/04/audio_0625c1539c.mp3?filename=beep-07a-8162.mp3' }
      );
      setSound(sound);
      await sound.playAsync();
    } catch (e) {
      console.error("Failed to play sound", e);
    }
  }

  const formatTime = (totalSeconds) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Text style={styles.label}>TIMED EXERCISE: </Text>
        <Text style={styles.title}>{exercise.name}</Text>
      </View>
      
      <Text style={styles.time}>{formatTime(seconds)}</Text>
      
      <View style={styles.controls}>
        <TouchableOpacity style={[styles.btn, isActive ? styles.pauseBtn : styles.playBtn]} onPress={() => setIsActive(!isActive)}>
          <Text style={styles.btnTxt}>{isActive ? "PAUSE" : "START"}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.btn, styles.skipBtn]} onPress={() => onComplete()}>
          <Text style={styles.btnTxt}>FINISH EARLY</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff3e0',
    padding: 38,
    borderRadius: 30,
    marginVertical: 23,
    alignItems: 'center'
  },
  header: { alignItems: 'center', marginBottom: 30 },
  label: { fontSize: 24, color: '#666', fontWeight: 'bold', marginBottom: 8 },
  title: { fontSize: 48, fontWeight: 'bold', color: '#ff9800', textAlign: 'center' },
  time: { fontSize: 120, fontWeight: 'bold', color: '#333', marginVertical: 20 },
  controls: { flexDirection: 'row', gap: 20, marginTop: 20 },
  btn: { padding: 30, borderRadius: 20, flex: 1, alignItems: 'center' },
  playBtn: { backgroundColor: '#4caf50' },
  pauseBtn: { backgroundColor: '#ff9800' },
  skipBtn: { backgroundColor: '#999' },
  btnTxt: { color: '#fff', fontSize: 30, fontWeight: 'bold' }
});
