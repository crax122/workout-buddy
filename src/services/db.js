import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { db, auth } from '../firebase';

const LOCAL_WEIGHTS_KEY = 'workout_buddy_last_weights';

const cleanData = (obj) => JSON.parse(JSON.stringify(obj));

export const formatSetSummary = (s) => {
  if (!s) return '';
  if (s.isRestPause && Array.isArray(s.segments) && s.segments.length > 0) {
    const chain = s.segments
      .map((seg, i) => (i < s.segments.length - 1 ? `${seg.reps} reps + ${seg.rest || 15}s repos` : `${seg.reps} reps`))
      .join(' + ');
    return `${s.weight} kg (${chain})`;
  }
  if (s.isDropSet && Array.isArray(s.drops) && s.drops.length > 0) {
    const chain = s.drops
      .map(d => `${d.weight} kg x ${d.reps}`)
      .join(' → ');
    return `Drop Set (${chain})`;
  }
  return `${s.weight} kg x ${s.reps}`;
};

export const formatPrevSets = (loggedSets) => {
  if (!loggedSets || loggedSets.length === 0) return 'No previous data';
  return loggedSets.map(formatSetSummary).join(', ');
};

export const getLocalWeightsMap = () => {
  try {
    if (typeof window === 'undefined' || !window.localStorage) return {};
    const raw = window.localStorage.getItem(LOCAL_WEIGHTS_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch (e) {
    return {};
  }
};

export const saveLocalWeights = (exercises, workoutName = null) => {
  try {
    if (typeof window === 'undefined' || !window.localStorage) return;
    const map = getLocalWeightsMap();
    const normWorkout = workoutName ? String(workoutName).trim().toLowerCase() : null;
    (exercises || []).forEach(ex => {
      if (!ex) return;
      const normName = (ex.name || '').trim().toLowerCase();
      const workoutNameKey = normWorkout && normName ? `workout:${normWorkout}::name:${normName}` : null;
      const idKey = ex.id ? `id:${ex.id}` : null;
      const nameKey = normName ? `name:${normName}` : null;

      const existing =
        (workoutNameKey && map[workoutNameKey]) ||
        (idKey && map[idKey]) ||
        (nameKey && map[nameKey]) ||
        {};
      const updated = { ...existing };

      if (ex.loggedSets && ex.loggedSets.length > 0) {
        updated.lastWeight = String(ex.loggedSets[0].weight ?? '0');
        updated.previousLoggedSets = ex.loggedSets;
        updated.prev = formatPrevSets(ex.loggedSets);
        updated.lastLoggedAt = Date.now();
      } else if (Array.isArray(ex.targetWeights) && ex.targetWeights.some(w => String(w || '').trim() !== '')) {
        const firstW = ex.targetWeights.find(w => String(w || '').trim() !== '');
        if (!updated.lastWeight || (ex.targetWeightsUpdatedAt || 0) >= (updated.lastLoggedAt || 0)) {
          updated.lastWeight = String(firstW);
          updated.targetWeights = ex.targetWeights;
          updated.targetWeightsUpdatedAt = ex.targetWeightsUpdatedAt || Date.now();
        }
      }

      if (typeof ex.notes === 'string') {
        const exNoteTime = ex.noteUpdatedAt || 0;
        const existingNoteTime = existing.noteUpdatedAt || 0;
        if (ex.notes !== '' || exNoteTime >= existingNoteTime) {
          if (exNoteTime >= existingNoteTime || !existing.notes) {
            updated.notes = ex.notes;
            updated.noteUpdatedAt = exNoteTime || Date.now();
          }
        }
      }

      if (Object.keys(updated).length > 0) {
        if (workoutNameKey) map[workoutNameKey] = updated;
        if (idKey) map[idKey] = updated;
        if (nameKey) map[nameKey] = updated;
      }
    });
    window.localStorage.setItem(LOCAL_WEIGHTS_KEY, JSON.stringify(map));
  } catch (e) {
    // Ignore localStorage errors
  }
};

export const saveExerciseNote = async (exercise, noteText) => {
  if (!exercise) return;
  const now = Date.now();
  const exWithNote = {
    ...exercise,
    notes: noteText,
    noteUpdatedAt: now
  };
  saveLocalWeights([exWithNote]);

  try {
    const user = auth.currentUser;
    if (!user) return;
    const ref = doc(db, 'users', user.uid);
    const snap = await getDoc(ref);
    if (!snap.exists()) return;
    const data = snap.data() || {};
    const normName = (exercise.name || '').trim().toLowerCase();
    let changed = false;

    const templates = (data.templates || []).map(t => ({
      ...t,
      exercises: (t.exercises || []).map(ex => {
        const matchId = exercise.id && ex.id === exercise.id;
        const matchName = normName && (ex.name || '').trim().toLowerCase() === normName;
        if (matchId || matchName) {
          changed = true;
          return {
            ...ex,
            notes: noteText,
            noteUpdatedAt: now
          };
        }
        return ex;
      })
    }));

    if (changed) {
      await updateDoc(ref, { templates: cleanData(templates) });
    }
  } catch (e) {
    console.error("Error saving exercise note:", e);
  }
};

export const enrichExercisesWithHistory = (exercises, history = [], workoutName = null) => {
  // Populate local cache from history (oldest to newest so newest wins)
  (history || []).forEach(h => {
    if (h && Array.isArray(h.exercises)) {
      saveLocalWeights(h.exercises, h.name || null);
    }
  });

  const localMap = getLocalWeightsMap();
  const normWorkout = workoutName ? String(workoutName).trim().toLowerCase() : null;

  return (exercises || []).map(ex => {
    if (!ex) return ex;

    const normName = (ex.name || '').trim().toLowerCase();
    const workoutScopedEntry = normWorkout && normName ? localMap[`workout:${normWorkout}::name:${normName}`] : null;
    const idScopedEntry = ex.id ? localMap[`id:${ex.id}`] : null;
    const nameScopedEntry = normName ? localMap[`name:${normName}`] : null;
    const localEntry = workoutScopedEntry || idScopedEntry || nameScopedEntry || null;

    // Find latest note for this exercise (works for both 'reps' and 'time' exercises)
    let resolvedNote = typeof ex.notes === 'string' ? ex.notes : '';
    let resolvedNoteTime = ex.noteUpdatedAt || 0;

    if (Array.isArray(history)) {
      for (let i = history.length - 1; i >= 0; i--) {
        const h = history[i];
        if (h && Array.isArray(h.exercises)) {
          const foundNoteEx = h.exercises.find(
            hEx =>
              hEx &&
              typeof hEx.notes === 'string' &&
              (hEx.notes.trim() !== '' || hEx.noteUpdatedAt) &&
              ((ex.id && hEx.id === ex.id) ||
                (normName && (hEx.name || '').trim().toLowerCase() === normName))
          );
          if (foundNoteEx) {
            const hNoteTime = foundNoteEx.noteUpdatedAt || 1;
            if (hNoteTime >= resolvedNoteTime || !resolvedNote) {
              resolvedNote = foundNoteEx.notes;
              resolvedNoteTime = hNoteTime;
            }
            break;
          }
        }
      }
    }

    if (localEntry && typeof localEntry.notes === 'string') {
      const localNoteTime = localEntry.noteUpdatedAt || 0;
      if (localNoteTime >= resolvedNoteTime || (!resolvedNote && localEntry.notes)) {
        resolvedNote = localEntry.notes;
        resolvedNoteTime = localNoteTime;
      }
    }

    if (ex.type === 'time') {
      return {
        ...ex,
        notes: resolvedNote,
        ...(resolvedNoteTime ? { noteUpdatedAt: resolvedNoteTime } : {})
      };
    }

    let matchedSets = null;
    let matchedFromSameWorkout = false;
    let matchedLoggedAt = 0;

    // 1. Search history from newest to oldest within the same workout name first
    if (workoutName && Array.isArray(history)) {
      for (let i = history.length - 1; i >= 0; i--) {
        const h = history[i];
        if (h && h.name === workoutName && Array.isArray(h.exercises)) {
          const found = h.exercises.find(
            hEx =>
              hEx &&
              hEx.loggedSets &&
              hEx.loggedSets.length > 0 &&
              ((ex.id && hEx.id === ex.id) ||
                (normName && (hEx.name || '').trim().toLowerCase() === normName))
          );
          if (found) {
            matchedSets = found.loggedSets;
            matchedFromSameWorkout = true;
            matchedLoggedAt = parseInt(h.id, 10) || (i + 1);
            break;
          }
        }
      }
    }

    // 2. Fallback: search all history from newest to oldest ONLY if no targetWeights are configured for this exercise
    const hasConfiguredTargetWeights =
      Array.isArray(ex.targetWeights) && ex.targetWeights.some(w => String(w || '').trim() !== '');

    if (!matchedSets && !hasConfiguredTargetWeights && Array.isArray(history)) {
      for (let i = history.length - 1; i >= 0; i--) {
        const h = history[i];
        if (h && Array.isArray(h.exercises)) {
          const found = h.exercises.find(
            hEx =>
              hEx &&
              hEx.loggedSets &&
              hEx.loggedSets.length > 0 &&
              ((ex.id && hEx.id === ex.id) ||
                (normName && (hEx.name || '').trim().toLowerCase() === normName))
          );
          if (found) {
            matchedSets = found.loggedSets;
            matchedFromSameWorkout = false;
            matchedLoggedAt = parseInt(h.id, 10) || (i + 1);
            break;
          }
        }
      }
    }

    if (matchedSets && matchedSets.length > 0) {
      return {
        ...ex,
        lastWeight: String(matchedSets[0].weight ?? '0'),
        previousLoggedSets: matchedSets,
        matchedFromSameWorkout,
        lastLoggedAt: matchedLoggedAt,
        prev: formatPrevSets(matchedSets),
        notes: resolvedNote,
        ...(resolvedNoteTime ? { noteUpdatedAt: resolvedNoteTime } : {})
      };
    }

    // 3. Fallback to workout-scoped or id-scoped localMap (do not leak another workout's weights if targetWeights are configured)
    const safeLocalEntry = hasConfiguredTargetWeights
      ? (workoutScopedEntry || idScopedEntry)
      : localEntry;

    if (safeLocalEntry && safeLocalEntry.previousLoggedSets && (!ex.previousLoggedSets || ex.previousLoggedSets.length === 0)) {
      return {
        ...ex,
        lastWeight: safeLocalEntry.lastWeight,
        previousLoggedSets: safeLocalEntry.previousLoggedSets,
        matchedFromSameWorkout: Boolean(workoutScopedEntry),
        ...(safeLocalEntry.lastLoggedAt ? { lastLoggedAt: safeLocalEntry.lastLoggedAt } : {}),
        prev: safeLocalEntry.prev,
        notes: resolvedNote,
        ...(resolvedNoteTime ? { noteUpdatedAt: resolvedNoteTime } : {})
      };
    }

    return {
      ...ex,
      notes: resolvedNote,
      ...(resolvedNoteTime ? { noteUpdatedAt: resolvedNoteTime } : {})
    };
  });
};

const syncTemplatesWithHistory = (templates, history) => {
  return (templates || []).map(t => ({
    ...t,
    exercises: enrichExercisesWithHistory(t.exercises || [], history, t.name).map(ex => ({
      ...ex,
      completed: false,
      completedSets: 0,
      loggedSets: []
    }))
  }));
};

// Helper to get user reference
const getUserDocRef = () => {
  const user = auth.currentUser;
  if (!user) throw new Error("User not authenticated");
  return doc(db, 'users', user.uid);
};

// Ensure user document exists
const ensureUserDoc = async () => {
  const ref = getUserDocRef();
  const snap = await getDoc(ref);
  if (!snap.exists()) {
    await setDoc(ref, { templates: [], history: [] });
  }
  return ref;
};

export const getTemplates = async () => {
  try {
    const ref = await ensureUserDoc();
    const snap = await getDoc(ref);
    const data = snap.data() || {};
    const templates = data.templates || [];
    const history = data.history || [];
    return syncTemplatesWithHistory(templates, history);
  } catch (error) {
    console.error("Error getting templates:", error);
    return [];
  }
};

export const saveTemplate = async (newTemplate, workoutId = null) => {
  try {
    if (newTemplate && Array.isArray(newTemplate.exercises)) {
      saveLocalWeights(newTemplate.exercises, newTemplate.name || null);
    }
    const ref = await ensureUserDoc();
    const snap = await getDoc(ref);
    const data = snap.data() || {};
    let templates = data.templates || [];
    const history = data.history || [];

    const enrichedTemplate = {
      ...newTemplate,
      exercises: enrichExercisesWithHistory(newTemplate.exercises || [], history, newTemplate.name)
    };
    
    if (workoutId) {
      templates = templates.map(t => t.id === workoutId ? enrichedTemplate : t);
    } else {
      templates.unshift(enrichedTemplate);
    }
    
    await updateDoc(ref, { templates: cleanData(templates) });
    return true;
  } catch (error) {
    console.error("Error saving template:", error);
    return false;
  }
};

export const getHistory = async () => {
  try {
    const ref = await ensureUserDoc();
    const snap = await getDoc(ref);
    const history = snap.data().history || [];
    history.forEach(h => {
      if (h && Array.isArray(h.exercises)) {
        saveLocalWeights(h.exercises, h.name || null);
      }
    });
    return history;
  } catch (error) {
    console.error("Error getting history:", error);
    return [];
  }
};

export const saveHistory = async (historyItem) => {
  try {
    if (historyItem && Array.isArray(historyItem.exercises)) {
      saveLocalWeights(historyItem.exercises, historyItem.name || null);
    }
    const ref = await ensureUserDoc();
    const snap = await getDoc(ref);
    const data = snap.data() || {};
    const history = [...(data.history || []), historyItem];
    const templates = syncTemplatesWithHistory(data.templates || [], history);

    await updateDoc(ref, {
      history: cleanData(history),
      templates: cleanData(templates)
    });
    return true;
  } catch (error) {
    console.error("Error saving history:", error);
    return false;
  }
};

export const clearHistory = async () => {
  try {
    const ref = await ensureUserDoc();
    await updateDoc(ref, { history: [] });
    return true;
  } catch (error) {
    console.error("Error clearing history:", error);
    return false;
  }
};

export const deleteHistoryItem = async (historyItemToDelete) => {
  try {
    const ref = await ensureUserDoc();
    const snap = await getDoc(ref);
    const data = snap.data() || {};
    let history = data.history || [];
    
    // Filter out the item based on ID if available, otherwise fallback to matching date, name, and volume
    history = history.filter(item => {
      if (item.id && historyItemToDelete.id) {
        return item.id !== historyItemToDelete.id;
      }
      return !(item.date === historyItemToDelete.date && item.name === historyItemToDelete.name && item.volume === historyItemToDelete.volume);
    });

    const templates = syncTemplatesWithHistory(data.templates || [], history);
    
    await updateDoc(ref, {
      history: cleanData(history),
      templates: cleanData(templates)
    });
    return true;
  } catch (error) {
    console.error("Error deleting history item:", error);
    return false;
  }
};

export const deleteExerciseSessionFromHistory = async (historyId, exerciseName, sessionDate, workoutName) => {
  try {
    const ref = await ensureUserDoc();
    const snap = await getDoc(ref);
    const data = snap.data() || {};
    let history = data.history || [];
    const normTarget = (exerciseName || '').trim().toLowerCase();

    history = history
      .map((item, idx) => {
        const matchesId = item.id && historyId && String(item.id) === String(historyId);
        const matchesFallback =
          !item.id &&
          (String(idx) === String(historyId) ||
            (item.date === sessionDate && item.name === workoutName));
        if (!matchesId && !matchesFallback) return item;

        const remainingExercises = (item.exercises || []).filter(
          ex => (ex?.name || '').trim().toLowerCase() !== normTarget
        );

        if (remainingExercises.length === 0) {
          return null;
        }

        // Recompute session volume from remaining exercises
        let newVol = 0;
        remainingExercises.forEach(ex => {
          if (ex.type !== 'time' && Array.isArray(ex.loggedSets)) {
            ex.loggedSets.forEach(s => {
              if (s.isDropSet && Array.isArray(s.drops)) {
                s.drops.forEach(d => {
                  newVol += (parseFloat(d.weight) || 0) * (parseFloat(d.reps) || 0);
                });
              } else {
                newVol += (parseFloat(s.weight) || 0) * (parseFloat(s.reps) || 0);
              }
            });
          }
        });

        return {
          ...item,
          exercises: remainingExercises,
          volume: Math.round(newVol * 10) / 10
        };
      })
      .filter(Boolean);

    const templates = syncTemplatesWithHistory(data.templates || [], history);

    await updateDoc(ref, {
      history: cleanData(history),
      templates: cleanData(templates)
    });
    return true;
  } catch (error) {
    console.error("Error deleting exercise session from history:", error);
    return false;
  }
};

export const updateHistoryItem = async (updatedHistoryItem) => {
  try {
    if (updatedHistoryItem && Array.isArray(updatedHistoryItem.exercises)) {
      saveLocalWeights(updatedHistoryItem.exercises);
    }
    const ref = await ensureUserDoc();
    const snap = await getDoc(ref);
    const data = snap.data() || {};
    let history = data.history || [];
    
    // Update the item based on ID if available, otherwise fallback to matching date, name
    history = history.map(item => {
      if (item.id && updatedHistoryItem.id) {
        if (item.id === updatedHistoryItem.id) {
          return updatedHistoryItem;
        }
        return item;
      }
      if (item.date === updatedHistoryItem.date && item.name === updatedHistoryItem.name) {
        return updatedHistoryItem;
      }
      return item;
    });

    const templates = syncTemplatesWithHistory(data.templates || [], history);
    
    await updateDoc(ref, {
      history: cleanData(history),
      templates: cleanData(templates)
    });
    return true;
  } catch (error) {
    console.error("Error updating history item:", error);
    return false;
  }
};
