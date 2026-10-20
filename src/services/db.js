import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { db, auth } from '../firebase';

const LOCAL_WEIGHTS_KEY = 'workout_buddy_last_weights';

const cleanData = (obj) => JSON.parse(JSON.stringify(obj));

export const formatPrevSets = (loggedSets) => {
  if (!loggedSets || loggedSets.length === 0) return 'No previous data';
  return loggedSets.map(s => `${s.weight} kg x ${s.reps}`).join(', ');
};

export const saveLocalWeights = (exercises) => {
  try {
    if (typeof window === 'undefined' || !window.localStorage) return;
    const raw = window.localStorage.getItem(LOCAL_WEIGHTS_KEY);
    const map = raw ? JSON.parse(raw) : {};
    (exercises || []).forEach(ex => {
      if (ex && ex.loggedSets && ex.loggedSets.length > 0) {
        const lastWeight = String(ex.loggedSets[0].weight ?? '0');
        const prev = formatPrevSets(ex.loggedSets);
        const entry = {
          lastWeight,
          previousLoggedSets: ex.loggedSets,
          prev
        };
        if (ex.id) map[`id:${ex.id}`] = entry;
        if (ex.name) map[`name:${ex.name.trim().toLowerCase()}`] = entry;
      }
    });
    window.localStorage.setItem(LOCAL_WEIGHTS_KEY, JSON.stringify(map));
  } catch (e) {
    // Ignore localStorage errors
  }
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

export const enrichExercisesWithHistory = (exercises, history = [], workoutName = null) => {
  const localMap = getLocalWeightsMap();

  // Also populate localMap from history (oldest to newest so newest wins)
  (history || []).forEach(h => {
    if (h && Array.isArray(h.exercises)) {
      saveLocalWeights(h.exercises);
    }
  });

  const updatedLocalMap = getLocalWeightsMap();

  return (exercises || []).map(ex => {
    if (!ex || ex.type === 'time') return ex;

    const normName = (ex.name || '').trim().toLowerCase();
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
        prev: formatPrevSets(matchedSets)
      };
    }

    // 3. Fallback to template's own stored previousLoggedSets / lastWeight or localMap
    const localEntry =
      (ex.id && (updatedLocalMap[`id:${ex.id}`] || localMap[`id:${ex.id}`])) ||
      (normName && (updatedLocalMap[`name:${normName}`] || localMap[`name:${normName}`]));

    if (localEntry && (!ex.previousLoggedSets || ex.previousLoggedSets.length === 0)) {
      return {
        ...ex,
        lastWeight: localEntry.lastWeight,
        previousLoggedSets: localEntry.previousLoggedSets,
        prev: localEntry.prev
      };
    }

    return ex;
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
