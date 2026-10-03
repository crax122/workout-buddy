import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';

export default function SummaryScreen() {
  const navigation = useNavigation();

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <View style={styles.header}>
          <Text style={styles.title}>Show Summary</Text>
          <Text style={styles.subtitle}>Screen</Text>
        </View>

        <View style={styles.details}>
          <Text style={styles.detailText}>Total Time: 45:12</Text>
          <Text style={styles.detailText}>Volume: 1250 kg</Text>
        </View>

        <TouchableOpacity style={styles.saveBtn} onPress={() => navigation.navigate('Home')}>
          <Text style={styles.saveBtnTxt}>SAVE & ARCHIVE</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5', justifyContent: 'center', alignItems: 'center', padding: 20 },
  card: { backgroundColor: '#fff', width: '100%', borderRadius: 15, overflow: 'hidden', elevation: 5 },
  header: { backgroundColor: '#0bc0af', padding: 20, alignItems: 'center' },
  title: { color: '#fff', fontSize: 24, fontWeight: 'bold' },
  subtitle: { color: '#fff', fontSize: 18 },
  details: { padding: 30, alignItems: 'center' },
  detailText: { fontSize: 18, color: '#333', marginBottom: 10, fontWeight: 'bold' },
  saveBtn: { backgroundColor: '#4caf50', padding: 15, margin: 20, borderRadius: 25, alignItems: 'center' },
  saveBtnTxt: { color: '#fff', fontSize: 16, fontWeight: 'bold' }
});
