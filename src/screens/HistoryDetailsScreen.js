import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';

export default function HistoryDetailsScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  
  const historyItem = route.params?.historyItem;

  if (!historyItem) {
    return (
      <View style={styles.container}>
        <Text>No details available.</Text>
        <TouchableOpacity onPress={() => navigation.navigate('Home')} style={styles.backBtn}>
          <Text style={styles.backBtnTxt}>BACK TO HOME</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>{historyItem.name}</Text>
        <Text style={styles.date}>{historyItem.date}</Text>
        <Text style={styles.volume}>Total Volume: {historyItem.volume} kg</Text>
      </View>

      <View style={styles.exercisesList}>
        <Text style={styles.sectionTitle}>Exercises</Text>
        {historyItem.exercises && historyItem.exercises.map((ex, idx) => (
          <View key={ex.id || idx} style={styles.exCard}>
            <Text style={styles.exName}>{idx + 1}. {ex.name}</Text>
            {ex.loggedSets && ex.loggedSets.length > 0 ? (
              ex.loggedSets.map((set, sIdx) => (
                <Text key={sIdx} style={styles.setDetail}>
                  Set {sIdx + 1}: {set.weight} kg x {set.reps} reps
                </Text>
              ))
            ) : (
              <Text style={styles.setDetail}>No sets logged.</Text>
            )}
          </View>
        ))}
      </View>

      <TouchableOpacity style={styles.backBtn} onPress={() => navigation.navigate('Home')}>
        <Text style={styles.backBtnTxt}>BACK TO HOME</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5', padding: 15 },
  header: { alignItems: 'center', marginVertical: 20, backgroundColor: '#fff', padding: 20, borderRadius: 10 },
  title: { fontSize: 24, fontWeight: 'bold', color: '#0bc0af', marginBottom: 5 },
  date: { fontSize: 16, color: '#666', marginBottom: 5 },
  volume: { fontSize: 18, fontWeight: 'bold', color: '#333' },
  exercisesList: { marginBottom: 30 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: '#333', marginBottom: 10 },
  exCard: { backgroundColor: '#fff', padding: 15, borderRadius: 8, marginBottom: 10, elevation: 1 },
  exName: { fontSize: 16, fontWeight: 'bold', marginBottom: 5, color: '#1b2a47' },
  setDetail: { fontSize: 14, color: '#555', marginLeft: 15, marginBottom: 2 },
  backBtn: { backgroundColor: '#999', padding: 15, borderRadius: 10, alignItems: 'center', marginBottom: 40 },
  backBtnTxt: { color: '#fff', fontSize: 16, fontWeight: 'bold' }
});
