import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { deleteHistoryItem } from '../services/db';

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

      <View style={{flexDirection: 'row', gap: 15, marginBottom: 60}}>
        <TouchableOpacity style={[styles.backBtn, {flex: 1, marginBottom: 0, backgroundColor: '#ff4d4d'}]} onPress={async () => {
          if (window.confirm("Détruire cet historique ?")) {
            const success = await deleteHistoryItem(historyItem.id);
            if (success) {
              navigation.navigate('Home');
            } else {
              window.alert("Erreur lors de la suppression");
            }
          }
        }}>
          <Text style={styles.backBtnTxt}>SUPPRIMER</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={[styles.backBtn, {flex: 1, marginBottom: 0}]} onPress={() => navigation.navigate('Home')}>
          <Text style={styles.backBtnTxt}>RETOUR</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5', padding: 23 },
  header: { alignItems: 'center', marginVertical: 30, backgroundColor: '#fff', padding: 30, borderRadius: 15 },
  title: { fontSize: 36, fontWeight: 'bold', color: '#0bc0af', marginBottom: 8 },
  date: { fontSize: 24, color: '#666', marginBottom: 8 },
  volume: { fontSize: 27, fontWeight: 'bold', color: '#333' },
  exercisesList: { marginBottom: 45 },
  sectionTitle: { fontSize: 27, fontWeight: 'bold', color: '#333', marginBottom: 15 },
  exCard: { backgroundColor: '#fff', padding: 23, borderRadius: 12, marginBottom: 15, elevation: 1 },
  exName: { fontSize: 24, fontWeight: 'bold', marginBottom: 8, color: '#1b2a47' },
  setDetail: { fontSize: 21, color: '#555', marginLeft: 23, marginBottom: 3 },
  backBtn: { backgroundColor: '#999', padding: 23, borderRadius: 15, alignItems: 'center', marginBottom: 60 },
  backBtnTxt: { color: '#fff', fontSize: 24, fontWeight: 'bold' }
});
