import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Audio } from 'expo-av';

export default function ChronoScreen() {
  const navigation = useNavigation();
  
  const [tab, setTab] = useState('stopwatch'); // 'stopwatch' or 'timer'
  
  // Stopwatch state
  const [swTime, setSwTime] = useState(0); // in tenths of second
  const [swActive, setSwActive] = useState(false);
  
  // Timer state
  const [tInput, setTInput] = useState('60');
  const [tTime, setTTime] = useState(60); // in seconds
  const [tActive, setTActive] = useState(false);
  const [sound, setSound] = useState(null);

  useEffect(() => {
    let interval = null;
    if (swActive) {
      interval = setInterval(() => {
        setSwTime(t => t + 1);
      }, 100);
    }
    return () => clearInterval(interval);
  }, [swActive]);

  useEffect(() => {
    let interval = null;
    if (tActive && tTime > 0) {
      interval = setInterval(() => {
        setTTime(t => t - 1);
      }, 1000);
    } else if (tActive && tTime === 0) {
      setTActive(false);
      playSound();
    }
    return () => clearInterval(interval);
  }, [tActive, tTime]);

  useEffect(() => {
    return sound ? () => sound.unloadAsync() : undefined;
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

  const formatSw = (time) => {
    const mins = Math.floor(time / 600);
    const secs = Math.floor((time % 600) / 10);
    const tenths = time % 10;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}.${tenths}`;
  };

  const formatT = (time) => {
    const mins = Math.floor(time / 60);
    const secs = time % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const startTimer = () => {
    const secs = parseInt(tInput) || 0;
    if (secs > 0) {
      setTTime(secs);
      setTActive(true);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Chrono & Timer</Text>
      
      <View style={styles.tabContainer}>
        <TouchableOpacity style={[styles.tabBtn, tab === 'stopwatch' && styles.tabActive]} onPress={() => setTab('stopwatch')}>
          <Text style={[styles.tabTxt, tab === 'stopwatch' && styles.tabTxtActive]}>Stopwatch</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.tabBtn, tab === 'timer' && styles.tabActive]} onPress={() => setTab('timer')}>
          <Text style={[styles.tabTxt, tab === 'timer' && styles.tabTxtActive]}>Timer</Text>
        </TouchableOpacity>
      </View>

      {tab === 'stopwatch' ? (
        <View style={styles.content}>
          <Text style={styles.display}>{formatSw(swTime)}</Text>
          <View style={styles.controls}>
            <TouchableOpacity style={[styles.btn, swActive ? styles.btnPause : styles.btnStart]} onPress={() => setSwActive(!swActive)}>
              <Text style={styles.btnTxt}>{swActive ? "PAUSE" : "START"}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.btn, styles.btnReset]} onPress={() => { setSwActive(false); setSwTime(0); }}>
              <Text style={styles.btnTxt}>RESET</Text>
            </TouchableOpacity>
          </View>
        </View>
      ) : (
        <View style={styles.content}>
          {!tActive && tTime === 60 && (
            <View style={{flexDirection: 'row', alignItems: 'center', marginBottom: 20}}>
              <Text style={styles.label}>Seconds: </Text>
              <TextInput style={styles.input} value={tInput} onChangeText={setTInput} keyboardType="numeric" />
            </View>
          )}
          <Text style={styles.display}>{formatT(tTime)}</Text>
          <View style={styles.controls}>
            {!tActive && tTime === parseInt(tInput) ? (
              <TouchableOpacity style={[styles.btn, styles.btnStart]} onPress={startTimer}>
                <Text style={styles.btnTxt}>START</Text>
              </TouchableOpacity>
            ) : (
              <>
                <TouchableOpacity style={[styles.btn, tActive ? styles.btnPause : styles.btnStart]} onPress={() => setTActive(!tActive)}>
                  <Text style={styles.btnTxt}>{tActive ? "PAUSE" : "RESUME"}</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.btn, styles.btnReset]} onPress={() => { setTActive(false); setTTime(parseInt(tInput) || 60); }}>
                  <Text style={styles.btnTxt}>RESET</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>
      )}

      <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
        <Text style={styles.backBtnTxt}>BACK</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5', padding: 30, alignItems: 'center' },
  title: { fontSize: 48, fontWeight: 'bold', color: '#0bc0af', marginVertical: 30 },
  tabContainer: { flexDirection: 'row', backgroundColor: '#e0e0e0', borderRadius: 20, padding: 5, marginBottom: 40, width: '100%' },
  tabBtn: { flex: 1, padding: 20, alignItems: 'center', borderRadius: 15 },
  tabActive: { backgroundColor: '#fff' },
  tabTxt: { fontSize: 24, fontWeight: 'bold', color: '#888' },
  tabTxtActive: { color: '#0bc0af' },
  content: { flex: 1, width: '100%', alignItems: 'center', justifyContent: 'center' },
  display: { fontSize: 100, fontWeight: 'bold', color: '#333', marginBottom: 40 },
  label: { fontSize: 30, fontWeight: 'bold', color: '#666' },
  input: { fontSize: 30, fontWeight: 'bold', backgroundColor: '#fff', padding: 15, borderRadius: 10, minWidth: 100, textAlign: 'center' },
  controls: { flexDirection: 'row', gap: 20, width: '100%' },
  btn: { flex: 1, padding: 30, borderRadius: 20, alignItems: 'center' },
  btnStart: { backgroundColor: '#4caf50' },
  btnPause: { backgroundColor: '#ff9800' },
  btnReset: { backgroundColor: '#999' },
  btnTxt: { color: '#fff', fontSize: 30, fontWeight: 'bold' },
  backBtn: { backgroundColor: '#333', padding: 30, borderRadius: 20, alignItems: 'center', width: '100%', marginTop: 20 },
  backBtnTxt: { color: '#fff', fontSize: 30, fontWeight: 'bold' }
});
