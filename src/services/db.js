import { collection, doc, getDoc, getDocs, setDoc, updateDoc, query, where, arrayUnion } from 'firebase/firestore';
import { db, auth } from '../firebase';

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
    return snap.data().templates || [];
  } catch (error) {
    console.error("Error getting templates:", error);
    return [];
  }
};

export const saveTemplate = async (newTemplate, workoutId = null) => {
  try {
    const ref = await ensureUserDoc();
    const snap = await getDoc(ref);
    let templates = snap.data().templates || [];
    
    if (workoutId) {
      templates = templates.map(t => t.id === workoutId ? newTemplate : t);
    } else {
      templates.unshift(newTemplate);
    }
    
    await updateDoc(ref, { templates });
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
    return snap.data().history || [];
  } catch (error) {
    console.error("Error getting history:", error);
    return [];
  }
};

export const saveHistory = async (historyItem) => {
  try {
    const ref = await ensureUserDoc();
    await updateDoc(ref, {
      history: arrayUnion(historyItem)
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
    let history = snap.data().history || [];
    
    // Filter out the item based on ID if available, otherwise fallback to matching date, name, and volume
    history = history.filter(item => {
      if (item.id && historyItemToDelete.id) {
        return item.id !== historyItemToDelete.id;
      }
      return !(item.date === historyItemToDelete.date && item.name === historyItemToDelete.name && item.volume === historyItemToDelete.volume);
    });
    
    await updateDoc(ref, { history });
    return true;
  } catch (error) {
    console.error("Error deleting history item:", error);
    return false;
  }
};

export const updateHistoryItem = async (updatedHistoryItem) => {
  try {
    const ref = await ensureUserDoc();
    const snap = await getDoc(ref);
    let history = snap.data().history || [];
    
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
    
    await updateDoc(ref, { history });
    return true;
  } catch (error) {
    console.error("Error updating history item:", error);
    return false;
  }
};
