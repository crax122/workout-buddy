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
            ) : ex.type === 'time' ? (
              <View style={styles.setRow}>
                <Text style={styles.setDetail}>
                  ⏱ Durée : {Math.floor((ex.durationSeconds || 0) / 60)}m {(ex.durationSeconds || 0) % 60}s
                </Text>
                {isEditing && (
                  <View style={[styles.editInputsRow, { gap: 8, marginLeft: 15 }]}>
                    <TouchableOpacity
                      style={{ backgroundColor: '#ffe6e6', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 6 }}
                      onPress={() => {
                        const newExercises = [...editedItem.exercises];
                        newExercises[idx].durationSeconds = Math.max(0, (ex.durationSeconds || 0) - 60);
                        setEditedItem({ ...editedItem, exercises: newExercises });
                      }}
                    >
                      <Text style={{ color: '#d32f2f', fontWeight: 'bold', fontSize: 18 }}>-1m</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={{ backgroundColor: '#e6f7f6', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 6 }}
                      onPress={() => {
                        const newExercises = [...editedItem.exercises];
                        newExercises[idx].durationSeconds = (ex.durationSeconds || 0) + 60;
                        setEditedItem({ ...editedItem, exercises: newExercises });
                      }}
                    >
                      <Text style={{ color: '#0bc0af', fontWeight: 'bold', fontSize: 18 }}>+1m</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            ) : (
              <Text style={styles.setDetail}>Aucun set loggé.</Text>
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
                  newExercises[idx] = { ...newExercises[idx], notes: val, noteUpdatedAt: Date.now() };
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
  container: { flex: 1, backgroundColor: '#f5f5f5', padding: 16 },
  header: { alignItems: 'center', marginVertical: 14, backgroundColor: '#fff', padding: 18, borderRadius: 12 },
  title: { fontSize: 22, fontWeight: 'bold', color: '#0bc0af', marginBottom: 6 },
  date: { fontSize: 15, color: '#666', marginBottom: 6 },
  volume: { fontSize: 17, fontWeight: 'bold', color: '#333' },
  exercisesList: { marginBottom: 24 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: '#333' },
  editBtn: { backgroundColor: '#0bc0af', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8 },
  editBtnTxt: { color: '#fff', fontSize: 14, fontWeight: 'bold' },
  exCard: { backgroundColor: '#fff', padding: 16, borderRadius: 12, marginBottom: 12, elevation: 1 },
  exName: { fontSize: 17, fontWeight: 'bold', marginBottom: 6, color: '#1b2a47' },
  setRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 6, marginLeft: 10 },
  setLabel: { fontSize: 15, color: '#555' },
  setDetail: { fontSize: 15, color: '#555', marginLeft: 6 },
  editInputsRow: { flexDirection: 'row', alignItems: 'center', marginLeft: 6 },
  editInput: { borderBottomWidth: 1, borderBottomColor: '#0bc0af', fontSize: 15, minWidth: 36, textAlign: 'center', padding: 0 },
  notesInput: { marginTop: 10, backgroundColor: '#f9f9f9', padding: 10, borderRadius: 8, fontSize: 14, minHeight: 50, textAlignVertical: 'top' },
  notesText: { marginTop: 10, fontSize: 14, color: '#666', fontStyle: 'italic', backgroundColor: '#f9f9f9', padding: 8, borderRadius: 8 },
  backBtn: { backgroundColor: '#999', padding: 15, borderRadius: 12, alignItems: 'center', marginBottom: 40 },
  backBtnTxt: { color: '#fff', fontSize: 16, fontWeight: 'bold' }
});
