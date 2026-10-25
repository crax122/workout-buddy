import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { db, auth } from '../firebase';

const LOCAL_WEIGHTS_KEY = 'workout_buddy_last_weights';

const cleanData = (obj) => JSON.parse(JSON.stringify(obj));

export const formatPrevSets = (loggedSets) => {
  if (!loggedSets || loggedSets.length === 0) return 'No previous data';
  return loggedSets.map(s => `${s.weight} kg x ${s.reps}`).join(', ');
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

export const saveLocalWeights = (exercises) => {
  try {
    if (typeof window === 'undefined' || !window.localStorage) return;
    const map = getLocalWeightsMap();
    (exercises || []).forEach(ex => {
      if (!ex) return;
      const normName = (ex.name || '').trim().toLowerCase();
      const idKey = ex.id ? `id:${ex.id}` : null;
      const nameKey = normName ? `name:${normName}` : null;

      const existing = (idKey && map[idKey]) || (nameKey && map[nameKey]) || {};
      const updated = { ...existing };

      if (ex.loggedSets && ex.loggedSets.length > 0) {
        updated.lastWeight = String(ex.loggedSets[0].weight ?? '0');
        updated.previousLoggedSets = ex.loggedSets;
        updated.prev = formatPrevSets(ex.loggedSets);
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
      saveLocalWeights(h.exercises);
    }
  });

  const localMap = getLocalWeightsMap();

  return (exercises || []).map(ex => {
    if (!ex) return ex;

    const normName = (ex.name || '').trim().toLowerCase();
    const localEntry =
      (ex.id && localMap[`id:${ex.id}`]) ||
      (normName && localMap[`name:${normName}`]) ||
      null;

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
            break;
          }
        }
      }
    }

    // 2. Fallback: search all history from newest to oldest for matching exercise ID or name
    if (!matchedSets && Array.isArray(history)) {
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
        prev: formatPrevSets(matchedSets),
        notes: resolvedNote,
        ...(resolvedNoteTime ? { noteUpdatedAt: resolvedNoteTime } : {})
      };
    }

    // 3. Fallback to template's own stored previousLoggedSets / lastWeight or localMap
    if (localEntry && localEntry.previousLoggedSets && (!ex.previousLoggedSets || ex.previousLoggedSets.length === 0)) {
      return {
        ...ex,
        lastWeight: localEntry.lastWeight,
        previousLoggedSets: localEntry.previousLoggedSets,
        prev: localEntry.prev,
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
      saveLocalWeights(newTemplate.exercises);
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
        saveLocalWeights(h.exercises);
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
      saveLocalWeights(historyItem.exercises);
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
