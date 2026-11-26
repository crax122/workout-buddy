import { formatPrevSets } from './db';

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
  let setWeightSum = 0;
  let setCount = 0;

  (loggedSets || []).forEach(set => {
    if (!set) return;
    if (set.isDropSet && Array.isArray(set.drops) && set.drops.length > 0) {
      set.drops.forEach(d => {
        const w = parseFloat(d.weight) || 0;
        const r = extractFirstNumber(d.reps, 0);
        if (w > maxWeight) maxWeight = w;
        totalVolume += w * r;
        totalReps += r;
        if (w > 0) {
          setWeightSum += w;
          setCount += 1;
        }
        const rm = r <= 1 ? w : w * (1 + r / 30);
        if (rm > best1RM) best1RM = rm;
      });
    } else if (set.isRestPause && Array.isArray(set.segments) && set.segments.length > 0) {
      const w = parseFloat(set.weight) || 0;
      const firstSegReps = extractFirstNumber(set.segments[0]?.reps, 0);
      const sumSegReps = set.segments.reduce((acc, s) => acc + extractFirstNumber(s.reps, 0), 0);
      if (w > maxWeight) maxWeight = w;
      totalVolume += w * sumSegReps;
      totalReps += sumSegReps;
      if (w > 0) {
        setWeightSum += w;
        setCount += 1;
      }
      const rm = firstSegReps <= 1 ? w : w * (1 + firstSegReps / 30);
      if (rm > best1RM) best1RM = rm;
    } else {
      const w = parseFloat(set.weight) || 0;
      const r = extractFirstNumber(set.reps, 0);
      if (w > maxWeight) maxWeight = w;
      totalVolume += w * r;
      totalReps += r;
      if (w > 0) {
        setWeightSum += w;
        setCount += 1;
      }
      const rm = r <= 1 ? w : w * (1 + r / 30);
      if (rm > best1RM) best1RM = rm;
    }
  });

  const avgWeight = setCount > 0 ? Math.round((setWeightSum / setCount) * 10) / 10 : maxWeight;

  return {
    maxWeight,
    avgWeight,
    totalVolume: Math.round(totalVolume * 10) / 10,
    totalReps,
    best1RM: Math.round(best1RM * 10) / 10,
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

  // Real progression evaluation combining weight lifted, reps, 1RM, and volume
  let status = 'same';
  if (
    oneRMDiff > 0.25 ||
    (weightDiff > 0 && repsDiff >= 0) ||
    (weightDiff === 0 && repsDiff > 0) ||
    (volumeDiff > 0 && oneRMDiff >= -0.25)
  ) {
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

const formatSigned = (v, unit = '') => (v > 0 ? `+${v}${unit}` : `${v}${unit}`);

const buildAnalysisText = (sessions, first, latest, overallDelta) => {
  if (!sessions || sessions.length === 0) return '';

  if (sessions.length === 1) {
    return `1ère séance de référence : ${latest.maxWeight} kg max pour ${latest.totalReps} reps totales (volume : ${latest.totalVolume} kg, 1RM estimé : ${latest.best1RM} kg).`;
  }

  const parts = [];
  const prev = sessions[sessions.length - 2];
  const oneRMPct =
    first.best1RM > 0
      ? Math.round(((latest.best1RM - first.best1RM) / first.best1RM) * 1000) / 10
      : 0;

  // 1. Overall evolution from first to latest session
  if (overallDelta.oneRMDiff > 0.25) {
    parts.push(
      `Force estimée (1RM) en hausse de ${formatSigned(overallDelta.oneRMDiff, ' kg')} (${formatSigned(oneRMPct, '%')}) depuis la 1ère séance (${first.best1RM} → ${latest.best1RM} kg).`
    );
  } else if (overallDelta.oneRMDiff < -0.5) {
    parts.push(
      `Force estimée (1RM) en baisse de ${overallDelta.oneRMDiff} kg (${oneRMPct}%) par rapport à la 1ère séance (${first.best1RM} → ${latest.best1RM} kg).`
    );
  } else {
    parts.push(
      `Force estimée (1RM) stable autour de ${latest.best1RM} kg depuis la 1ère séance.`
    );
  }

  // 2. Last session vs previous session (weight + reps + volume)
  if (latest.weightDiff > 0 && latest.repsDiff >= 0) {
    parts.push(
      `Dernière séance : +${latest.weightDiff} kg de charge max avec ${formatSigned(latest.repsDiff, ' reps')} (${formatSigned(latest.volumeDiff, ' kg')} de volume).`
    );
  } else if (latest.weightDiff > 0 && latest.repsDiff < 0) {
    parts.push(
      `Dernière séance : montée en charge (+${latest.weightDiff} kg) avec ${latest.repsDiff} reps (1RM ${formatSigned(latest.oneRMDiff, ' kg')}).`
    );
  } else if (latest.weightDiff === 0 && latest.repsDiff > 0) {
    parts.push(
      `Dernière séance : même charge (${latest.maxWeight} kg) mais +${latest.repsDiff} reps réalisées (+${latest.volumeDiff} kg de volume).`
    );
  } else if (latest.weightDiff < 0 && latest.repsDiff > 0) {
    parts.push(
      `Dernière séance : charge plus légère (${latest.weightDiff} kg) compensée par +${latest.repsDiff} reps (volume ${formatSigned(latest.volumeDiff, ' kg')}).`
    );
  } else if (latest.weightDiff === 0 && latest.repsDiff === 0) {
    parts.push(
      `Dernière séance identique à la précédente (${prev.maxWeight} kg × ${prev.totalReps} reps).`
    );
  } else {
    parts.push(
      `Dernière séance : ${formatSigned(latest.weightDiff, ' kg')} sur la charge max et ${formatSigned(latest.repsDiff, ' reps')} (volume ${formatSigned(latest.volumeDiff, ' kg')}).`
    );
  }

  return parts.join(' ');
};

export const analyzeProgression = (history = [], workoutFilter = 'ALL') => {
  const workoutNamesSet = new Set();
  (history || []).forEach(h => {
    if (h && h.name) workoutNamesSet.add(h.name);
  });

  const filteredHistory = (history || [])
    .map((h, rawIdx) => ({ h, rawIdx }))
    .filter(({ h }) => {
      if (!h) return false;
      if (workoutFilter && workoutFilter !== 'ALL') {
        return h.name === workoutFilter;
      }
      return true;
    });

  const exerciseMap = {};

  filteredHistory.forEach(({ h, rawIdx }) => {
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
          historyId: h.id ? String(h.id) : String(rawIdx),
          date: h.date || '',
          workoutName: h.name || 'Séance',
          isTime: true,
          durationSeconds: dur,
          notes: ex.notes || ''
        });
      } else if (Array.isArray(ex.loggedSets) && ex.loggedSets.length > 0) {
        const metrics = computeSetMetrics(ex.loggedSets);
        exerciseMap[key].rawSessions.push({
          historyId: h.id ? String(h.id) : String(rawIdx),
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
        const overallDurDiff = latest.durationSeconds - first.durationSeconds;
        const analysisText =
          sessions.length === 1
            ? `1ère séance chronométrée : ${Math.floor(latest.durationSeconds / 60)}m ${latest.durationSeconds % 60}s.`
            : `Durée ${overallDurDiff > 0 ? 'en hausse' : overallDurDiff < 0 ? 'en baisse' : 'stable'} (${formatSigned(overallDurDiff, 's')} depuis la 1ère séance).`;

        return {
          key: item.key,
          name: item.name,
          isTime: true,
          sessionCount: sessions.length,
          sessions,
          latest,
          first,
          overallStatus: latest.status,
          analysisText
        };
      }

      const strengthSessions = item.rawSessions.filter(s => !s.isTime);
      const sessions = strengthSessions.map((s, idx) => {
        const prev = idx > 0 ? strengthSessions[idx - 1] : null;
        const delta = computeDelta(s, prev);
        return {
          ...s,
          ...delta
        };
      });

      const bestWeight = Math.max(...sessions.map(s => s.maxWeight));
      const best1RM = Math.max(...sessions.map(s => s.best1RM));
      const bestVolume = Math.max(...sessions.map(s => s.totalVolume));
      const bestReps = Math.max(...sessions.map(s => s.totalReps));

      const latest = sessions[sessions.length - 1];
      const first = sessions[0];
      const overallDelta = computeDelta(latest, sessions.length >= 2 ? first : null);
      const analysisText = buildAnalysisText(sessions, first, latest, overallDelta);

      return {
        key: item.key,
        name: item.name,
        isTime: false,
        sessionCount: sessions.length,
        sessions,
        bestWeight,
        best1RM,
        bestVolume,
        bestReps,
        latest,
        first,
        overallStatus: sessions.length >= 2 ? latest.status : 'first',
        overallDelta,
        analysisText
      };
    });

  exercises.sort((a, b) => b.sessionCount - a.sessionCount || a.name.localeCompare(b.name));

  return {
    workoutNames: Array.from(workoutNamesSet),
    totalSessionsAnalyzed: filteredHistory.length,
    exercises
  };
};
