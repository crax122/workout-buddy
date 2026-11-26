import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, ActivityIndicator } from 'react-native';
import { useNavigation, useIsFocused } from '@react-navigation/native';
import { getHistory } from '../services/db';
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
          Analyse séance par séance ({analysis.totalSessionsAnalyzed} séance{analysis.totalSessionsAnalyzed > 1 ? 's' : ''})
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

              {ex.isAlternating && (
                <View style={styles.altBanner}>
                  <Text style={styles.altBannerTxt}>
                    🔄 Alternance 6-8 / 10-12 reps — comparaison effectuée à plage équivalente
                  </Text>
                  <View style={styles.cyclesRow}>
                    <View style={styles.cycleBox}>
                      <Text style={styles.cycleTitle}>Cycle 6-8 reps</Text>
                      {ex.cycle6_8 ? (
                        <>
                          <Text style={styles.cycleStat}>
                            {ex.cycle6_8.count} séance{ex.cycle6_8.count > 1 ? 's' : ''} • Dernier: {ex.cycle6_8.latest.maxWeight} kg
                          </Text>
                          <Text style={styles.cycleDelta}>
                            {ex.cycle6_8.count > 1
                              ? `Poids: ${formatSigned(ex.cycle6_8.deltaFromFirst.weightDiff, ' kg')} • 1RM: ${formatSigned(ex.cycle6_8.deltaFromFirst.oneRMDiff, ' kg')}`
                              : `1RM est.: ${ex.cycle6_8.latest.best1RM} kg`}
                          </Text>
                        </>
                      ) : (
                        <Text style={styles.cycleEmpty}>Aucune séance 6-8</Text>
                      )}
                    </View>

                    <View style={styles.cycleBox}>
                      <Text style={styles.cycleTitle}>Cycle 10-12 reps</Text>
                      {ex.cycle10_12 ? (
                        <>
                          <Text style={styles.cycleStat}>
                            {ex.cycle10_12.count} séance{ex.cycle10_12.count > 1 ? 's' : ''} • Dernier: {ex.cycle10_12.latest.maxWeight} kg
                          </Text>
                          <Text style={styles.cycleDelta}>
                            {ex.cycle10_12.count > 1
                              ? `Poids: ${formatSigned(ex.cycle10_12.deltaFromFirst.weightDiff, ' kg')} • 1RM: ${formatSigned(ex.cycle10_12.deltaFromFirst.oneRMDiff, ' kg')}`
                              : `1RM est.: ${ex.cycle10_12.latest.best1RM} kg`}
                          </Text>
                        </>
                      ) : (
                        <Text style={styles.cycleEmpty}>Aucune séance 10-12</Text>
                      )}
                    </View>
                  </View>
                </View>
              )}

              {!ex.isTime && !ex.isAlternating && (
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
                    <Text style={styles.recordLabel}>Meilleur Vol.</Text>
                    <Text style={styles.recordVal}>{ex.bestVolume} kg</Text>
                  </View>
                </View>
              )}

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
                          {!ex.isTime && ex.isAlternating && (
                            <View
                              style={[
                                styles.bucketBadge,
                                s.repRangeBucket === '6-8' ? styles.bucket68 : styles.bucket1012
                              ]}
                            >
                              <Text style={styles.bucketBadgeTxt}>{s.repRangeBucket} reps</Text>
                            </View>
                          )}
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
                                Max: {s.maxWeight} kg • Vol: {s.totalVolume} kg • 1RM: {s.best1RM} kg
                              </Text>
                              <Text style={[styles.sessionDelta, { color: sMeta.color }]}>
                                {s.status === 'first'
                                  ? '🆕 1ère séance'
                                  : `${sMeta.label} (${formatSigned(s.weightDiff, ' kg')} poids, ${formatSigned(s.volumeDiff, ' kg')} vol, ${formatSigned(s.oneRMDiff, ' kg')} 1RM)`}
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
  subtitle: { fontSize: 13, color: '#666', marginTop: 4 },
  filterScroll: { marginBottom: 10 },
  filterChip: { backgroundColor: '#fff', paddingVertical: 8, paddingHorizontal: 14, borderRadius: 20, borderWidth: 1, borderColor: '#ddd' },
  filterChipActive: { backgroundColor: '#673ab7', borderColor: '#673ab7' },
  filterChipTxt: { fontSize: 13, fontWeight: 'bold', color: '#555' },
  filterChipTxtActive: { color: '#fff' },
  searchInput: { backgroundColor: '#fff', padding: 10, borderRadius: 10, borderWidth: 1, borderColor: '#ddd', fontSize: 15, color: '#111111', marginBottom: 14 },
  emptyCard: { backgroundColor: '#fff', padding: 20, borderRadius: 12, alignItems: 'center', marginTop: 10 },
  emptyTxt: { fontSize: 14, color: '#666', textAlign: 'center', fontStyle: 'italic' },
  exCard: { backgroundColor: '#fff', borderRadius: 14, padding: 14, marginBottom: 14, elevation: 2 },
  exHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 },
  exName: { fontSize: 17, fontWeight: 'bold', color: '#1b2a47' },
  exSub: { fontSize: 12, color: '#777', marginTop: 2 },
  statusBadge: { paddingVertical: 4, paddingHorizontal: 10, borderRadius: 12, borderWidth: 1 },
  statusBadgeTxt: { fontSize: 12, fontWeight: 'bold' },
  altBanner: { backgroundColor: '#f3e5f5', padding: 10, borderRadius: 10, marginBottom: 10, borderWidth: 1, borderColor: '#ce93d8' },
  altBannerTxt: { fontSize: 12, fontWeight: 'bold', color: '#6a1b9a', marginBottom: 8 },
  cyclesRow: { flexDirection: 'row', gap: 8 },
  cycleBox: { flex: 1, backgroundColor: '#fff', padding: 8, borderRadius: 8, borderWidth: 1, borderColor: '#e1bee7' },
  cycleTitle: { fontSize: 12, fontWeight: 'bold', color: '#4a148c', marginBottom: 2 },
  cycleStat: { fontSize: 12, color: '#333', fontWeight: 'bold' },
  cycleDelta: { fontSize: 11, color: '#2e7d32', fontWeight: 'bold', marginTop: 2 },
  cycleEmpty: { fontSize: 11, color: '#888', fontStyle: 'italic' },
  recordsRow: { flexDirection: 'row', gap: 8, marginBottom: 10 },
  recordPill: { flex: 1, backgroundColor: '#f4fbfa', padding: 8, borderRadius: 8, alignItems: 'center', borderWidth: 1, borderColor: '#ccebe8' },
  recordLabel: { fontSize: 11, color: '#666', fontWeight: 'bold' },
  recordVal: { fontSize: 14, color: '#0bc0af', fontWeight: 'bold', marginTop: 2 },
  sessionsList: { borderTopWidth: 1, borderTopColor: '#eee', paddingTop: 8 },
  sessionRow: { backgroundColor: '#fafafa', padding: 10, borderRadius: 10, marginBottom: 8, borderWidth: 1, borderColor: '#eee' },
  sessionTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  sessionDate: { fontSize: 12, fontWeight: 'bold', color: '#1b2a47', flex: 1 },
  bucketBadge: { paddingVertical: 2, paddingHorizontal: 8, borderRadius: 8 },
  bucket68: { backgroundColor: '#ffe0b2' },
  bucket1012: { backgroundColor: '#b2ebf2' },
  bucketBadgeTxt: { fontSize: 11, fontWeight: 'bold', color: '#1b2a47' },
  sessionSets: { fontSize: 13, color: '#333', fontWeight: '600', marginBottom: 4 },
  sessionDetail: { fontSize: 13, color: '#333', fontWeight: 'bold' },
  sessionBottom: { marginTop: 2 },
  sessionMetrics: { fontSize: 12, color: '#666' },
  sessionDelta: { fontSize: 12, fontWeight: 'bold', marginTop: 3 },
  backBtn: { backgroundColor: '#999', padding: 14, borderRadius: 12, alignItems: 'center', marginTop: 10 },
  backBtnTxt: { color: '#fff', fontSize: 15, fontWeight: 'bold' }
});
