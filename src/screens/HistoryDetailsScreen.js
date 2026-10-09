import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, TextInput } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { deleteHistoryItem, updateHistoryItem } from '../services/db';

export default function HistoryDetailsScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  
  const initialHistoryItem = route.params?.historyItem;
  
  const [isEditing, setIsEditing] = useState(false);
  const [editedItem, setEditedItem] = useState(initialHistoryItem);

  if (!editedItem) {
    return (
      <View style={styles.container}>
        <Text>No details available.</Text>
        <TouchableOpacity onPress={() => navigation.navigate('Home')} style={styles.backBtn}>
          <Text style={styles.backBtnTxt}>RETOUR</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const handleSave = async () => {
    // Recalculate volume just in case
    let newVolume = 0;
    if (editedItem.exercises) {
      editedItem.exercises.forEach(ex => {
        if (ex.type !== 'time' && ex.loggedSets) {
          ex.loggedSets.forEach(set => {
            newVolume += (parseFloat(set.weight) || 0) * (parseInt(set.reps) || 0);
          });
        }
      });
    }

    const updated = { ...editedItem, volume: newVolume };
    const success = await updateHistoryItem(updated);
    
    if (success) {
      setEditedItem(updated);
      setIsEditing(false);
      window.alert("Historique mis à jour");
    } else {
      window.alert("Erreur lors de la mise à jour");
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>{editedItem.name}</Text>
        <Text style={styles.date}>{editedItem.date}</Text>
        <Text style={styles.volume}>Total Volume: {editedItem.volume} kg</Text>
      </View>

      <View style={styles.exercisesList}>
        <View style={{flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15}}>
          <Text style={styles.sectionTitle}>Exercises</Text>
          <TouchableOpacity onPress={() => isEditing ? handleSave() : setIsEditing(true)} style={styles.editBtn}>
            <Text style={styles.editBtnTxt}>{isEditing ? "SAUVEGARDER" : "MODIFIER"}</Text>
          </TouchableOpacity>
        </View>

        {editedItem.exercises && editedItem.exercises.map((ex, idx) => (
          <View key={ex.id || idx} style={styles.exCard}>
            <Text style={styles.exName}>{idx + 1}. {ex.name}</Text>
            
            {ex.loggedSets && ex.loggedSets.length > 0 ? (
              ex.loggedSets.map((set, sIdx) => (
                <View key={sIdx} style={styles.setRow}>
                  <Text style={styles.setLabel}>Set {sIdx + 1}:</Text>
                  {isEditing ? (
                    <View style={styles.editInputsRow}>
                      <TextInput 
                        style={styles.editInput} 
                        keyboardType="numeric"
                        value={String(set.weight)}
                        onChangeText={(val) => {
                          const newExercises = [...editedItem.exercises];
                          newExercises[idx].loggedSets[sIdx].weight = val;
                          setEditedItem({...editedItem, exercises: newExercises});
                        }}
                      />
                      <Text style={styles.setLabel}> kg x </Text>
                      <TextInput 
                        style={styles.editInput} 
                        keyboardType="numeric"
                        value={String(set.reps)}
                        onChangeText={(val) => {
                          const newExercises = [...editedItem.exercises];
                          newExercises[idx].loggedSets[sIdx].reps = val;
                          setEditedItem({...editedItem, exercises: newExercises});
                        }}
                      />
                      <Text style={styles.setLabel}> reps</Text>
                    </View>
                  ) : (
                    <Text style={styles.setDetail}>
                      {set.weight} kg x {set.reps} reps
                    </Text>
                  )}
                </View>
              ))
            ) : (
              <Text style={styles.setDetail}>{ex.type === 'time' ? "Cardio / Temps" : "Aucun set loggé."}</Text>
            )}

            {/* Notes Section */}
            {isEditing ? (
              <TextInput
                style={styles.notesInput}
                placeholder="Notes / Ajustements..."
                value={ex.notes || ''}
                multiline
                onChangeText={(val) => {
                  const newExercises = [...editedItem.exercises];
                  newExercises[idx].notes = val;
                  setEditedItem({...editedItem, exercises: newExercises});
                }}
              />
            ) : ex.notes ? (
              <Text style={styles.notesText}>Notes: {ex.notes}</Text>
            ) : null}
          </View>
        ))}
      </View>

      <View style={{flexDirection: 'row', gap: 15, marginBottom: 60}}>
        <TouchableOpacity style={[styles.backBtn, {flex: 1, marginBottom: 0, backgroundColor: '#ff4d4d'}]} onPress={async () => {
          if (window.confirm("Détruire cet historique ?")) {
            const success = await deleteHistoryItem(editedItem);
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
  sectionTitle: { fontSize: 27, fontWeight: 'bold', color: '#333' },
  editBtn: { backgroundColor: '#0bc0af', paddingHorizontal: 15, paddingVertical: 10, borderRadius: 8 },
  editBtnTxt: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  exCard: { backgroundColor: '#fff', padding: 23, borderRadius: 12, marginBottom: 15, elevation: 1 },
  exName: { fontSize: 24, fontWeight: 'bold', marginBottom: 8, color: '#1b2a47' },
  setRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 10, marginLeft: 23 },
  setLabel: { fontSize: 21, color: '#555' },
  setDetail: { fontSize: 21, color: '#555', marginLeft: 8 },
  editInputsRow: { flexDirection: 'row', alignItems: 'center', marginLeft: 8 },
  editInput: { borderBottomWidth: 1, borderBottomColor: '#0bc0af', fontSize: 21, minWidth: 40, textAlign: 'center', padding: 0 },
  notesInput: { marginTop: 15, backgroundColor: '#f9f9f9', padding: 15, borderRadius: 8, fontSize: 18, minHeight: 60, textAlignVertical: 'top' },
  notesText: { marginTop: 15, fontSize: 18, color: '#666', fontStyle: 'italic', backgroundColor: '#f9f9f9', padding: 10, borderRadius: 8 },
  backBtn: { backgroundColor: '#999', padding: 23, borderRadius: 15, alignItems: 'center', marginBottom: 60 },
  backBtnTxt: { color: '#fff', fontSize: 24, fontWeight: 'bold' }
});
