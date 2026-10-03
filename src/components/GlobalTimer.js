import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';

export default function GlobalTimer({ isActive, onPause, onPlay, onEnd }) {
  const [seconds, setSeconds] = useState(0);

  useEffect(() => {
    let interval = null;
    if (isActive) {
      interval = setInterval(() => {
        setSeconds((seconds) => seconds + 1);
      }, 1000);
    } else if (!isActive && seconds !== 0) {
      clearInterval(interval);
    }
    return () => clearInterval(interval);
  }, [isActive, seconds]);

  const formatTime = (totalSeconds) => {
    const hrs = Math.floor(totalSeconds / 3600);
    const mins = Math.floor((totalSeconds % 3600) / 60);
    const secs = totalSeconds % 60;
    return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <View style={styles.container}>
      <Text style={styles.label}>TOTAL WORKOUT TIME:</Text>
      <View style={styles.row}>
        <Text style={styles.time}>{formatTime(seconds)}</Text>
        <View style={styles.controls}>
          <TouchableOpacity onPress={onPause} style={styles.btn}><Text>⏸️</Text></TouchableOpacity>
          <TouchableOpacity onPress={onPlay} style={styles.btn}><Text>▶️</Text></TouchableOpacity>
          <TouchableOpacity onPress={onEnd} style={[styles.btn, styles.endBtn]}><Text style={styles.endTxt}>❌</Text></TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#0bc0af',
    padding: 15,
    borderRadius: 10,
    marginVertical: 10,
  },
  label: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 5,
  },
  time: {
    color: '#fff',
    fontSize: 32,
    fontWeight: 'bold',
  },
  controls: {
    flexDirection: 'row',
  },
  btn: {
    backgroundColor: '#fff',
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 10,
  },
  endBtn: {
    backgroundColor: '#ff4d4d',
  },
  endTxt: {
    color: '#fff',
    fontSize: 18,
  }
});
