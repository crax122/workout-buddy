import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput } from 'react-native';
import { Audio } from 'expo-av';

const extractNumeric = (val, fallback = '8') => {
  if (val === undefined || val === null) return fallback;
  const matches = String(val).match(/\d+(\.\d+)?/g);
  if (matches && matches.length > 0) {
    return matches[matches.length - 1];
  }
  return fallback;
};

const isSetRestPause = (exercise, currentSet) => {
  if (!exercise) return false;
  if (exercise.type === 'rest-pause') return true;
  const setIdx = Math.max(0, (currentSet || 1) - 1);
  if (Array.isArray(exercise.setTypes) && exercise.setTypes.length > setIdx) {
    return exercise.setTypes[setIdx] === 'rest-pause';
  }
  if (exercise.restPauseSets && exercise.restPauseSets > 0 && !exercise.dropSetSets) {
    const normalCount = Math.max(0, (exercise.sets || 0) - exercise.restPauseSets);
    return setIdx >= normalCount;
  }
  if (
    !Array.isArray(exercise.setTypes) &&
    Array.isArray(exercise.previousLoggedSets) &&
    exercise.previousLoggedSets[setIdx]?.isRestPause
  ) {
    return true;
  }
  return false;
};

const isSetDropSet = (exercise, currentSet) => {
  if (!exercise) return false;
  if (exercise.type === 'drop-set') return true;
  const setIdx = Math.max(0, (currentSet || 1) - 1);
  if (Array.isArray(exercise.setTypes) && exercise.setTypes.length > setIdx) {
    return exercise.setTypes[setIdx] === 'drop-set';
  }
  if (exercise.dropSetSets && exercise.dropSetSets > 0) {
    const nonDropCount = Math.max(0, (exercise.sets || 0) - exercise.dropSetSets);
    return setIdx >= nonDropCount;
  }
  if (
    !Array.isArray(exercise.setTypes) &&
    Array.isArray(exercise.previousLoggedSets) &&
    exercise.previousLoggedSets[setIdx]?.isDropSet
  ) {
    return true;
  }
  return false;
};

const computeSuggestedDropWeight = (prevW, dropSpec) => {
  const base = parseFloat(prevW) || 0;
  if (base <= 0) return '0';
  const str = String(dropSpec || '-20%').trim();
  if (str.includes('%')) {
    const pct = Math.abs(parseFloat(str)) || 20;
    const raw = base * (1 - pct / 100);
    return String(Math.max(0, Math.round(raw / 2.5) * 2.5));
  }
  const diff = Math.abs(parseFloat(str)) || 5;
  return String(Math.max(0, base - diff));
};

const buildInitialDrops = (exercise, currentSet, initialWeight, initialReps) => {
  const setIdx = Math.max(0, (currentSet || 1) - 1);

  // 1. Previous Drop Set in current session
  if (exercise.loggedSets && exercise.loggedSets.length > 0) {
    for (let i = exercise.loggedSets.length - 1; i >= 0; i--) {
      const logged = exercise.loggedSets[i];
      if (logged && logged.isDropSet && Array.isArray(logged.drops) && logged.drops.length > 0) {
        return logged.drops.map(d => ({ ...d }));
      }
    }
  }

  // 2. Previous session Drop Set
  if (Array.isArray(exercise.previousLoggedSets) && exercise.previousLoggedSets.length > 0) {
    const exactPrev = exercise.previousLoggedSets[setIdx];
    const fallbackPrev = exercise.previousLoggedSets.find(
      s => s && s.isDropSet && Array.isArray(s.drops) && s.drops.length > 0
    );
    const prevSet =
      exactPrev && Array.isArray(exactPrev.drops) && exactPrev.drops.length > 0
        ? exactPrev
        : fallbackPrev;
    if (prevSet && Array.isArray(prevSet.drops) && prevSet.drops.length > 0) {
      return prevSet.drops.map((d, idx) => {
        const cfg = Array.isArray(exercise.dropSetSegments) ? exercise.dropSetSegments[idx] : null;
        return {
          weight: String(d.weight ?? initialWeight ?? '0'),
          reps: String(d.reps || extractNumeric(cfg?.reps, '8')),
          targetReps: cfg?.reps || d.targetReps || '',
          dropHint: cfg?.drop || d.dropHint || ''
        };
      });
    }
  }

  // 3. Configured dropSetSegments
  if (Array.isArray(exercise.dropSetSegments) && exercise.dropSetSegments.length > 0) {
    let runningWeight = String(initialWeight || '0');
    return exercise.dropSetSegments.map((seg, idx) => {
      const hasExplicitWeight = seg.weight !== undefined && String(seg.weight).trim() !== '';
      if (hasExplicitWeight) {
        runningWeight = String(seg.weight).trim();
      } else if (idx > 0) {
        runningWeight = computeSuggestedDropWeight(runningWeight, seg.drop || '-20%');
      }
      return {
        weight: runningWeight,
        reps: extractNumeric(seg.reps, idx === 0 ? '8' : '10'),
        targetReps: seg.reps || '',
        dropHint: seg.drop || ''
      };
    });
  }

  // 4. Default Drop Set
  const w0 = String(initialWeight || '0');
  const w1 = computeSuggestedDropWeight(w0, '-20%');
  const w2 = computeSuggestedDropWeight(w1, '-20%');
  return [
    { weight: w0, reps: String(extractNumeric(initialReps, '8')), targetReps: '8-10', dropHint: '' },
    { weight: w1, reps: '10', targetReps: '8-10', dropHint: '-20%' },
    { weight: w2, reps: '12', targetReps: '10-12', dropHint: '-20%' }
  ];
};

const buildInitialSegments = (exercise, currentSet, initialReps) => {
  const setIdx = Math.max(0, (currentSet || 1) - 1);

  // 1. If a previous set in the current session was Rest-Pause and had segments, use those
  if (exercise.loggedSets && exercise.loggedSets.length > 0) {
    for (let i = exercise.loggedSets.length - 1; i >= 0; i--) {
      const logged = exercise.loggedSets[i];
      if (logged && logged.isRestPause && Array.isArray(logged.segments) && logged.segments.length > 0) {
        return logged.segments.map(s => ({ ...s }));
      }
    }
  }

  // 2. If previous session had segments for this set index (or any Rest-Pause set in previous session)
  if (Array.isArray(exercise.previousLoggedSets) && exercise.previousLoggedSets.length > 0) {
    const exactPrev = exercise.previousLoggedSets[setIdx];
    const fallbackPrev = exercise.previousLoggedSets.find(
      s => s && s.isRestPause && Array.isArray(s.segments) && s.segments.length > 0
    );
    const prevSet =
      exactPrev && Array.isArray(exactPrev.segments) && exactPrev.segments.length > 0
        ? exactPrev
        : fallbackPrev;
    if (prevSet && Array.isArray(prevSet.segments) && prevSet.segments.length > 0) {
      return prevSet.segments.map((s, idx) => {
        const cfg = Array.isArray(exercise.restPauseSegments) ? exercise.restPauseSegments[idx] : null;
        return {
          reps: String(s.reps || extractNumeric(cfg?.reps, '6')),
          targetReps: cfg?.reps || s.targetReps || '',
          rest: idx < prevSet.segments.length - 1 ? String(s.rest || extractNumeric(cfg?.rest, '15')) : '',
          targetRest: cfg?.rest || s.targetRest || ''
        };
      });
    }
  }

  // 3. If exercise is configured with restPauseSegments
  if (Array.isArray(exercise.restPauseSegments) && exercise.restPauseSegments.length > 0) {
    return exercise.restPauseSegments.map((seg, idx) => ({
      reps: extractNumeric(seg.reps, idx === 0 ? '8' : '4'),
      targetReps: seg.reps || '',
      rest: idx < exercise.restPauseSegments.length - 1 ? extractNumeric(seg.rest, '20') : '',
      targetRest: seg.rest || ''
    }));
  }

  // 4. Default Rest-Pause segments if this set is Rest-Pause
  if (isSetRestPause(exercise, currentSet)) {
    return [
      { reps: '8', targetReps: '6-8', rest: '20', targetRest: '15-20' },
      { reps: '4', targetReps: '3-4', rest: '20', targetRest: '15-20' },
      { reps: '3', targetReps: '2-3', rest: '', targetRest: '' }
    ];
  }

  return [
    { reps: String(extractNumeric(initialReps, '10')), targetReps: '', rest: '', targetRest: '' }
  ];
};

export default function ExerciseItem({
  exercise,
  currentSet,
  totalSets,
  previousData,
  initialWeight = '0',
  initialReps = '10',
  onLogSet,
  onAddSet,
  onAddRestPauseSet,
  onAddDropSet,
  onDraftChange
}) {
  const [weight, setWeight] = useState(String(initialWeight));
  const [reps, setReps] = useState(String(extractNumeric(initialReps, '10')));
  const [segments, setSegments] = useState(() => buildInitialSegments(exercise, currentSet, initialReps));
  const [isRestPause, setIsRestPause] = useState(() => isSetRestPause(exercise, currentSet));
  const [drops, setDrops] = useState(() => buildInitialDrops(exercise, currentSet, initialWeight, initialReps));
  const [isDropSet, setIsDropSet] = useState(() => isSetDropSet(exercise, currentSet));

  // Micro-rest countdown state for Rest-Pause
  const [activeTimerIdx, setActiveTimerIdx] = useState(null);
  const [microSeconds, setMicroSeconds] = useState(0);
  const [sound, setSound] = useState(null);

  useEffect(() => {
    setWeight(String(initialWeight));
    setReps(String(extractNumeric(initialReps, '10')));
    const initSegs = buildInitialSegments(exercise, currentSet, initialReps);
    setSegments(initSegs);
    setIsRestPause(isSetRestPause(exercise, currentSet));
    const initDrops = buildInitialDrops(exercise, currentSet, initialWeight, initialReps);
    setDrops(initDrops);
    setIsDropSet(isSetDropSet(exercise, currentSet));
    setActiveTimerIdx(null);
    setMicroSeconds(0);
  }, [exercise.id, currentSet, initialWeight, initialReps, exercise.sets, exercise.restPauseSets, exercise.dropSetSets]);

  useEffect(() => {
    let interval = null;
    if (activeTimerIdx !== null && microSeconds > 0) {
      interval = setInterval(() => {
        setMicroSeconds(s => Math.max(0, s - 1));
      }, 1000);
    } else if (activeTimerIdx !== null && microSeconds === 0) {
      setActiveTimerIdx(null);
      playBeep();
    }
    return () => clearInterval(interval);
  }, [activeTimerIdx, microSeconds]);

  useEffect(() => {
    return sound ? () => sound.unloadAsync() : undefined;
  }, [sound]);

  async function playBeep() {
    try {
      const { sound: s } = await Audio.Sound.createAsync({
        uri: 'https://cdn.pixabay.com/download/audio/2021/08/04/audio_0625c1539c.mp3?filename=beep-07a-8162.mp3'
      });
      setSound(s);
      await s.playAsync();
    } catch (e) {
      // Ignore audio errors
    }
  }

  useEffect(() => {
    if (onDraftChange) {
      if (isRestPause) {
        const totalRpReps = segments.reduce((acc, s) => acc + (parseInt(s.reps) || 0), 0);
        onDraftChange(exercise.id, {
          weight,
          reps: String(totalRpReps || 10),
          isRestPause: true,
          segments
        });
      } else if (isDropSet) {
        const totalDropReps = drops.reduce((acc, d) => acc + (parseInt(d.reps) || 0), 0);
        onDraftChange(exercise.id, {
          weight: String(drops[0]?.weight || weight || '0'),
          reps: String(totalDropReps || 10),
          isDropSet: true,
          drops
        });
      } else {
        onDraftChange(exercise.id, { weight, reps });
      }
    }
  }, [exercise.id, weight, reps, isRestPause, segments, isDropSet, drops]);

  const adjustValue = (setter, value, amount) => {
    const num = parseFloat(value) || 0;
    setter(Math.max(0, num + amount).toString());
  };

  const updateSegment = (idx, field, val) => {
    setSegments(prev => prev.map((seg, i) => (i === idx ? { ...seg, [field]: val } : seg)));
  };

  const adjustSegmentField = (idx, field, delta) => {
    setSegments(prev =>
      prev.map((seg, i) => {
        if (i !== idx) return seg;
        const curr = parseFloat(seg[field]) || 0;
        const nextVal = String(Math.max(0, curr + delta));
        if (field === 'rest' && activeTimerIdx === idx) {
          setMicroSeconds(s => Math.max(0, s + delta));
        }
        return { ...seg, [field]: nextVal };
      })
    );
  };

  const handleAddRestPauseSegment = () => {
    if (!isRestPause) {
      setIsRestPause(true);
      setIsDropSet(false);
      setSegments([
        { reps: reps || '8', targetReps: '', rest: '20', targetRest: '15-20' },
        { reps: '4', targetReps: '', rest: '', targetRest: '' }
      ]);
      return;
    }
    setSegments(prev => {
      const updated = prev.map((seg, idx) =>
        idx === prev.length - 1 ? { ...seg, rest: seg.rest || '20' } : seg
      );
      return [...updated, { reps: '3', targetReps: '', rest: '', targetRest: '' }];
    });
  };

  const handleRemoveRestPauseSegment = (idx) => {
    if (segments.length <= 1) return;
    const filtered = segments.filter((_, i) => i !== idx);
    filtered[filtered.length - 1] = { ...filtered[filtered.length - 1], rest: '' };
    setSegments(filtered);
    if (filtered.length === 1 && exercise.type !== 'rest-pause') {
      setIsRestPause(false);
      setReps(filtered[0].reps || '10');
    }
  };

  const updateDrop = (idx, field, val) => {
    setDrops(prev => prev.map((d, i) => (i === idx ? { ...d, [field]: val } : d)));
  };

  const adjustDropField = (idx, field, delta) => {
    setDrops(prev =>
      prev.map((d, i) => {
        if (i !== idx) return d;
        const curr = parseFloat(d[field]) || 0;
        return { ...d, [field]: String(Math.max(0, curr + delta)) };
      })
    );
  };

  const handleAddDropPalier = () => {
    if (!isDropSet) {
      setIsDropSet(true);
      setIsRestPause(false);
      const w0 = weight || '0';
      const w1 = computeSuggestedDropWeight(w0, '-20%');
      setDrops([
        { weight: w0, reps: reps || '8', targetReps: '', dropHint: '' },
        { weight: w1, reps: '10', targetReps: '', dropHint: '-20%' }
      ]);
      return;
    }
    setDrops(prev => {
      const lastW = prev.length > 0 ? prev[prev.length - 1].weight : weight;
      const nextW = computeSuggestedDropWeight(lastW, '-20%');
      return [...prev, { weight: nextW, reps: '10', targetReps: '', dropHint: '-20%' }];
    });
  };

  const handleRemoveDropPalier = (idx) => {
    if (drops.length <= 1) return;
    const filtered = drops.filter((_, i) => i !== idx);
    setDrops(filtered);
    if (filtered.length === 1 && exercise.type !== 'drop-set') {
      setIsDropSet(false);
      setWeight(filtered[0].weight || weight);
      setReps(filtered[0].reps || '10');
    }
  };

  const toggleMicroTimer = (idx, restVal) => {
    if (activeTimerIdx === idx) {
      setActiveTimerIdx(null);
      setMicroSeconds(0);
    } else {
      const secs = parseInt(restVal) || 20;
      setMicroSeconds(secs);
      setActiveTimerIdx(idx);
    }
  };

  const handleLog = () => {
    if (isRestPause) {
      const totalRpReps = segments.reduce((acc, s) => acc + (parseInt(s.reps) || 0), 0);
      const summary = segments
        .map((s, i) => (i < segments.length - 1 ? `${s.reps} reps + ${s.rest || 15}s repos` : `${s.reps} reps`))
        .join(' + ');
      onLogSet({
        weight,
        reps: String(totalRpReps),
        isRestPause: true,
        segments,
        summary
      });
    } else if (isDropSet) {
      const totalDropReps = drops.reduce((acc, d) => acc + (parseInt(d.reps) || 0), 0);
      const summary = drops.map(d => `${d.weight} kg x ${d.reps}`).join(' → ');
      onLogSet({
        weight: String(drops[0]?.weight || weight || '0'),
        reps: String(totalDropReps),
        isDropSet: true,
        drops,
        summary
      });
    } else {
      onLogSet({ weight, reps });
    }
  };

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Text style={styles.label}>
          {isRestPause ? 'SÉRIE REST-PAUSE :' : isDropSet ? 'SÉRIE DROP SET :' : 'CURRENT EXERCISE :'}
        </Text>
        <Text style={styles.title}>{exercise.name}</Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: 8, flexWrap: 'wrap', gap: 6 }}>
          <Text style={styles.setInfo}>SET {currentSet} / {totalSets}</Text>
          {onAddSet && (
            <TouchableOpacity style={styles.addSetBtn} onPress={onAddSet}>
              <Text style={styles.addSetBtnTxt}>+ 1 SET</Text>
            </TouchableOpacity>
          )}
          {onAddRestPauseSet && (
            <TouchableOpacity style={styles.addRpSetBtn} onPress={onAddRestPauseSet}>
              <Text style={styles.addSetBtnTxt}>+ 1 REST-PAUSE</Text>
            </TouchableOpacity>
          )}
          {onAddDropSet && (
            <TouchableOpacity style={styles.addDsSetBtn} onPress={onAddDropSet}>
              <Text style={styles.addSetBtnTxt}>+ 1 DROP SET</Text>
            </TouchableOpacity>
          )}
        </View>
        {totalSets > 0 && (
          <View style={styles.sequenceRow}>
            {Array.from({ length: totalSets }).map((_, idx) => {
              const setNum = idx + 1;
              const setIsRp = isSetRestPause(exercise, setNum);
              const setIsDs = isSetDropSet(exercise, setNum);
              const isCurrent = setNum === currentSet;
              const isDone = setNum < currentSet;
              const targetVal = Array.isArray(exercise.targetReps) ? exercise.targetReps[idx] : 10;
              return (
                <View
                  key={idx}
                  style={[
                    styles.seqBadge,
                    isCurrent && (setIsRp ? styles.seqBadgeActiveRp : setIsDs ? styles.seqBadgeActiveDs : styles.seqBadgeActive),
                    isDone && styles.seqBadgeDone
                  ]}
                >
                  <Text
                    style={[
                      styles.seqBadgeTxt,
                      (isCurrent || isDone) && styles.seqBadgeTxtActive
                    ]}
                  >
                    {isDone ? '✓ ' : ''}
                    {setIsRp ? `S${setNum}: Rest-Pause` : setIsDs ? `S${setNum}: Drop Set` : `S${setNum}: ${targetVal || 10} reps`}
                  </Text>
                </View>
              );
            })}
          </View>
        )}
      </View>

      {isRestPause ? (
        <View style={styles.rpContainer}>
          <View style={[styles.inputGroup, { marginBottom: 14 }]}>
            <Text style={styles.inputLabel}>WEIGHT (kg)</Text>
            <View style={styles.stepper}>
              <TouchableOpacity onPress={() => adjustValue(setWeight, weight, -2.5)} style={styles.stepBtn}>
                <Text style={styles.stepTxt}>-</Text>
              </TouchableOpacity>
              <TextInput style={styles.input} value={weight} onChangeText={setWeight} keyboardType="numeric" />
              <TouchableOpacity onPress={() => adjustValue(setWeight, weight, 2.5)} style={styles.stepBtn}>
                <Text style={styles.stepTxt}>+</Text>
              </TouchableOpacity>
            </View>
          </View>

          <Text style={styles.rpSectionTitle}>PALIERS REST-PAUSE (REPS & REPOS) :</Text>
          {segments.map((seg, idx) => (
            <View key={idx} style={styles.rpPalierCard}>
              <View style={styles.rpPalierHeader}>
                <Text style={styles.rpPalierTitle}>
                  Palier {idx + 1} {seg.targetReps ? `(cible: ${seg.targetReps} reps)` : ''}
                </Text>
                {segments.length > 1 && (
                  <TouchableOpacity
                    style={styles.rpRemoveBtn}
                    onPress={() => handleRemoveRestPauseSegment(idx)}
                  >
                    <Text style={styles.rpRemoveTxt}>✕</Text>
                  </TouchableOpacity>
                )}
              </View>

              <View style={styles.rpStepperRow}>
                <Text style={styles.rpFieldLabel}>Reps :</Text>
                <View style={[styles.stepper, { flex: 1 }]}>
                  <TouchableOpacity
                    onPress={() => adjustSegmentField(idx, 'reps', -1)}
                    style={styles.smallStepBtn}
                  >
                    <Text style={styles.smallStepTxt}>-</Text>
                  </TouchableOpacity>
                  <TextInput
                    style={styles.smallInput}
                    value={String(seg.reps)}
                    onChangeText={(v) => updateSegment(idx, 'reps', v)}
                    keyboardType="numeric"
                  />
                  <TouchableOpacity
                    onPress={() => adjustSegmentField(idx, 'reps', 1)}
                    style={styles.smallStepBtn}
                  >
                    <Text style={styles.smallStepTxt}>+</Text>
                  </TouchableOpacity>
                </View>
              </View>

              {idx < segments.length - 1 && (
                <View style={styles.rpMicroRestBox}>
                  <View style={styles.rpStepperRow}>
                    <Text style={styles.rpRestLabel}>
                      ⏱ Repos {seg.targetRest ? `(${seg.targetRest}s)` : '(s)'} :
                    </Text>
                    <View style={[styles.stepper, { flex: 1 }]}>
                      <TouchableOpacity
                        onPress={() => adjustSegmentField(idx, 'rest', -5)}
                        style={styles.smallStepBtn}
                      >
                        <Text style={styles.smallStepTxt}>-5</Text>
                      </TouchableOpacity>
                      <TextInput
                        style={styles.smallInput}
                        value={String(seg.rest || '20')}
                        onChangeText={(v) => updateSegment(idx, 'rest', v)}
                        keyboardType="numeric"
                      />
                      <TouchableOpacity
                        onPress={() => adjustSegmentField(idx, 'rest', 5)}
                        style={styles.smallStepBtn}
                      >
                        <Text style={styles.smallStepTxt}>+5</Text>
                      </TouchableOpacity>
                    </View>
                    <TouchableOpacity
                      style={[
                        styles.microTimerBtn,
                        activeTimerIdx === idx && styles.microTimerBtnActive
                      ]}
                      onPress={() => toggleMicroTimer(idx, seg.rest)}
                    >
                      <Text style={styles.microTimerBtnTxt}>
                        {activeTimerIdx === idx ? `⏸ ${microSeconds}s` : `▶ ${seg.rest || 20}s`}
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}
            </View>
          ))}

          <TouchableOpacity style={styles.addRpBtn} onPress={handleAddRestPauseSegment}>
            <Text style={styles.addRpBtnTxt}>+ AJOUTER REPOS + REPS</Text>
          </TouchableOpacity>
        </View>
      ) : isDropSet ? (
        <View style={styles.rpContainer}>
          <Text style={styles.dsSectionTitle}>PALIERS DROP SET (POIDS & REPS) :</Text>
          {drops.map((d, idx) => (
            <View key={idx} style={styles.dsPalierCard}>
              <View style={styles.rpPalierHeader}>
                <Text style={styles.dsPalierTitle}>
                  {idx === 0 ? 'Départ' : `Drop ${idx}`}
                  {d.dropHint ? ` (${d.dropHint})` : ''}
                  {d.targetReps ? ` • cible: ${d.targetReps} reps` : ''}
                </Text>
                {drops.length > 1 && (
                  <TouchableOpacity
                    style={styles.rpRemoveBtn}
                    onPress={() => handleRemoveDropPalier(idx)}
                  >
                    <Text style={styles.rpRemoveTxt}>✕</Text>
                  </TouchableOpacity>
                )}
              </View>

              <View style={[styles.rpStepperRow, { marginBottom: 8 }]}>
                <Text style={styles.rpFieldLabel}>Poids :</Text>
                <View style={[styles.stepper, { flex: 1 }]}>
                  <TouchableOpacity
                    onPress={() => adjustDropField(idx, 'weight', -2.5)}
                    style={styles.smallStepBtn}
                  >
                    <Text style={styles.smallStepTxt}>-2.5</Text>
                  </TouchableOpacity>
                  <TextInput
                    style={styles.smallInput}
                    value={String(d.weight)}
                    onChangeText={(v) => updateDrop(idx, 'weight', v)}
                    keyboardType="numeric"
                  />
                  <TouchableOpacity
                    onPress={() => adjustDropField(idx, 'weight', 2.5)}
                    style={styles.smallStepBtn}
                  >
                    <Text style={styles.smallStepTxt}>+2.5</Text>
                  </TouchableOpacity>
                </View>
              </View>

              <View style={styles.rpStepperRow}>
                <Text style={styles.rpFieldLabel}>Reps :</Text>
                <View style={[styles.stepper, { flex: 1 }]}>
                  <TouchableOpacity
                    onPress={() => adjustDropField(idx, 'reps', -1)}
                    style={styles.smallStepBtn}
                  >
                    <Text style={styles.smallStepTxt}>-</Text>
                  </TouchableOpacity>
                  <TextInput
                    style={styles.smallInput}
                    value={String(d.reps)}
                    onChangeText={(v) => updateDrop(idx, 'reps', v)}
                    keyboardType="numeric"
                  />
                  <TouchableOpacity
                    onPress={() => adjustDropField(idx, 'reps', 1)}
                    style={styles.smallStepBtn}
                  >
                    <Text style={styles.smallStepTxt}>+</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          ))}

          <TouchableOpacity style={styles.addDsBtn} onPress={handleAddDropPalier}>
            <Text style={styles.addRpBtnTxt}>+ AJOUTER UN DROP</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <>
          <View style={styles.inputsContainer}>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>WEIGHT (kg)</Text>
              <View style={styles.stepper}>
                <TouchableOpacity onPress={() => adjustValue(setWeight, weight, -2.5)} style={styles.stepBtn}>
                  <Text style={styles.stepTxt}>-</Text>
                </TouchableOpacity>
                <TextInput style={styles.input} value={weight} onChangeText={setWeight} keyboardType="numeric" />
                <TouchableOpacity onPress={() => adjustValue(setWeight, weight, 2.5)} style={styles.stepBtn}>
                  <Text style={styles.stepTxt}>+</Text>
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>REPS</Text>
              <View style={styles.stepper}>
                <TouchableOpacity onPress={() => adjustValue(setReps, reps, -1)} style={styles.stepBtn}>
                  <Text style={styles.stepTxt}>-</Text>
                </TouchableOpacity>
                <TextInput style={styles.input} value={reps} onChangeText={setReps} keyboardType="numeric" />
                <TouchableOpacity onPress={() => adjustValue(setReps, reps, 1)} style={styles.stepBtn}>
                  <Text style={styles.stepTxt}>+</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>

          <View style={{ flexDirection: 'row', gap: 8, marginBottom: 12 }}>
            <TouchableOpacity style={[styles.addRpBtn, { flex: 1, marginBottom: 0 }]} onPress={handleAddRestPauseSegment}>
              <Text style={[styles.addRpBtnTxt, { textAlign: 'center', fontSize: 12 }]}>+ REST-PAUSE</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.addDsBtn, { flex: 1, marginBottom: 0 }]} onPress={handleAddDropPalier}>
              <Text style={[styles.addRpBtnTxt, { textAlign: 'center', fontSize: 12 }]}>+ DROP SET</Text>
            </TouchableOpacity>
          </View>
        </>
      )}

      <Text style={styles.previousData}>PREVIOUS DATA: {previousData}</Text>

      <TouchableOpacity style={styles.logBtn} onPress={handleLog}>
        <Text style={styles.logBtnTxt}>LOG SET</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#e6f7f6',
    padding: 16,
    borderRadius: 16,
    marginVertical: 10,
  },
  header: {
    alignItems: 'center',
    marginBottom: 14,
  },
  label: { fontSize: 13, color: '#666', fontWeight: 'bold', marginBottom: 4 },
  title: { fontSize: 22, fontWeight: 'bold', color: '#333', textAlign: 'center' },
  setInfo: { fontSize: 16, color: '#666', fontWeight: 'bold', marginRight: 6 },
  addSetBtn: { backgroundColor: '#0bc0af', paddingVertical: 6, paddingHorizontal: 10, borderRadius: 10 },
  addRpSetBtn: { backgroundColor: '#ff9800', paddingVertical: 6, paddingHorizontal: 10, borderRadius: 10 },
  addDsSetBtn: { backgroundColor: '#7b1fa2', paddingVertical: 6, paddingHorizontal: 10, borderRadius: 10 },
  addSetBtnTxt: { color: '#fff', fontSize: 13, fontWeight: 'bold' },
  sequenceRow: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 6, marginTop: 10 },
  seqBadge: { backgroundColor: '#fff', paddingVertical: 4, paddingHorizontal: 8, borderRadius: 8, borderWidth: 1, borderColor: '#ccebe8' },
  seqBadgeActive: { backgroundColor: '#0bc0af', borderColor: '#0bc0af' },
  seqBadgeActiveRp: { backgroundColor: '#ff9800', borderColor: '#ff9800' },
  seqBadgeActiveDs: { backgroundColor: '#7b1fa2', borderColor: '#7b1fa2' },
  seqBadgeDone: { backgroundColor: '#4caf50', borderColor: '#4caf50' },
  seqBadgeTxt: { fontSize: 12, fontWeight: 'bold', color: '#555' },
  seqBadgeTxtActive: { color: '#fff' },
  inputsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  inputGroup: { flex: 1, marginHorizontal: 4 },
  inputLabel: { fontSize: 13, fontWeight: 'bold', color: '#666', marginBottom: 6, textAlign: 'center' },
  stepper: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 12, padding: 4 },
  stepBtn: { width: 40, height: 40, backgroundColor: '#eee', borderRadius: 20, justifyContent: 'center', alignItems: 'center' },
  stepTxt: { fontSize: 22, fontWeight: 'bold', color: '#333' },
  input: { flex: 1, minWidth: 40, textAlign: 'center', fontSize: 20, fontWeight: 'bold', color: '#111111', paddingVertical: 4 },
  rpContainer: { marginBottom: 12 },
  rpSectionTitle: { fontSize: 13, fontWeight: 'bold', color: '#1b2a47', marginBottom: 8 },
  rpPalierCard: { backgroundColor: '#fff', borderRadius: 12, padding: 10, marginBottom: 8, borderWidth: 1, borderColor: '#ccebe8' },
  rpPalierHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  rpPalierTitle: { fontSize: 14, fontWeight: 'bold', color: '#1b2a47' },
  rpRemoveBtn: { backgroundColor: '#ffe6e6', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  rpRemoveTxt: { color: '#ff4d4d', fontWeight: 'bold', fontSize: 12 },
  rpStepperRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  rpFieldLabel: { fontSize: 14, fontWeight: 'bold', color: '#333', minWidth: 50 },
  rpRestLabel: { fontSize: 13, fontWeight: 'bold', color: '#ff9800', minWidth: 90 },
  smallStepBtn: { width: 34, height: 34, backgroundColor: '#eee', borderRadius: 17, justifyContent: 'center', alignItems: 'center' },
  smallStepTxt: { fontSize: 15, fontWeight: 'bold', color: '#333' },
  smallInput: { flex: 1, minWidth: 36, textAlign: 'center', fontSize: 16, fontWeight: 'bold', color: '#111111', paddingVertical: 2 },
  rpMicroRestBox: { marginTop: 8, paddingTop: 8, borderTopWidth: 1, borderTopColor: '#f0f0f0' },
  microTimerBtn: { backgroundColor: '#ff9800', paddingVertical: 8, paddingHorizontal: 10, borderRadius: 8 },
  microTimerBtnActive: { backgroundColor: '#e91e63' },
  microTimerBtnTxt: { color: '#fff', fontWeight: 'bold', fontSize: 13 },
  addRpBtn: { backgroundColor: '#1b2a47', paddingVertical: 10, paddingHorizontal: 12, borderRadius: 10, alignItems: 'center', marginBottom: 12 },
  addDsBtn: { backgroundColor: '#7b1fa2', paddingVertical: 10, paddingHorizontal: 12, borderRadius: 10, alignItems: 'center', marginBottom: 12 },
  addRpBtnTxt: { color: '#fff', fontSize: 13, fontWeight: 'bold' },
  dsSectionTitle: { fontSize: 13, fontWeight: 'bold', color: '#7b1fa2', marginBottom: 8 },
  dsPalierCard: { backgroundColor: '#fff', borderRadius: 12, padding: 10, marginBottom: 8, borderWidth: 1, borderColor: '#ce93d8' },
  dsPalierTitle: { fontSize: 14, fontWeight: 'bold', color: '#7b1fa2' },
  previousData: { textAlign: 'center', fontSize: 14, color: '#666', marginBottom: 14, fontStyle: 'italic' },
  logBtn: { backgroundColor: '#4caf50', padding: 16, borderRadius: 14, alignItems: 'center' },
  logBtnTxt: { color: '#fff', fontSize: 18, fontWeight: 'bold' }
});
