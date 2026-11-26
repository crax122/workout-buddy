import { formatPrevSets } from './db';

const ARM_KEYWORDS = [
  'bicep',
  'tricep',
  'curl',
  'marteau',
  'hammer',
  'pupitre',
  'preacher',
  'barre au front',
  'french press',
  'skull',
  'pushdown',
  'kickback',
  'dips',
  'extension'
];

export const isArmExerciseName = (name = '') => {
  const lower = name.trim().toLowerCase();
  return ARM_KEYWORDS.some(kw => lower.includes(kw));
};

const extractFirstNumber = (val, fallback = 0) => {
  if (val === undefined || val === null) return fallback;
  const match = String(val).match(/\d+(\.\d+)?/);
  return match ? parseFloat(match[0]) : fallback;
};

export const computeSetMetrics = (loggedSets = []) => {
  let maxWeight = 0;
  let totalVolume = 0;
  let totalReps = 0;
  let best1RM = 0;
  const primaryRepsList = [];

  (loggedSets || []).forEach(set => {
    if (!set) return;
    if (set.isDropSet && Array.isArray(set.drops) && set.drops.length > 0) {
      const firstDropReps = extractFirstNumber(set.drops[0]?.reps, 0);
      if (firstDropReps > 0) primaryRepsList.push(firstDropReps);
      set.drops.forEach(d => {
        const w = parseFloat(d.weight) || 0;
        const r = extractFirstNumber(d.reps, 0);
        if (w > maxWeight) maxWeight = w;
        totalVolume += w * r;
        totalReps += r;
        const rm = r <= 1 ? w : w * (1 + r / 30);
        if (rm > best1RM) best1RM = rm;
      });
    } else if (set.isRestPause && Array.isArray(set.segments) && set.segments.length > 0) {
      const w = parseFloat(set.weight) || 0;
      const firstSegReps = extractFirstNumber(set.segments[0]?.reps, 0);
      if (firstSegReps > 0) primaryRepsList.push(firstSegReps);
      const sumSegReps = set.segments.reduce((acc, s) => acc + extractFirstNumber(s.reps, 0), 0);
      if (w > maxWeight) maxWeight = w;
      totalVolume += w * sumSegReps;
      totalReps += sumSegReps;
      const rm = firstSegReps <= 1 ? w : w * (1 + firstSegReps / 30);
      if (rm > best1RM) best1RM = rm;
    } else {
      const w = parseFloat(set.weight) || 0;
      const r = extractFirstNumber(set.reps, 0);
      if (r > 0) primaryRepsList.push(r);
      if (w > maxWeight) maxWeight = w;
      totalVolume += w * r;
      totalReps += r;
      const rm = r <= 1 ? w : w * (1 + r / 30);
      if (rm > best1RM) best1RM = rm;
    }
  });

  const avgReps =
    primaryRepsList.length > 0
      ? primaryRepsList.reduce((a, b) => a + b, 0) / primaryRepsList.length
      : 0;

  const repRangeBucket = avgReps > 0 && avgReps <= 8.5 ? '6-8' : '10-12';

  return {
    maxWeight,
    totalVolume: Math.round(totalVolume * 10) / 10,
    totalReps,
    avgReps: Math.round(avgReps * 10) / 10,
    best1RM: Math.round(best1RM * 10) / 10,
    repRangeBucket,
    setsSummary: formatPrevSets(loggedSets)
  };
};

const computeDelta = (curr, prev) => {
  if (!prev) {
    return {
      status: 'first',
      weightDiff: 0,
      volumeDiff: 0,
      oneRMDiff: 0,
      repsDiff: 0
    };
  }
  const weightDiff = Math.round((curr.maxWeight - prev.maxWeight) * 10) / 10;
  const volumeDiff = Math.round((curr.totalVolume - prev.totalVolume) * 10) / 10;
  const oneRMDiff = Math.round((curr.best1RM - prev.best1RM) * 10) / 10;
  const repsDiff = curr.totalReps - prev.totalReps;

  let status = 'same';
  if (oneRMDiff > 0.25 || weightDiff > 0 || (weightDiff === 0 && repsDiff > 0) || volumeDiff > 0) {
    status = 'up';
  } else if (oneRMDiff < -0.5 || (weightDiff < 0 && volumeDiff < 0)) {
    status = 'down';
  }

  return {
    status,
    weightDiff,
    volumeDiff,
    oneRMDiff,
    repsDiff
  };
};

const buildCycleSummary = (bucketEntries) => {
  if (!bucketEntries || bucketEntries.length === 0) return null;
  const first = bucketEntries[0];
  const latest = bucketEntries[bucketEntries.length - 1];
  const prev = bucketEntries.length >= 2 ? bucketEntries[bucketEntries.length - 2] : null;
  const deltaFromFirst = computeDelta(latest, bucketEntries.length >= 2 ? first : null);
  const deltaFromPrev = computeDelta(latest, prev);
  return {
    count: bucketEntries.length,
    first,
    latest,
    deltaFromFirst,
    deltaFromPrev
  };
};

export const analyzeProgression = (history = [], workoutFilter = 'ALL') => {
  const workoutNamesSet = new Set();
  (history || []).forEach(h => {
    if (h && h.name) workoutNamesSet.add(h.name);
  });

  const filteredHistory = (history || []).filter(h => {
    if (!h) return false;
    if (workoutFilter && workoutFilter !== 'ALL') {
      return h.name === workoutFilter;
    }
    return true;
  });

  const exerciseMap = {};

  filteredHistory.forEach((h, hIdx) => {
    if (!Array.isArray(h.exercises)) return;
    h.exercises.forEach(ex => {
      if (!ex || !ex.name) return;
      const key = ex.name.trim().toLowerCase();
      if (!exerciseMap[key]) {
        exerciseMap[key] = {
          key,
          name: ex.name.trim(),
          type: ex.type || 'reps',
          rawSessions: []
        };
      }

      if (ex.type === 'time') {
        const dur = ex.durationSeconds || 0;
        exerciseMap[key].rawSessions.push({
          historyId: h.id || String(hIdx),
          date: h.date || '',
          workoutName: h.name || 'Séance',
          isTime: true,
          durationSeconds: dur,
          notes: ex.notes || ''
        });
      } else if (Array.isArray(ex.loggedSets) && ex.loggedSets.length > 0) {
        const metrics = computeSetMetrics(ex.loggedSets);
        exerciseMap[key].rawSessions.push({
          historyId: h.id || String(hIdx),
          date: h.date || '',
          workoutName: h.name || 'Séance',
          isTime: false,
          notes: ex.notes || '',
          ...metrics
        });
      }
    });
  });

  const exercises = Object.values(exerciseMap)
    .filter(item => item.rawSessions.length > 0)
    .map(item => {
      const firstIsTime = item.rawSessions.every(s => s.isTime);
      if (firstIsTime) {
        const sessions = item.rawSessions.map((s, idx) => {
          const prev = idx > 0 ? item.rawSessions[idx - 1] : null;
          const durDiff = prev ? s.durationSeconds - prev.durationSeconds : 0;
          const status = !prev ? 'first' : durDiff > 0 ? 'up' : durDiff < 0 ? 'down' : 'same';
          return { ...s, durDiff, status };
        });
        const latest = sessions[sessions.length - 1];
        const first = sessions[0];
        return {
          key: item.key,
          name: item.name,
          isTime: true,
          isAlternating: false,
          sessionCount: sessions.length,
          sessions,
          latest,
          first,
          overallStatus: latest.status
        };
      }

      const strengthSessions = item.rawSessions.filter(s => !s.isTime);
      const has6_8 = strengthSessions.some(s => s.repRangeBucket === '6-8');
      const has10_12 = strengthSessions.some(s => s.repRangeBucket === '10-12');
      const isAlternating = isArmExerciseName(item.name) || (has6_8 && has10_12);

      const lastByBucket = { '6-8': null, '10-12': null };
      const sessions = strengthSessions.map((s, idx) => {
        let comparablePrev = null;
        if (isAlternating) {
          comparablePrev = lastByBucket[s.repRangeBucket];
          lastByBucket[s.repRangeBucket] = s;
        } else {
          comparablePrev = idx > 0 ? strengthSessions[idx - 1] : null;
        }
        const delta = computeDelta(s, comparablePrev);
        return {
          ...s,
          comparablePrevDate: comparablePrev ? comparablePrev.date : null,
          ...delta
        };
      });

      const bestWeight = Math.max(...sessions.map(s => s.maxWeight));
      const best1RM = Math.max(...sessions.map(s => s.best1RM));
      const bestVolume = Math.max(...sessions.map(s => s.totalVolume));

      const cycle6_8 = isAlternating
        ? buildCycleSummary(sessions.filter(s => s.repRangeBucket === '6-8'))
        : null;
      const cycle10_12 = isAlternating
        ? buildCycleSummary(sessions.filter(s => s.repRangeBucket === '10-12'))
        : null;

      const latest = sessions[sessions.length - 1];
      const first = sessions[0];
      const overallDelta = !isAlternating
        ? computeDelta(latest, sessions.length >= 2 ? first : null)
        : latest.status !== 'first'
          ? { status: latest.status, weightDiff: latest.weightDiff, volumeDiff: latest.volumeDiff, oneRMDiff: latest.oneRMDiff, repsDiff: latest.repsDiff }
          : (cycle6_8?.deltaFromFirst?.status !== 'first' ? cycle6_8.deltaFromFirst : cycle10_12?.deltaFromFirst) || { status: 'first', weightDiff: 0, volumeDiff: 0, oneRMDiff: 0, repsDiff: 0 };

      return {
        key: item.key,
        name: item.name,
        isTime: false,
        isAlternating,
        sessionCount: sessions.length,
        sessions,
        bestWeight,
        best1RM,
        bestVolume,
        cycle6_8,
        cycle10_12,
        latest,
        first,
        overallStatus: overallDelta.status,
        overallDelta
      };
    });

  // Sort exercises by number of sessions descending, then alphabetically
  exercises.sort((a, b) => b.sessionCount - a.sessionCount || a.name.localeCompare(b.name));

  return {
    workoutNames: Array.from(workoutNamesSet),
    totalSessionsAnalyzed: filteredHistory.length,
    exercises
  };
};
