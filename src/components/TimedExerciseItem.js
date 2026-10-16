import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Audio } from 'expo-av';

export default function TimedExerciseItem({ exercise, onComplete, onAdjustTime }) {
  const initialSecs = exercise.remainingSeconds !== undefined
    ? exercise.remainingSeconds
    : (exercise.durationSeconds || 300);

  const [seconds, setSeconds] = useState(initialSecs);
  const [isActive, setIsActive] = useState(false);
  const [sound, setSound] = useState(null);

  useEffect(() => {
    const nextSecs = exercise.remainingSeconds !== undefined
      ? exercise.remainingSeconds
      : (exercise.durationSeconds || 300);
    setSeconds(nextSecs);
    setIsActive(false);
  }, [exercise.id]);

  useEffect(() => {
    let interval = null;
    if (isActive && seconds > 0) {
      interval = setInterval(() => {
        setSeconds((s) => Math.max(0, s - 1));
      }, 1000);
    } else if (isActive && seconds <= 0) {
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
      const { sound } = await Audio.Sound.createAsync(
        { uri: 'https://cdn.pixabay.com/download/audio/2021/08/04/audio_0625c1539c.mp3?filename=beep-07a-8162.mp3' }
      );
      setSound(sound);
      await sound.playAsync();
    } catch (e) {
      console.error("Failed to play sound", e);
    }
  }

  const adjustTime = (deltaSeconds) => {
    const next = Math.max(0, seconds + deltaSeconds);
    const actualDelta = next - seconds;
    setSeconds(next);
    if (next === 0 && isActive) {
      setIsActive(false);
    }
    if (onAdjustTime) {
      onAdjustTime(actualDelta, next);
    }
  };

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

      <View style={styles.adjustSection}>
        <Text style={styles.adjustLabel}>AJUSTER LE TEMPS :</Text>
        <View style={styles.adjustRow}>
          <TouchableOpacity style={[styles.adjustBtn, styles.decreaseBtn]} onPress={() => adjustTime(-300)}>
            <Text style={styles.decreaseBtnTxt}>-5m</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.adjustBtn, styles.decreaseBtn]} onPress={() => adjustTime(-60)}>
            <Text style={styles.decreaseBtnTxt}>-1m</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.adjustBtn, styles.increaseBtn]} onPress={() => adjustTime(60)}>
            <Text style={styles.increaseBtnTxt}>+1m</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.adjustBtn, styles.increaseBtn]} onPress={() => adjustTime(300)}>
            <Text style={styles.increaseBtnTxt}>+5m</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.adjustRow}>
          <TouchableOpacity style={[styles.adjustBtn, styles.decreaseBtn]} onPress={() => adjustTime(-30)}>
            <Text style={styles.decreaseBtnTxt}>-30s</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.adjustBtn, styles.decreaseBtn]} onPress={() => adjustTime(-15)}>
            <Text style={styles.decreaseBtnTxt}>-15s</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.adjustBtn, styles.increaseBtn]} onPress={() => adjustTime(15)}>
            <Text style={styles.increaseBtnTxt}>+15s</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.adjustBtn, styles.increaseBtn]} onPress={() => adjustTime(30)}>
            <Text style={styles.increaseBtnTxt}>+30s</Text>
          </TouchableOpacity>
        </View>
      </View>
      
      <View style={styles.controls}>
        <TouchableOpacity
          style={[styles.btn, isActive ? styles.pauseBtn : styles.playBtn]}
          onPress={() => {
            if (!isActive && seconds === 0) return;
            setIsActive(!isActive);
          }}
        >
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
  header: { alignItems: 'center', marginBottom: 20 },
  label: { fontSize: 24, color: '#666', fontWeight: 'bold', marginBottom: 8 },
  title: { fontSize: 48, fontWeight: 'bold', color: '#ff9800', textAlign: 'center' },
  time: { fontSize: 120, fontWeight: 'bold', color: '#333', marginVertical: 15 },
  adjustSection: { width: '100%', marginVertical: 15, alignItems: 'center' },
  adjustLabel: { fontSize: 22, fontWeight: 'bold', color: '#666', marginBottom: 12 },
  adjustRow: { flexDirection: 'row', gap: 12, width: '100%', marginBottom: 12 },
  adjustBtn: { flex: 1, paddingVertical: 22, borderRadius: 18, alignItems: 'center', justifyContent: 'center', borderWidth: 2 },
  decreaseBtn: { backgroundColor: '#ffe6e6', borderColor: '#ff4d4d' },
  increaseBtn: { backgroundColor: '#e6f7f6', borderColor: '#0bc0af' },
  decreaseBtnTxt: { color: '#d32f2f', fontSize: 28, fontWeight: 'bold' },
  increaseBtnTxt: { color: '#0bc0af', fontSize: 28, fontWeight: 'bold' },
  controls: { flexDirection: 'row', gap: 20, marginTop: 15, width: '100%' },
  btn: { padding: 30, borderRadius: 20, flex: 1, alignItems: 'center' },
  playBtn: { backgroundColor: '#4caf50' },
  pauseBtn: { backgroundColor: '#ff9800' },
  skipBtn: { backgroundColor: '#999' },
  btnTxt: { color: '#fff', fontSize: 30, fontWeight: 'bold' }
});
