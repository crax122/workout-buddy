import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, ScrollView, Alert } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { saveTemplate, getHistory, enrichExercisesWithHistory, saveExerciseNote } from '../services/db';

const DEFAULT_RP_SEGMENTS = [
  { reps: '6-8', rest: '15-20' },
  { reps: '3-4', rest: '15-20' },
  { reps: '2-3', rest: '' }
];

const DEFAULT_DROP_SEGMENTS = [
  { weight: '', reps: '8-10', drop: '' },
  { weight: '', reps: '8-10', drop: '-20%' },
  { weight: '', reps: '10-12', drop: '-20%' }
];

export const formatRestPauseSegments = (segments) => {
  if (!Array.isArray(segments) || segments.length === 0) return '';
  return segments
    .map((seg, i) =>
      i < segments.length - 1
        ? `${seg.reps} reps + ${seg.rest || '15-20'} s repos`
        : `${seg.reps} reps`
    )
    .join(' + ');
};

export const formatDropSetSegments = (segments) => {
  if (!Array.isArray(segments) || segments.length === 0) return '';
  return segments
    .map((seg, i) => {
      const hasW = seg.weight !== undefined && String(seg.weight).trim() !== '';
      if (hasW) {
        return `${String(seg.weight).trim()} kg x ${seg.reps} reps`;
      }
      return i === 0
        ? `${seg.reps} reps`
        : `(${seg.drop || '-20%'}) ${seg.reps} reps`;
    })
    .join(' → ');
};

export default function CreateWorkoutScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  
  const [workoutId, setWorkoutId] = useState(null);
  const [workoutName, setWorkoutName] = useState('My Workout');
  const [exercises, setExercises] = useState([]);
  
  const [newExerciseName, setNewExerciseName] = useState('');
  const [newExType, setNewExType] = useState('reps');
  const [newTimeInput, setNewTimeInput] = useState('5');
  const [newSetsInput, setNewSetsInput] = useState('3x10');
  const [hasAddedRp, setHasAddedRp] = useState(false);
  const [newAddedRpSetsInput, setNewAddedRpSetsInput] = useState('1');
  const [hasAddedDs, setHasAddedDs] = useState(false);
  const [newAddedDsSetsInput, setNewAddedDsSetsInput] = useState('1');
  const [newPreSetsInput, setNewPreSetsInput] = useState('');
  const [newRpSetsInput, setNewRpSetsInput] = useState('2');
  const [rpSegments, setRpSegments] = useState(DEFAULT_RP_SEGMENTS);
  const [newDsSetsInput, setNewDsSetsInput] = useState('2');
  const [dropSegments, setDropSegments] = useState(DEFAULT_DROP_SEGMENTS);
  const [newRestInput, setNewRestInput] = useState('60');
  const [newNoteInput, setNewNoteInput] = useState('');
  const [editIndex, setEditIndex] = useState(null);

  useEffect(() => {
    if (route.params?.editWorkout) {
      const w = route.params.editWorkout;
      setWorkoutId(w.id);
      setWorkoutName(w.name);
      const initialExs = enrichExercisesWithHistory(w.exercises || [], [], w.name);
      setExercises(initialExs);
      getHistory().then(history => {
        if (history && history.length > 0) {
          setExercises(prev => enrichExercisesWithHistory(prev, history, w.name));
        }
      });
    }
  }, [route.params?.editWorkout]);

  const parseSetsWithRestPause = (input) => {
    if (!input || typeof input !== 'string') return { normalReps: [], inlineRpCount: 0, inlineDsCount: 0 };
    const parts = input.split(/[,+]/).map(s => s.trim()).filter(Boolean);
    const normalReps = [];
    let inlineRpCount = 0;
    let inlineDsCount = 0;

    for (let part of parts) {
      const lower = part.toLowerCase();
      if (lower.includes('rest-pause') || lower.includes('rest pause') || /\brp\b/.test(lower)) {
        const match = lower.match(/(\d+)/);
        const count = match ? parseInt(match[1], 10) : 1;
        if (!isNaN(count) && count > 0) {
          inlineRpCount += count;
        }
      } else if (lower.includes('drop-set') || lower.includes('drop set') || lower.includes('dropset') || /\bds\b/.test(lower)) {
        const match = lower.match(/(\d+)/);
        const count = match ? parseInt(match[1], 10) : 1;
        if (!isNaN(count) && count > 0) {
          inlineDsCount += count;
        }
      } else if (lower.includes('x')) {
        const [countStr, repsStr] = lower.split('x');
        const count = parseInt(countStr, 10);
        const repsMatch = (repsStr || '').match(/(\d+)/);
        const reps = repsMatch ? parseInt(repsMatch[1], 10) : NaN;
        if (!isNaN(count) && !isNaN(reps) && count > 0 && reps > 0) {
          for (let i = 0; i < count; i++) normalReps.push(reps);
        }
      } else {
        const repsMatch = lower.match(/(\d+)/);
        const reps = repsMatch ? parseInt(repsMatch[1], 10) : NaN;
        if (!isNaN(reps) && reps > 0) {
          normalReps.push(reps);
        }
      }
    }
    return { normalReps, inlineRpCount, inlineDsCount };
  };

  const parseSets = (input) => parseSetsWithRestPause(input).normalReps;

  const formatMixedSetsSummary = (normalReps, rpCount, segments, dsCount = 0, dsSegments = []) => {
    const parts = [];
    if (Array.isArray(normalReps) && normalReps.length > 0) {
      parts.push(normalReps.map(r => `${r} reps`).join(' + '));
    }
    if (rpCount > 0) {
      const rpChain = formatRestPauseSegments(segments);
      parts.push(`${rpCount} rest-pause (${rpChain})`);
    }
    if (dsCount > 0) {
      const dsChain = formatDropSetSegments(dsSegments);
      parts.push(`${dsCount} drop set (${dsChain})`);
    }
    if (parts.length === 1 && rpCount > 0 && (!normalReps || normalReps.length === 0) && dsCount === 0) {
      return `${rpCount} séries de rest-pause : ${formatRestPauseSegments(segments)}`;
    }
    if (parts.length === 1 && dsCount > 0 && (!normalReps || normalReps.length === 0) && rpCount === 0) {
      return `${dsCount} séries de drop set : ${formatDropSetSegments(dsSegments)}`;
    }
    return parts.join(' + ');
  };

  const handleAddRpSegment = () => {
    const updated = rpSegments.map((seg, idx) =>
      idx === rpSegments.length - 1 ? { ...seg, rest: seg.rest || '15-20' } : seg
    );
    setRpSegments([...updated, { reps: '2-3', rest: '' }]);
  };

  const handleRemoveRpSegment = (index) => {
    if (rpSegments.length <= 1) return;
    const filtered = rpSegments.filter((_, idx) => idx !== index);
    filtered[filtered.length - 1] = { ...filtered[filtered.length - 1], rest: '' };
    setRpSegments(filtered);
  };

  const handleUpdateRpSegment = (index, field, value) => {
    const updated = rpSegments.map((seg, idx) =>
      idx === index ? { ...seg, [field]: value } : seg
    );
    setRpSegments(updated);
  };

  const handleAddDropSegment = () => {
    setDropSegments([...dropSegments, { weight: '', reps: '10-12', drop: '-20%' }]);
  };

  const handleRemoveDropSegment = (index) => {
    if (dropSegments.length <= 1) return;
    const filtered = dropSegments.filter((_, idx) => idx !== index);
    if (filtered.length > 0) {
      filtered[0] = { ...filtered[0], drop: '' };
    }
    setDropSegments(filtered);
  };

  const handleUpdateDropSegment = (index, field, value) => {
    const updated = dropSegments.map((seg, idx) =>
      idx === index ? { ...seg, [field]: value } : seg
    );
    setDropSegments(updated);
  };

  const handleAddExercise = () => {
    if (!newExerciseName.trim()) {
      Alert.alert('Error', 'Please enter an exercise name');
      return;
    }
    
    let newEx;
    const prevEx = editIndex !== null ? exercises[editIndex] : null;
    const enrichedDraft = enrichExercisesWithHistory(
      [{ id: prevEx ? prevEx.id : undefined, name: newExerciseName.trim(), type: newExType }],
      [],
      workoutName
    )[0];
    const resolvedNote = newNoteInput.trim() !== ''
      ? newNoteInput
      : (prevEx?.notes || enrichedDraft?.notes || '');
    const now = Date.now();
    
    if (newExType === 'time') {
      const durationMins = parseFloat(newTimeInput);
      if (isNaN(durationMins) || durationMins <= 0) {
        Alert.alert('Error', 'Please enter a valid duration');
        return;
      }
      newEx = {
        id: prevEx ? prevEx.id : now.toString(),
        name: newExerciseName.trim(),
        type: 'time',
        durationSeconds: Math.floor(durationMins * 60),
        restTime: parseInt(newRestInput) || 60,
        notes: resolvedNote,
        ...(newNoteInput.trim() !== '' ? { noteUpdatedAt: now } : (prevEx?.noteUpdatedAt ? { noteUpdatedAt: prevEx.noteUpdatedAt } : {})),
        completed: false
      };
    } else if (newExType === 'rest-pause') {
      const rpSetsCount = parseInt(newRpSetsInput) || 2;
      const { normalReps: preNormalReps } = parseSetsWithRestPause(newPreSetsInput);
      const cleanedSegments = rpSegments.map((seg, idx) => ({
        reps: (seg.reps || '').trim() || '6-8',
        rest: idx < rpSegments.length - 1 ? ((seg.rest || '').trim() || '15-20') : ''
      }));
      const totalSetsCount = preNormalReps.length + rpSetsCount;
      const setTypes = [
        ...preNormalReps.map(() => 'reps'),
        ...Array(rpSetsCount).fill('rest-pause')
      ];
      newEx = {
        id: prevEx ? prevEx.id : now.toString(),
        name: newExerciseName.trim(),
        type: preNormalReps.length > 0 ? 'reps' : 'rest-pause',
        sets: totalSetsCount,
        ...(preNormalReps.length > 0 ? { normalTargetReps: preNormalReps } : {}),
        restPauseSets: rpSetsCount,
        setTypes,
        restPauseSegments: cleanedSegments,
        targetReps: [
          ...preNormalReps,
          ...Array(rpSetsCount).fill(cleanedSegments[0]?.reps || '8')
        ],
        restTime: parseInt(newRestInput) || 60,
        completedSets: 0,
        prev: prevEx ? prevEx.prev : (enrichedDraft?.prev || 'No previous data'),
        ...(prevEx?.lastWeight !== undefined ? { lastWeight: prevEx.lastWeight } : (enrichedDraft?.lastWeight !== undefined ? { lastWeight: enrichedDraft.lastWeight } : {})),
        ...(prevEx?.previousLoggedSets !== undefined ? { previousLoggedSets: prevEx.previousLoggedSets } : (enrichedDraft?.previousLoggedSets !== undefined ? { previousLoggedSets: enrichedDraft.previousLoggedSets } : {})),
        notes: resolvedNote,
        ...(newNoteInput.trim() !== '' ? { noteUpdatedAt: now } : (prevEx?.noteUpdatedAt ? { noteUpdatedAt: prevEx.noteUpdatedAt } : {})),
        completed: false
      };
    } else if (newExType === 'drop-set') {
      const dsSetsCount = parseInt(newDsSetsInput, 10) || 2;
      const cleanedDropSegments = dropSegments.map((seg, idx) => ({
        weight: (seg.weight || '').trim(),
        reps: (seg.reps || '').trim() || '8-10',
        drop: idx === 0 ? '' : ((seg.drop || '').trim() || '-20%')
      }));
      newEx = {
        id: prevEx ? prevEx.id : now.toString(),
        name: newExerciseName.trim(),
        type: 'drop-set',
        sets: dsSetsCount,
        dropSetSets: dsSetsCount,
        setTypes: Array(dsSetsCount).fill('drop-set'),
        dropSetSegments: cleanedDropSegments,
        targetReps: Array(dsSetsCount).fill(cleanedDropSegments[0]?.reps || '8-10'),
        restTime: parseInt(newRestInput) || 60,
        completedSets: 0,
        prev: prevEx ? prevEx.prev : (enrichedDraft?.prev || 'No previous data'),
        ...(prevEx?.lastWeight !== undefined ? { lastWeight: prevEx.lastWeight } : (enrichedDraft?.lastWeight !== undefined ? { lastWeight: enrichedDraft.lastWeight } : {})),
        ...(prevEx?.previousLoggedSets !== undefined ? { previousLoggedSets: prevEx.previousLoggedSets } : (enrichedDraft?.previousLoggedSets !== undefined ? { previousLoggedSets: enrichedDraft.previousLoggedSets } : {})),
        notes: resolvedNote,
        ...(newNoteInput.trim() !== '' ? { noteUpdatedAt: now } : (prevEx?.noteUpdatedAt ? { noteUpdatedAt: prevEx.noteUpdatedAt } : {})),
        completed: false
      };
    } else {
      const { normalReps: parsedTargetSets, inlineRpCount, inlineDsCount } = parseSetsWithRestPause(newSetsInput);
      const addedRpCount = hasAddedRp
        ? (parseInt(newAddedRpSetsInput, 10) || inlineRpCount || 1)
        : inlineRpCount;
      const addedDsCount = hasAddedDs
        ? (parseInt(newAddedDsSetsInput, 10) || inlineDsCount || 1)
        : inlineDsCount;

      if (parsedTargetSets.length === 0 && addedRpCount === 0 && addedDsCount === 0) {
        Alert.alert('Error', 'Please enter a valid sets format (e.g., "3x10" or "10 + 10 + 1 drop-set")');
        return;
      }

      const cleanedSegments = rpSegments.map((seg, idx) => ({
        reps: (seg.reps || '').trim() || '6-8',
        rest: idx < rpSegments.length - 1 ? ((seg.rest || '').trim() || '15-20') : ''
      }));
      const cleanedDropSegments = dropSegments.map((seg, idx) => ({
        weight: (seg.weight || '').trim(),
        reps: (seg.reps || '').trim() || '8-10',
        drop: idx === 0 ? '' : ((seg.drop || '').trim() || '-20%')
      }));

      const totalSetsCount = parsedTargetSets.length + addedRpCount + addedDsCount;
      const combinedTargetReps = [
        ...parsedTargetSets,
        ...Array(addedRpCount).fill(cleanedSegments[0]?.reps || '8'),
        ...Array(addedDsCount).fill(cleanedDropSegments[0]?.reps || '8-10')
      ];
      const setTypes = [
        ...parsedTargetSets.map(() => 'reps'),
        ...Array(addedRpCount).fill('rest-pause'),
        ...Array(addedDsCount).fill('drop-set')
      ];

      let resolvedType = 'reps';
      if (parsedTargetSets.length === 0 && addedRpCount > 0 && addedDsCount === 0) {
        resolvedType = 'rest-pause';
      } else if (parsedTargetSets.length === 0 && addedDsCount > 0 && addedRpCount === 0) {
        resolvedType = 'drop-set';
      }

      newEx = {
        id: prevEx ? prevEx.id : now.toString(),
        name: newExerciseName.trim(),
        type: resolvedType,
        sets: totalSetsCount,
        normalTargetReps: parsedTargetSets,
        targetReps: combinedTargetReps,
        setTypes,
        ...(addedRpCount > 0 ? {
          restPauseSets: addedRpCount,
          restPauseSegments: cleanedSegments
        } : {}),
        ...(addedDsCount > 0 ? {
          dropSetSets: addedDsCount,
          dropSetSegments: cleanedDropSegments
        } : {}),
        restTime: parseInt(newRestInput) || 60,
        completedSets: 0,
        prev: prevEx ? prevEx.prev : (enrichedDraft?.prev || 'No previous data'),
        ...(prevEx?.lastWeight !== undefined ? { lastWeight: prevEx.lastWeight } : (enrichedDraft?.lastWeight !== undefined ? { lastWeight: enrichedDraft.lastWeight } : {})),
        ...(prevEx?.previousLoggedSets !== undefined ? { previousLoggedSets: prevEx.previousLoggedSets } : (enrichedDraft?.previousLoggedSets !== undefined ? { previousLoggedSets: enrichedDraft.previousLoggedSets } : {})),
        notes: resolvedNote,
        ...(newNoteInput.trim() !== '' ? { noteUpdatedAt: now } : (prevEx?.noteUpdatedAt ? { noteUpdatedAt: prevEx.noteUpdatedAt } : {})),
        completed: false
      };
    }

    if (newNoteInput.trim() !== '') {
      saveExerciseNote(newEx, newNoteInput);
    }

    if (editIndex !== null) {
      const updated = [...exercises];
      updated[editIndex] = newEx;
      setExercises(updated);
      setEditIndex(null);
    } else {
      setExercises([...exercises, newEx]);
    }
    setNewExerciseName('');
    setNewSetsInput('3x10');
    setHasAddedRp(false);
    setNewAddedRpSetsInput('1');
    setHasAddedDs(false);
    setNewAddedDsSetsInput('1');
    setNewPreSetsInput('');
    setNewRpSetsInput('2');
    setRpSegments(DEFAULT_RP_SEGMENTS);
    setNewDsSetsInput('2');
    setDropSegments(DEFAULT_DROP_SEGMENTS);
    setNewTimeInput('5');
    setNewExType('reps');
    setNewRestInput('60');
    setNewNoteInput('');
  };

  const handleEditExercise = (index) => {
    const ex = exercises[index];
    setNewExerciseName(ex.name);
    setNewRestInput(String(ex.restTime || 60));
    setNewExType(ex.type || 'reps');
    setNewNoteInput(ex.notes || '');
    
    if (ex.type === 'time') {
      setNewTimeInput(String((ex.durationSeconds || 300) / 60));
      setHasAddedRp(false);
      setHasAddedDs(false);
    } else if (ex.type === 'rest-pause') {
      setNewRpSetsInput(String(ex.sets || 2));
      setHasAddedRp(false);
      setHasAddedDs(false);
      setRpSegments(
        ex.restPauseSegments && ex.restPauseSegments.length > 0
          ? ex.restPauseSegments
          : DEFAULT_RP_SEGMENTS
      );
    } else if (ex.type === 'drop-set') {
      setNewDsSetsInput(String(ex.sets || 2));
      setHasAddedRp(false);
      setHasAddedDs(false);
      setDropSegments(
        ex.dropSetSegments && ex.dropSetSegments.length > 0
          ? ex.dropSetSegments
          : DEFAULT_DROP_SEGMENTS
      );
    } else {
      const rpCount = ex.restPauseSets || (Array.isArray(ex.setTypes) ? ex.setTypes.filter(t => t === 'rest-pause').length : 0);
      const dsCount = ex.dropSetSets || (Array.isArray(ex.setTypes) ? ex.setTypes.filter(t => t === 'drop-set').length : 0);
      const normalList = Array.isArray(ex.normalTargetReps)
        ? ex.normalTargetReps
        : Array.isArray(ex.targetReps)
          ? ex.targetReps.slice(0, Math.max(0, ex.targetReps.length - rpCount - dsCount))
          : [];
      if (normalList.length > 0) {
        const allSame = normalList.every(r => r === normalList[0]);
        if (allSame && rpCount === 0 && dsCount === 0) {
          setNewSetsInput(`${normalList.length}x${normalList[0]}`);
        } else {
          setNewSetsInput(normalList.join(', '));
        }
      }
      if (rpCount > 0) {
        setHasAddedRp(true);
        setNewAddedRpSetsInput(String(rpCount));
        setRpSegments(
          ex.restPauseSegments && ex.restPauseSegments.length > 0
            ? ex.restPauseSegments
            : DEFAULT_RP_SEGMENTS
        );
      } else {
        setHasAddedRp(false);
        setNewAddedRpSetsInput('1');
      }
      if (dsCount > 0) {
        setHasAddedDs(true);
        setNewAddedDsSetsInput(String(dsCount));
        setDropSegments(
          ex.dropSetSegments && ex.dropSetSegments.length > 0
            ? ex.dropSetSegments
            : DEFAULT_DROP_SEGMENTS
        );
      } else {
        setHasAddedDs(false);
        setNewAddedDsSetsInput('1');
      }
    }
    setEditIndex(index);
  };

  const handleRemoveExercise = (id) => {
    setExercises(exercises.filter(ex => ex.id !== id));
  };

  const handleInlineNoteChange = (index, text) => {
    const now = Date.now();
    const updated = exercises.map((ex, idx) => {
      if (idx !== index) return ex;
      const updatedEx = { ...ex, notes: text, noteUpdatedAt: now };
      saveExerciseNote(updatedEx, text);
      return updatedEx;
    });
    setExercises(updated);
  };

  const handleSave = async () => {
    if (exercises.length === 0) {
      Alert.alert('Error', 'Please add at least one exercise.');
      return false;
    }

    try {
      const newTemplate = {
        id: workoutId ? workoutId : Date.now().toString(),
        name: workoutName,
        exercises: exercises
      };
      
      const success = await saveTemplate(newTemplate, workoutId);
      
      if (success) {
        if (!workoutId) {
          setWorkoutId(newTemplate.id);
        }
        Alert.alert('Success', 'Workout template saved!');
        return true;
      } else {
        Alert.alert('Error', 'Failed to save workout to cloud.');
        return false;
      }
    } catch(e) {
      console.error("Failed to save template", e);
      Alert.alert('Error', 'Failed to save workout');
      return false;
    }
  };

  const handleStart = async () => {
    const saved = await handleSave();
    if (saved) {
      navigation.navigate('ActiveWorkout', { workoutName, exercises });
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Create Workout</Text>
      </View>

      <Text style={styles.label}>Workout Name</Text>
      <TextInput 
        style={styles.input} 
        value={workoutName} 
        onChangeText={setWorkoutName} 
        placeholder="e.g. Leg Day"
      />

      <View style={styles.addSection}>
        <Text style={styles.sectionTitle}>Add Exercise</Text>
        <TextInput 
          style={styles.input} 
          value={newExerciseName} 
          onChangeText={setNewExerciseName} 
          placeholder="Exercise Name (e.g. Curl marteau)"
        />

        <View style={styles.typeToggle}>
          <TouchableOpacity 
            style={[styles.typeBtn, newExType === 'reps' && styles.typeBtnActive]} 
            onPress={() => setNewExType('reps')}
          >
            <Text style={[styles.typeBtnTxt, newExType === 'reps' && styles.typeBtnTxtActive]}>Sets & Reps</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.typeBtn, newExType === 'rest-pause' && styles.typeBtnActive]} 
            onPress={() => setNewExType('rest-pause')}
          >
            <Text style={[styles.typeBtnTxt, newExType === 'rest-pause' && styles.typeBtnTxtActive]}>Rest-Pause</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.typeBtn, newExType === 'drop-set' && styles.typeBtnActive]} 
            onPress={() => setNewExType('drop-set')}
          >
            <Text style={[styles.typeBtnTxt, newExType === 'drop-set' && styles.typeBtnTxtActive]}>Drop Set</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.typeBtn, newExType === 'time' && styles.typeBtnActive]} 
            onPress={() => setNewExType('time')}
          >
            <Text style={[styles.typeBtnTxt, newExType === 'time' && styles.typeBtnTxtActive]}>Timed</Text>
          </TouchableOpacity>
        </View>

        {newExType === 'reps' ? (
          <>
            <Text style={styles.label}>Sets & Reps (e.g. 2x10, 1x5 ou 10 + 10 + 1 drop-set)</Text>
            <TextInput 
              style={styles.input} 
              value={newSetsInput} 
              onChangeText={setNewSetsInput} 
              placeholder="e.g. 10,10,5 or 3x10"
            />
            <View style={{ flexDirection: 'row', gap: 8, marginBottom: 10 }}>
              {!(hasAddedRp || parseSetsWithRestPause(newSetsInput).inlineRpCount > 0) && (
                <TouchableOpacity
                  style={[styles.addRpToSetsBtn, { flex: 1, marginBottom: 0 }]}
                  onPress={() => {
                    setHasAddedRp(true);
                    setNewAddedRpSetsInput('1');
                  }}
                >
                  <Text style={styles.addRpToSetsTxt}>+ SÉRIE REST-PAUSE</Text>
                </TouchableOpacity>
              )}
              {!(hasAddedDs || parseSetsWithRestPause(newSetsInput).inlineDsCount > 0) && (
                <TouchableOpacity
                  style={[styles.addDsToSetsBtn, { flex: 1, marginBottom: 0 }]}
                  onPress={() => {
                    setHasAddedDs(true);
                    setNewAddedDsSetsInput('1');
                  }}
                >
                  <Text style={styles.addRpToSetsTxt}>+ SÉRIE DROP SET</Text>
                </TouchableOpacity>
              )}
            </View>

            {(hasAddedRp || parseSetsWithRestPause(newSetsInput).inlineRpCount > 0) && (
              <View style={styles.rpBuilderBox}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                  <Text style={[styles.label, { marginBottom: 0 }]}>🔥 Série(s) Rest-Pause ajoutée(s)</Text>
                  <TouchableOpacity
                    style={styles.rpDeleteSegBtn}
                    onPress={() => {
                      setHasAddedRp(false);
                      setNewAddedRpSetsInput('0');
                      const { normalReps } = parseSetsWithRestPause(newSetsInput);
                      if (normalReps.length > 0) {
                        setNewSetsInput(normalReps.join(', '));
                      }
                    }}
                  >
                    <Text style={styles.rpDeleteSegTxt}>✕ Retirer</Text>
                  </TouchableOpacity>
                </View>

                {hasAddedRp && (
                  <>
                    <Text style={styles.label}>Nombre de séries de Rest-Pause à ajouter</Text>
                    <TextInput
                      style={styles.input}
                      value={newAddedRpSetsInput}
                      onChangeText={setNewAddedRpSetsInput}
                      placeholder="e.g. 1"
                      keyboardType="numeric"
                    />
                  </>
                )}

                <Text style={styles.label}>Séquence Rest-Pause (Répétitions & Repos entre elles)</Text>
                {rpSegments.map((seg, idx) => (
                  <View key={idx} style={styles.rpSegmentCard}>
                    <View style={styles.rpSegmentRow}>
                      <Text style={styles.rpSegmentLabel}>Palier {idx + 1} (reps) :</Text>
                      <TextInput
                        style={styles.rpSmallInput}
                        value={seg.reps}
                        onChangeText={(val) => handleUpdateRpSegment(idx, 'reps', val)}
                        placeholder="ex: 6-8"
                      />
                      {rpSegments.length > 1 && (
                        <TouchableOpacity
                          style={styles.rpDeleteSegBtn}
                          onPress={() => handleRemoveRpSegment(idx)}
                        >
                          <Text style={styles.rpDeleteSegTxt}>✕</Text>
                        </TouchableOpacity>
                      )}
                    </View>

                    {idx < rpSegments.length - 1 && (
                      <View style={[styles.rpSegmentRow, { marginTop: 8 }]}>
                        <Text style={styles.rpRestLabel}>+ Repos avant palier {idx + 2} (s) :</Text>
                        <TextInput
                          style={styles.rpSmallInput}
                          value={seg.rest}
                          onChangeText={(val) => handleUpdateRpSegment(idx, 'rest', val)}
                          placeholder="ex: 15-20"
                        />
                      </View>
                    )}
                  </View>
                ))}

                <TouchableOpacity style={styles.addRpSegBtn} onPress={handleAddRpSegment}>
                  <Text style={styles.addRpSegBtnTxt}>+ AJOUTER REPOS + REPS</Text>
                </TouchableOpacity>
              </View>
            )}

            {(hasAddedDs || parseSetsWithRestPause(newSetsInput).inlineDsCount > 0) && (
              <View style={styles.dsBuilderBox}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                  <Text style={[styles.label, { marginBottom: 0 }]}>🔻 Série(s) Drop Set ajoutée(s)</Text>
                  <TouchableOpacity
                    style={styles.rpDeleteSegBtn}
                    onPress={() => {
                      setHasAddedDs(false);
                      setNewAddedDsSetsInput('0');
                      const { normalReps } = parseSetsWithRestPause(newSetsInput);
                      if (normalReps.length > 0) {
                        setNewSetsInput(normalReps.join(', '));
                      }
                    }}
                  >
                    <Text style={styles.rpDeleteSegTxt}>✕ Retirer</Text>
                  </TouchableOpacity>
                </View>

                {hasAddedDs && (
                  <>
                    <Text style={styles.label}>Nombre de séries de Drop Set à ajouter</Text>
                    <TextInput
                      style={styles.input}
                      value={newAddedDsSetsInput}
                      onChangeText={setNewAddedDsSetsInput}
                      placeholder="e.g. 1"
                      keyboardType="numeric"
                    />
                  </>
                )}

                <Text style={styles.label}>Paliers du Drop Set (Poids & Répétitions)</Text>
                {dropSegments.map((seg, idx) => (
                  <View key={idx} style={styles.rpSegmentCard}>
                    <View style={styles.rpSegmentRow}>
                      <Text style={styles.rpSegmentLabel}>
                        {idx === 0 ? 'Départ (Poids / Reps) :' : `Drop ${idx} (Poids / Reps) :`}
                      </Text>
                      {dropSegments.length > 1 && (
                        <TouchableOpacity
                          style={styles.rpDeleteSegBtn}
                          onPress={() => handleRemoveDropSegment(idx)}
                        >
                          <Text style={styles.rpDeleteSegTxt}>✕</Text>
                        </TouchableOpacity>
                      )}
                    </View>
                    <View style={[styles.rpSegmentRow, { marginTop: 8, gap: 8 }]}>
                      <Text style={styles.dsDropLabel}>Poids (kg) :</Text>
                      <TextInput
                        style={styles.rpSmallInput}
                        value={seg.weight !== undefined ? String(seg.weight) : ''}
                        onChangeText={(val) => handleUpdateDropSegment(idx, 'weight', val)}
                        placeholder="ex: 40"
                        placeholderTextColor="#888"
                        keyboardType="numeric"
                      />
                      <Text style={styles.rpSegmentLabel}>Reps :</Text>
                      <TextInput
                        style={styles.rpSmallInput}
                        value={seg.reps}
                        onChangeText={(val) => handleUpdateDropSegment(idx, 'reps', val)}
                        placeholder="ex: 8-10"
                        placeholderTextColor="#888"
                      />
                    </View>
                    {idx > 0 && (
                      <View style={[styles.rpSegmentRow, { marginTop: 8 }]}>
                        <Text style={styles.dsDropLabel}>Baisse (optionnel) :</Text>
                        <TextInput
                          style={styles.rpSmallInput}
                          value={seg.drop}
                          onChangeText={(val) => handleUpdateDropSegment(idx, 'drop', val)}
                          placeholder="ex: -20%"
                          placeholderTextColor="#888"
                        />
                      </View>
                    )}
                  </View>
                ))}

                <TouchableOpacity style={styles.addDsSegBtn} onPress={handleAddDropSegment}>
                  <Text style={styles.addRpSegBtnTxt}>+ AJOUTER UN DROP</Text>
                </TouchableOpacity>
              </View>
            )}

            {(hasAddedRp || hasAddedDs || parseSetsWithRestPause(newSetsInput).inlineRpCount > 0 || parseSetsWithRestPause(newSetsInput).inlineDsCount > 0) && (
              <View style={styles.rpPreviewBox}>
                <Text style={styles.rpPreviewTxt}>
                  {newExerciseName || 'Exercice'} : {formatMixedSetsSummary(
                    parseSetsWithRestPause(newSetsInput).normalReps,
                    hasAddedRp
                      ? (parseInt(newAddedRpSetsInput, 10) || parseSetsWithRestPause(newSetsInput).inlineRpCount || 1)
                      : parseSetsWithRestPause(newSetsInput).inlineRpCount,
                    rpSegments,
                    hasAddedDs
                      ? (parseInt(newAddedDsSetsInput, 10) || parseSetsWithRestPause(newSetsInput).inlineDsCount || 1)
                      : parseSetsWithRestPause(newSetsInput).inlineDsCount,
                    dropSegments
                  )}
                </Text>
              </View>
            )}
          </>
        ) : newExType === 'rest-pause' ? (
          <View style={styles.rpBuilderBox}>
            <Text style={styles.label}>Nombre de séries de Rest-Pause</Text>
            <TextInput
              style={styles.input}
              value={newRpSetsInput}
              onChangeText={setNewRpSetsInput}
              placeholder="e.g. 2"
              keyboardType="numeric"
            />

            <Text style={styles.label}>Séquence Rest-Pause (Répétitions & Repos entre elles)</Text>
            {rpSegments.map((seg, idx) => (
              <View key={idx} style={styles.rpSegmentCard}>
                <View style={styles.rpSegmentRow}>
                  <Text style={styles.rpSegmentLabel}>Palier {idx + 1} (reps) :</Text>
                  <TextInput
                    style={styles.rpSmallInput}
                    value={seg.reps}
                    onChangeText={(val) => handleUpdateRpSegment(idx, 'reps', val)}
                    placeholder="ex: 6-8"
                  />
                  {rpSegments.length > 1 && (
                    <TouchableOpacity
                      style={styles.rpDeleteSegBtn}
                      onPress={() => handleRemoveRpSegment(idx)}
                    >
                      <Text style={styles.rpDeleteSegTxt}>✕</Text>
                    </TouchableOpacity>
                  )}
                </View>

                {idx < rpSegments.length - 1 && (
                  <View style={[styles.rpSegmentRow, { marginTop: 8 }]}>
                    <Text style={styles.rpRestLabel}>+ Repos avant palier {idx + 2} (s) :</Text>
                    <TextInput
                      style={styles.rpSmallInput}
                      value={seg.rest}
                      onChangeText={(val) => handleUpdateRpSegment(idx, 'rest', val)}
                      placeholder="ex: 15-20"
                    />
                  </View>
                )}
              </View>
            ))}

            <TouchableOpacity style={styles.addRpSegBtn} onPress={handleAddRpSegment}>
              <Text style={styles.addRpSegBtnTxt}>+ AJOUTER REPOS + REPS</Text>
            </TouchableOpacity>

            <View style={styles.rpPreviewBox}>
              <Text style={styles.rpPreviewTxt}>
                {newRpSetsInput || '2'} séries de rest-pause = {newExerciseName || 'Exercice'} : {formatRestPauseSegments(rpSegments)}
              </Text>
            </View>
          </View>
        ) : newExType === 'drop-set' ? (
          <View style={styles.dsBuilderBox}>
            <Text style={styles.label}>Nombre de séries de Drop Set</Text>
            <TextInput
              style={styles.input}
              value={newDsSetsInput}
              onChangeText={setNewDsSetsInput}
              placeholder="e.g. 2"
              keyboardType="numeric"
            />

            <Text style={styles.label}>Paliers du Drop Set (Poids & Répétitions)</Text>
            {dropSegments.map((seg, idx) => (
              <View key={idx} style={styles.rpSegmentCard}>
                <View style={styles.rpSegmentRow}>
                  <Text style={styles.rpSegmentLabel}>
                    {idx === 0 ? 'Départ (Poids / Reps) :' : `Drop ${idx} (Poids / Reps) :`}
                  </Text>
                  {dropSegments.length > 1 && (
                    <TouchableOpacity
                      style={styles.rpDeleteSegBtn}
                      onPress={() => handleRemoveDropSegment(idx)}
                    >
                      <Text style={styles.rpDeleteSegTxt}>✕</Text>
                    </TouchableOpacity>
                  )}
                </View>

                <View style={[styles.rpSegmentRow, { marginTop: 8, gap: 8 }]}>
                  <Text style={styles.dsDropLabel}>Poids (kg) :</Text>
                  <TextInput
                    style={styles.rpSmallInput}
                    value={seg.weight !== undefined ? String(seg.weight) : ''}
                    onChangeText={(val) => handleUpdateDropSegment(idx, 'weight', val)}
                    placeholder="ex: 40"
                    placeholderTextColor="#888"
                    keyboardType="numeric"
                  />
                  <Text style={styles.rpSegmentLabel}>Reps :</Text>
                  <TextInput
                    style={styles.rpSmallInput}
                    value={seg.reps}
                    onChangeText={(val) => handleUpdateDropSegment(idx, 'reps', val)}
                    placeholder="ex: 8-10"
                    placeholderTextColor="#888"
                  />
                </View>

                {idx > 0 && (
                  <View style={[styles.rpSegmentRow, { marginTop: 8 }]}>
                    <Text style={styles.dsDropLabel}>Baisse (optionnel) :</Text>
                    <TextInput
                      style={styles.rpSmallInput}
                      value={seg.drop}
                      onChangeText={(val) => handleUpdateDropSegment(idx, 'drop', val)}
                      placeholder="ex: -20%"
                      placeholderTextColor="#888"
                    />
                  </View>
                )}
              </View>
            ))}

            <TouchableOpacity style={styles.addDsSegBtn} onPress={handleAddDropSegment}>
              <Text style={styles.addRpSegBtnTxt}>+ AJOUTER UN DROP</Text>
            </TouchableOpacity>

            <View style={styles.rpPreviewBox}>
              <Text style={styles.rpPreviewTxt}>
                {newDsSetsInput || '2'} séries de drop set = {newExerciseName || 'Exercice'} : {formatDropSetSegments(dropSegments)}
              </Text>
            </View>
          </View>
        ) : (
          <>
            <Text style={styles.label}>Duration (minutes)</Text>
            <TextInput 
              style={styles.input} 
              value={newTimeInput} 
              onChangeText={setNewTimeInput} 
              placeholder="e.g. 5"
              keyboardType="numeric"
            />
          </>
        )}
        
        <Text style={styles.label}>Rest Time between sets (seconds)</Text>
        <TextInput 
          style={styles.input} 
          value={newRestInput} 
          onChangeText={setNewRestInput} 
          placeholder="e.g. 60"
          keyboardType="numeric"
        />

        <Text style={styles.label}>Note (optionnel)</Text>
        <TextInput 
          style={styles.input} 
          value={newNoteInput} 
          onChangeText={setNewNoteInput} 
          placeholder="Note pour cet exercice..."
          multiline
        />

        <TouchableOpacity style={styles.addBtn} onPress={handleAddExercise}>
          <Text style={styles.addBtnTxt}>{editIndex !== null ? "UPDATE EXERCISE" : "+ ADD EXERCISE"}</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.listSection}>
        <Text style={styles.sectionTitle}>Exercises List</Text>
        {exercises.length === 0 && <Text style={styles.emptyText}>No exercises added yet.</Text>}
        {exercises.map((ex, index) => (
          <View key={ex.id} style={styles.exCard}>
            <View style={{ flex: 1 }}>
              <Text style={styles.exName}>{index + 1}. {ex.name}</Text>
              {ex.type === 'time' ? (
                <Text style={styles.exDetails}>⏱ {Math.floor((ex.durationSeconds || 0)/60)}m {(ex.durationSeconds || 0)%60}s • {ex.restTime || 60}s Rest</Text>
              ) : ex.type === 'rest-pause' ? (
                <Text style={styles.exDetails}>
                  🔥 {ex.sets} séries de rest-pause : {formatRestPauseSegments(ex.restPauseSegments)} • {ex.restTime || 60}s Rest
                </Text>
              ) : ex.type === 'drop-set' ? (
                <Text style={styles.exDetails}>
                  🔻 {ex.sets} séries de drop set : {formatDropSetSegments(ex.dropSetSegments)} • {ex.restTime || 60}s Rest
                </Text>
              ) : (ex.restPauseSets && ex.restPauseSets > 0) || (ex.dropSetSets && ex.dropSetSets > 0) || (Array.isArray(ex.setTypes) && (ex.setTypes.includes('rest-pause') || ex.setTypes.includes('drop-set'))) ? (
                <Text style={styles.exDetails}>
                  🔥 {formatMixedSetsSummary(
                    Array.isArray(ex.normalTargetReps)
                      ? ex.normalTargetReps
                      : (ex.targetReps || []).slice(0, Math.max(0, (ex.targetReps || []).length - (ex.restPauseSets || 0) - (ex.dropSetSets || 0))),
                    ex.restPauseSets || (Array.isArray(ex.setTypes) ? ex.setTypes.filter(t => t === 'rest-pause').length : 0),
                    ex.restPauseSegments,
                    ex.dropSetSets || (Array.isArray(ex.setTypes) ? ex.setTypes.filter(t => t === 'drop-set').length : 0),
                    ex.dropSetSegments
                  )} • {ex.restTime || 60}s Rest
                </Text>
              ) : (
                <Text style={styles.exDetails}>{ex.targetReps ? ex.targetReps.join(', ') : ''} Reps ({ex.sets} Sets) • {ex.restTime || 60}s Rest</Text>
              )}
              <TextInput
                style={styles.inlineNoteInput}
                placeholder="📝 Ajouter ou modifier une note pour cet exercice..."
                value={ex.notes || ''}
                onChangeText={(text) => handleInlineNoteChange(index, text)}
                multiline
              />
            </View>
            <View style={{ flexDirection: 'row' }}>
              <TouchableOpacity style={styles.editBtn} onPress={() => handleEditExercise(index)}>
                <Text style={styles.editBtnTxt}>✏️</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.removeBtn} onPress={() => handleRemoveExercise(ex.id)}>
                <Text style={styles.removeBtnTxt}>❌</Text>
              </TouchableOpacity>
            </View>
          </View>
        ))}
      </View>

      <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
        <Text style={styles.saveBtnTxt}>SAVE WORKOUT TEMPLATE</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.startBtn} onPress={handleStart}>
        <Text style={styles.startBtnTxt}>START WORKOUT</Text>
      </TouchableOpacity>
      
      <TouchableOpacity style={styles.backBtn} onPress={() => navigation.navigate('Home')}>
        <Text style={styles.backBtnTxt}>BACK TO HOME</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5', padding: 16 },
  header: { alignItems: 'center', marginVertical: 16 },
  title: { fontSize: 24, fontWeight: 'bold', color: '#0bc0af' },
  label: { fontSize: 15, fontWeight: 'bold', color: '#333', marginBottom: 6 },
  input: { backgroundColor: '#fff', padding: 12, borderRadius: 10, marginBottom: 14, borderWidth: 1, borderColor: '#ddd', fontSize: 16, color: '#111111' },
  addSection: { backgroundColor: '#e6f7f6', padding: 16, borderRadius: 14, marginBottom: 20 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: '#333', marginBottom: 12 },
  typeToggle: { flexDirection: 'row', marginBottom: 14, gap: 8 },
  typeBtn: { flex: 1, paddingVertical: 12, paddingHorizontal: 6, backgroundColor: '#fff', borderRadius: 10, alignItems: 'center', borderWidth: 2, borderColor: '#ddd' },
  typeBtnActive: { borderColor: '#0bc0af', backgroundColor: '#e6f7f6' },
  typeBtnTxt: { fontSize: 13, fontWeight: 'bold', color: '#666', textAlign: 'center' },
  typeBtnTxtActive: { color: '#0bc0af' },
  addRpToSetsBtn: { backgroundColor: '#ff9800', padding: 12, borderRadius: 10, alignItems: 'center', marginBottom: 14 },
  addDsToSetsBtn: { backgroundColor: '#7b1fa2', padding: 12, borderRadius: 10, alignItems: 'center', marginBottom: 14 },
  addRpToSetsTxt: { color: '#fff', fontWeight: 'bold', fontSize: 13, textAlign: 'center' },
  rpBuilderBox: { marginBottom: 10 },
  dsBuilderBox: { marginBottom: 10, backgroundColor: '#f3e5f5', padding: 10, borderRadius: 10, borderWidth: 1, borderColor: '#ce93d8' },
  dsDropLabel: { fontSize: 13, fontWeight: 'bold', color: '#7b1fa2', flex: 1 },
  addDsSegBtn: { backgroundColor: '#7b1fa2', padding: 12, borderRadius: 10, alignItems: 'center', marginTop: 4, marginBottom: 10 },
  rpSegmentCard: { backgroundColor: '#fff', padding: 10, borderRadius: 10, marginBottom: 8, borderWidth: 1, borderColor: '#ccebe8' },
  rpSegmentRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  rpSegmentLabel: { fontSize: 14, fontWeight: 'bold', color: '#1b2a47', flex: 1 },
  rpRestLabel: { fontSize: 13, fontWeight: 'bold', color: '#ff9800', flex: 1 },
  rpSmallInput: { backgroundColor: '#f5f5f5', borderWidth: 1, borderColor: '#ddd', borderRadius: 8, paddingVertical: 6, paddingHorizontal: 8, fontSize: 15, fontWeight: 'bold', color: '#111111', minWidth: 54, maxWidth: 85, textAlign: 'center' },
  rpDeleteSegBtn: { marginLeft: 8, backgroundColor: '#ffe6e6', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8 },
  rpDeleteSegTxt: { color: '#ff4d4d', fontWeight: 'bold', fontSize: 14 },
  addRpSegBtn: { backgroundColor: '#0bc0af', padding: 12, borderRadius: 10, alignItems: 'center', marginTop: 4, marginBottom: 10 },
  addRpSegBtnTxt: { color: '#fff', fontWeight: 'bold', fontSize: 14 },
  rpPreviewBox: { backgroundColor: '#fff8e1', padding: 10, borderRadius: 8, borderWidth: 1, borderColor: '#ffe082', marginBottom: 10 },
  rpPreviewTxt: { fontSize: 13, color: '#5d4037', fontWeight: 'bold' },
  row: { flexDirection: 'row', justifyContent: 'space-between' },
  halfInput: { width: '48%' },
  addBtn: { backgroundColor: '#1b2a47', padding: 14, borderRadius: 10, alignItems: 'center', marginTop: 6 },
  addBtnTxt: { color: '#fff', fontWeight: 'bold', fontSize: 15 },
  listSection: { marginBottom: 20 },
  emptyText: { fontStyle: 'italic', color: '#888', fontSize: 15 },
  exCard: { flexDirection: 'column', backgroundColor: '#fff', padding: 14, borderRadius: 12, marginBottom: 10, elevation: 1 },
  exName: { fontSize: 17, fontWeight: 'bold', marginBottom: 6 },
  exDetails: { fontSize: 14, color: '#666', marginBottom: 8 },
  inlineNoteInput: { backgroundColor: '#f9f9f9', borderWidth: 1, borderColor: '#e0e0e0', borderRadius: 8, padding: 8, fontSize: 14, color: '#333', marginBottom: 10 },
  removeBtn: { padding: 10, backgroundColor: '#ffe6e6', borderRadius: 10, flex: 1, alignItems: 'center', marginLeft: 10 },
  removeBtnTxt: { fontSize: 16, color: '#ff4d4d', fontWeight: 'bold' },
  editBtn: { padding: 10, backgroundColor: '#e6f7f6', borderRadius: 10, flex: 1, alignItems: 'center' },
  editBtnTxt: { fontSize: 16, fontWeight: 'bold' },
  saveBtn: { backgroundColor: '#ff9800', padding: 15, borderRadius: 12, alignItems: 'center', marginBottom: 12 },
  saveBtnTxt: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  startBtn: { backgroundColor: '#4caf50', padding: 15, borderRadius: 12, alignItems: 'center', marginBottom: 12 },
  startBtnTxt: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  backBtn: { backgroundColor: '#999', padding: 15, borderRadius: 12, alignItems: 'center', marginBottom: 40 },
  backBtnTxt: { color: '#fff', fontSize: 16, fontWeight: 'bold' }
});
