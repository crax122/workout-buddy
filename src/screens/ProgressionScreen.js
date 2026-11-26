import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, ActivityIndicator } from 'react-native';
import { useNavigation, useIsFocused } from '@react-navigation/native';
import { getHistory, deleteHistoryItem, deleteExerciseSessionFromHistory } from '../services/db';
import { analyzeProgression } from '../services/progression';
import ProgressionChart from '../components/ProgressionChart';

const STATUS_META = {
  up: { label: '📈 Progression', bg: '#e8f5e9', color: '#2e7d32', border: '#a5d6a7' },
  same: { label: '➡️ Stable', bg: '#e3f2fd', color: '#1565c0', border: '#90caf9' },
  down: { label: '📉 En baisse', bg: '#ffebee', color: '#c62828', border: '#ef9a9a' },
  first: { label: '🆕 Référence', bg: '#f3e5f5', color: '#6a1b9a', border: '#ce93d8' }
};

const formatSigned = (val, unit = '') => {
  if (val > 0) return `+${val}${unit}`;
  if (val < 0) return `${val}${unit}`;
  return `0${unit}`;
};

const formatDuration = (secs) => {
  const m = Math.floor((secs || 0) / 60);
  const s = (secs || 0) % 60;
  return `${m}m ${s}s`;
};

export default function ProgressionScreen() {
  const navigation = useNavigation();
  const isFocused = useIsFocused();

  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedWorkout, setSelectedWorkout] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedKeys, setExpandedKeys] = useState({});
  const [showManageSessions, setShowManageSessions] = useState(false);

  useEffect(() => {
    if (isFocused) {
      loadData();
    }
  }, [isFocused]);

  const loadData = async () => {
    setLoading(true);
    const h = await getHistory();
    setHistory(h || []);
    setLoading(false);
  };

  const handleDeleteExerciseSession = async (session, exerciseName) => {
    const confirmed =
      typeof window !== 'undefined' && window.confirm
        ? window.confirm(`Supprimer la séance du ${session.date} (${session.workoutName}) pour ${exerciseName} ?`)
        : true;
    if (!confirmed) return;

    const ok = await deleteExerciseSessionFromHistory(
      session.historyId,
      exerciseName,
      session.date,
      session.workoutName
    );
    if (ok) {
      await loadData();
    } else if (typeof window !== 'undefined' && window.alert) {
      window.alert('Erreur lors de la suppression');
    }
  };

  const handleDeleteWorkoutSession = async (historyItem) => {
    const confirmed =
      typeof window !== 'undefined' && window.confirm
        ? window.confirm(`Supprimer toute la séance "${historyItem.name}" du ${historyItem.date} ?`)
        : true;
    if (!confirmed) return;

    const ok = await deleteHistoryItem(historyItem);
    if (ok) {
      await loadData();
    } else if (typeof window !== 'undefined' && window.alert) {
      window.alert('Erreur lors de la suppression');
    }
  };

  const filteredHistoryNewestFirst = useMemo(() => {
    const list = (history || []).filter(h =>
      selectedWorkout === 'ALL' ? true : h && h.name === selectedWorkout
    );
    return [...list].reverse();
  }, [history, selectedWorkout]);

  const analysis = useMemo(() => {
    return analyzeProgression(history, selectedWorkout);
  }, [history, selectedWorkout]);

  const displayedExercises = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return analysis.exercises;
    return analysis.exercises.filter(ex => ex.name.toLowerCase().includes(q));
  }, [analysis.exercises, searchQuery]);

  const toggleExpand = (key) => {
    setExpandedKeys(prev => ({ ...prev, [key]: prev[key] === false ? true : false }));
  };

  const isExpanded = (key) => expandedKeys[key] !== false;

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 40 }}>
      <View style={styles.header}>
        <Text style={styles.title}>📈 Progression</Text>
        <Text style={styles.subtitle}>
          Analyse par exercice — poids levé & répétitions ({analysis.totalSessionsAnalyzed} séance{analysis.totalSessionsAnalyzed > 1 ? 's' : ''})
        </Text>
      </View>

      {analysis.workoutNames.length > 0 && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.filterScroll}
          contentContainerStyle={{ gap: 8, paddingVertical: 4 }}
        >
          <TouchableOpacity
            style={[styles.filterChip, selectedWorkout === 'ALL' && styles.filterChipActive]}
            onPress={() => setSelectedWorkout('ALL')}
          >
            <Text style={[styles.filterChipTxt, selectedWorkout === 'ALL' && styles.filterChipTxtActive]}>
              Toutes les séances
            </Text>
          </TouchableOpacity>
          {analysis.workoutNames.map(wName => (
            <TouchableOpacity
              key={wName}
              style={[styles.filterChip, selectedWorkout === wName && styles.filterChipActive]}
              onPress={() => setSelectedWorkout(wName)}
            >
              <Text style={[styles.filterChipTxt, selectedWorkout === wName && styles.filterChipTxtActive]}>
                {wName}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}

      <TextInput
        style={styles.searchInput}
        placeholder="🔍 Rechercher un exercice (ex: Curl, Bench...)"
        placeholderTextColor="#888"
        value={searchQuery}
        onChangeText={setSearchQuery}
      />

      {filteredHistoryNewestFirst.length > 0 && (
        <View style={styles.manageSection}>
          <TouchableOpacity
            style={styles.manageToggleBtn}
            onPress={() => setShowManageSessions(!showManageSessions)}
          >
            <Text style={styles.manageToggleTxt}>
              {showManageSessions ? '▲ Masquer la liste des séances' : `🗑️ Gérer / Supprimer des séances (${filteredHistoryNewestFirst.length})`}
            </Text>
          </TouchableOpacity>

          {showManageSessions && (
            <View style={styles.manageList}>
              {filteredHistoryNewestFirst.map((hItem, idx) => (
                <View key={hItem.id || `${hItem.date}-${idx}`} style={styles.manageRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.manageTitle}>{hItem.date} • {hItem.name}</Text>
                    <Text style={styles.manageSub}>
                      Vol: {hItem.volume || 0} kg • {(hItem.exercises || []).length} exercice(s)
                    </Text>
                  </View>
                  <TouchableOpacity
                    style={styles.deleteBtn}
                    onPress={() => handleDeleteWorkoutSession(hItem)}
                  >
                    <Text style={styles.deleteBtnTxt}>🗑️</Text>
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          )}
        </View>
      )}

      {loading ? (
        <ActivityIndicator size="large" color="#0bc0af" style={{ marginTop: 30 }} />
      ) : displayedExercises.length === 0 ? (
        <View style={styles.emptyCard}>
          <Text style={styles.emptyTxt}>
            Aucune séance enregistrée pour le moment. Terminez et sauvegardez un entraînement pour voir votre progression !
          </Text>
        </View>
      ) : (
        displayedExercises.map(ex => {
          const meta = STATUS_META[ex.overallStatus] || STATUS_META.first;
          const expanded = isExpanded(ex.key);
          const sessionsNewestFirst = [...ex.sessions].reverse();

          return (
            <View key={ex.key} style={styles.exCard}>
              <TouchableOpacity style={styles.exHeader} onPress={() => toggleExpand(ex.key)}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.exName}>{ex.name}</Text>
                  <Text style={styles.exSub}>
                    {ex.sessionCount} séance{ex.sessionCount > 1 ? 's' : ''} enregistrée{ex.sessionCount > 1 ? 's' : ''}
                  </Text>
                </View>
                <View style={[styles.statusBadge, { backgroundColor: meta.bg, borderColor: meta.border }]}>
                  <Text style={[styles.statusBadgeTxt, { color: meta.color }]}>{meta.label}</Text>
                </View>
              </TouchableOpacity>

              {!ex.isTime && (
                <View style={styles.recordsRow}>
                  <View style={styles.recordPill}>
                    <Text style={styles.recordLabel}>Max Poids</Text>
                    <Text style={styles.recordVal}>{ex.bestWeight} kg</Text>
                  </View>
                  <View style={styles.recordPill}>
                    <Text style={styles.recordLabel}>Meilleur 1RM</Text>
                    <Text style={styles.recordVal}>{ex.best1RM} kg</Text>
                  </View>
                  <View style={styles.recordPill}>
                    <Text style={styles.recordLabel}>Max Reps</Text>
                    <Text style={styles.recordVal}>{ex.bestReps}</Text>
                  </View>
                  <View style={styles.recordPill}>
                    <Text style={styles.recordLabel}>Meilleur Vol.</Text>
                    <Text style={styles.recordVal}>{ex.bestVolume} kg</Text>
                  </View>
                </View>
              )}

              {ex.analysisText ? (
                <View style={[styles.analysisBox, { borderColor: meta.border, backgroundColor: meta.bg }]}>
                  <Text style={[styles.analysisTitle, { color: meta.color }]}>🔍 Analyse :</Text>
                  <Text style={styles.analysisTxt}>{ex.analysisText}</Text>
                </View>
              ) : null}

              <ProgressionChart exercise={ex} />

              {expanded && (
                <View style={styles.sessionsList}>
                  {sessionsNewestFirst.map((s, idx) => {
                    const sMeta = STATUS_META[s.status] || STATUS_META.first;
                    const sessionNum = ex.sessions.length - idx;
                    return (
                      <View key={`${s.historyId}-${idx}`} style={styles.sessionRow}>
                        <View style={styles.sessionTop}>
                          <Text style={styles.sessionDate}>
                            #{sessionNum} • {s.date} ({s.workoutName})
                          </Text>
                          <TouchableOpacity
                            style={styles.sessionDeleteBtn}
                            onPress={() => handleDeleteExerciseSession(s, ex.name)}
                          >
                            <Text style={styles.sessionDeleteTxt}>🗑️</Text>
                          </TouchableOpacity>
                        </View>

                        {ex.isTime ? (
                          <Text style={styles.sessionDetail}>
                            ⏱ Durée : {formatDuration(s.durationSeconds)}
                            {s.status !== 'first' ? ` (${formatSigned(s.durDiff, 's')})` : ''}
                          </Text>
                        ) : (
                          <>
                            <Text style={styles.sessionSets}>{s.setsSummary}</Text>
                            <View style={styles.sessionBottom}>
                              <Text style={styles.sessionMetrics}>
                                Max: {s.maxWeight} kg • Reps: {s.totalReps} • Vol: {s.totalVolume} kg • 1RM: {s.best1RM} kg
                              </Text>
                              <Text style={[styles.sessionDelta, { color: sMeta.color }]}>
                                {s.status === 'first'
                                  ? '🆕 1ère séance'
                                  : `${sMeta.label} (${formatSigned(s.weightDiff, ' kg')} poids, ${formatSigned(s.repsDiff, ' reps')}, ${formatSigned(s.oneRMDiff, ' kg')} 1RM)`}
                              </Text>
                            </View>
                          </>
                        )}
                      </View>
                    );
                  })}
                </View>
              )}
            </View>
          );
        })
      )}

      <TouchableOpacity style={styles.backBtn} onPress={() => navigation.navigate('Home')}>
        <Text style={styles.backBtnTxt}>BACK TO HOME</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5', padding: 14 },
  header: { alignItems: 'center', marginVertical: 12 },
  title: { fontSize: 24, fontWeight: 'bold', color: '#673ab7' },
  subtitle: { fontSize: 13, color: '#666', marginTop: 4, textAlign: 'center' },
  filterScroll: { marginBottom: 10 },
  filterChip: { backgroundColor: '#fff', paddingVertical: 8, paddingHorizontal: 14, borderRadius: 20, borderWidth: 1, borderColor: '#ddd' },
  filterChipActive: { backgroundColor: '#673ab7', borderColor: '#673ab7' },
  filterChipTxt: { fontSize: 13, fontWeight: 'bold', color: '#555' },
  filterChipTxtActive: { color: '#fff' },
  searchInput: { backgroundColor: '#fff', padding: 10, borderRadius: 10, borderWidth: 1, borderColor: '#ddd', fontSize: 15, color: '#111111', marginBottom: 10 },
  manageSection: { marginBottom: 14 },
  manageToggleBtn: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#ef9a9a', borderRadius: 10, paddingVertical: 10, paddingHorizontal: 12, alignItems: 'center' },
  manageToggleTxt: { color: '#c62828', fontSize: 13, fontWeight: 'bold' },
  manageList: { backgroundColor: '#fff', borderRadius: 10, padding: 10, marginTop: 8, borderWidth: 1, borderColor: '#eee' },
  manageRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#f0f0f0' },
  manageTitle: { fontSize: 13, fontWeight: 'bold', color: '#1b2a47' },
  manageSub: { fontSize: 12, color: '#666', marginTop: 2 },
  deleteBtn: { backgroundColor: '#ffebee', paddingVertical: 6, paddingHorizontal: 10, borderRadius: 8, marginLeft: 8 },
  deleteBtnTxt: { fontSize: 15 },
  emptyCard: { backgroundColor: '#fff', padding: 20, borderRadius: 12, alignItems: 'center', marginTop: 10 },
  emptyTxt: { fontSize: 14, color: '#666', textAlign: 'center', fontStyle: 'italic' },
  exCard: { backgroundColor: '#fff', borderRadius: 14, padding: 14, marginBottom: 14, elevation: 2 },
  exHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 },
  exName: { fontSize: 17, fontWeight: 'bold', color: '#1b2a47' },
  exSub: { fontSize: 12, color: '#777', marginTop: 2 },
  statusBadge: { paddingVertical: 4, paddingHorizontal: 10, borderRadius: 12, borderWidth: 1 },
  statusBadgeTxt: { fontSize: 12, fontWeight: 'bold' },
  recordsRow: { flexDirection: 'row', gap: 6, marginBottom: 10 },
  recordPill: { flex: 1, backgroundColor: '#f4fbfa', padding: 7, borderRadius: 8, alignItems: 'center', borderWidth: 1, borderColor: '#ccebe8' },
  recordLabel: { fontSize: 10, color: '#666', fontWeight: 'bold' },
  recordVal: { fontSize: 13, color: '#0bc0af', fontWeight: 'bold', marginTop: 2 },
  analysisBox: { padding: 10, borderRadius: 10, borderWidth: 1, marginBottom: 10 },
  analysisTitle: { fontSize: 12, fontWeight: 'bold', marginBottom: 3 },
  analysisTxt: { fontSize: 13, color: '#222', lineHeight: 18 },
  sessionsList: { borderTopWidth: 1, borderTopColor: '#eee', paddingTop: 8 },
  sessionRow: { backgroundColor: '#fafafa', padding: 10, borderRadius: 10, marginBottom: 8, borderWidth: 1, borderColor: '#eee' },
  sessionTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  sessionDate: { fontSize: 12, fontWeight: 'bold', color: '#1b2a47', flex: 1 },
  sessionDeleteBtn: { backgroundColor: '#ffebee', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6, marginLeft: 8 },
  sessionDeleteTxt: { fontSize: 13 },
  sessionSets: { fontSize: 13, color: '#333', fontWeight: '600', marginBottom: 4 },
  sessionDetail: { fontSize: 13, color: '#333', fontWeight: 'bold' },
  sessionBottom: { marginTop: 2 },
  sessionMetrics: { fontSize: 12, color: '#666' },
  sessionDelta: { fontSize: 12, fontWeight: 'bold', marginTop: 3 },
  backBtn: { backgroundColor: '#999', padding: 14, borderRadius: 12, alignItems: 'center', marginTop: 10 },
  backBtnTxt: { color: '#fff', fontSize: 15, fontWeight: 'bold' }
});
