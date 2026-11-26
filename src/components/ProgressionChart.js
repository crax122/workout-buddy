import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import Svg, { Line, Polyline, Circle, Text as SvgText, Rect } from 'react-native-svg';

const METRICS = [
  { key: 'best1RM', label: '1RM est.', unit: 'kg' },
  { key: 'maxWeight', label: 'Poids max', unit: 'kg' },
  { key: 'totalVolume', label: 'Volume', unit: 'kg' }
];

export default function ProgressionChart({ exercise }) {
  const [metric, setMetric] = useState('best1RM');

  if (!exercise || !Array.isArray(exercise.sessions) || exercise.sessions.length === 0) {
    return null;
  }

  const sessions = exercise.sessions;
  const isTime = exercise.isTime;
  const isAlt = exercise.isAlternating && !isTime;

  const activeMetric = isTime
    ? { key: 'durationMins', label: 'Durée', unit: 'min' }
    : METRICS.find(m => m.key === metric) || METRICS[0];

  const pointsData = sessions.map((s, idx) => {
    const val = isTime
      ? Math.round(((s.durationSeconds || 0) / 60) * 10) / 10
      : Number(s[activeMetric.key] || 0);
    return {
      idx,
      val,
      date: s.date || `#${idx + 1}`,
      bucket: s.repRangeBucket || null
    };
  });

  const values = pointsData.map(p => p.val);
  const rawMin = Math.min(...values);
  const rawMax = Math.max(...values);
  const paddingRange = rawMax === rawMin ? Math.max(5, rawMax * 0.15) : (rawMax - rawMin) * 0.2;
  const minY = Math.max(0, Math.floor((rawMin - paddingRange) * 10) / 10);
  const maxY = Math.ceil((rawMax + paddingRange) * 10) / 10;
  const rangeY = maxY - minY || 1;

  const W = 320;
  const H = 135;
  const padL = 38;
  const padR = 16;
  const padT = 18;
  const padB = 26;
  const plotW = W - padL - padR;
  const plotH = H - padT - padB;

  const getX = (idx) => {
    if (pointsData.length === 1) return padL + plotW / 2;
    return padL + (idx / (pointsData.length - 1)) * plotW;
  };

  const getY = (val) => {
    return padT + plotH - ((val - minY) / rangeY) * plotH;
  };

  const coords = pointsData.map((p, idx) => ({
    ...p,
    x: getX(idx),
    y: getY(p.val)
  }));

  const polylinePoints = coords.map(c => `${c.x.toFixed(1)},${c.y.toFixed(1)}`).join(' ');

  // Separate lines for 6-8 and 10-12 when alternating so both progression curves are visible
  const coords68 = isAlt ? coords.filter(c => c.bucket === '6-8') : [];
  const coords1012 = isAlt ? coords.filter(c => c.bucket === '10-12') : [];

  const yTicks = [minY, Math.round(((minY + maxY) / 2) * 10) / 10, maxY];

  // Show up to 4 evenly spaced x-axis labels so text never overlaps
  const labelIndices = new Set();
  if (coords.length <= 4) {
    coords.forEach((_, i) => labelIndices.add(i));
  } else {
    labelIndices.add(0);
    labelIndices.add(Math.floor((coords.length - 1) / 3));
    labelIndices.add(Math.floor(((coords.length - 1) * 2) / 3));
    labelIndices.add(coords.length - 1);
  }

  return (
    <View style={styles.chartCard}>
      <View style={styles.chartHeader}>
        <Text style={styles.chartTitle}>
          📊 Graphique ({activeMetric.label})
        </Text>
        {!isTime && (
          <View style={styles.metricToggle}>
            {METRICS.map(m => (
              <TouchableOpacity
                key={m.key}
                style={[styles.metricBtn, metric === m.key && styles.metricBtnActive]}
                onPress={() => setMetric(m.key)}
              >
                <Text style={[styles.metricBtnTxt, metric === m.key && styles.metricBtnTxtActive]}>
                  {m.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </View>

      {isAlt && (
        <View style={styles.legendRow}>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: '#ff9800' }]} />
            <Text style={styles.legendTxt}>6-8 reps</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: '#0bc0af' }]} />
            <Text style={styles.legendTxt}>10-12 reps</Text>
          </View>
        </View>
      )}

      <View style={styles.svgWrapper}>
        <Svg width="100%" height={145} viewBox={`0 0 ${W} ${H}`}>
          <Rect x={padL} y={padT} width={plotW} height={plotH} fill="#fafafa" rx={4} />

          {yTicks.map((tick, i) => {
            const ty = getY(tick);
            return (
              <React.Fragment key={i}>
                <Line
                  x1={padL}
                  y1={ty}
                  x2={W - padR}
                  y2={ty}
                  stroke="#e0e0e0"
                  strokeWidth="1"
                  strokeDasharray="3,3"
                />
                <SvgText
                  x={padL - 5}
                  y={ty + 3}
                  fontSize="9"
                  fill="#777"
                  textAnchor="end"
                >
                  {tick}
                </SvgText>
              </React.Fragment>
            );
          })}

          {!isAlt && coords.length > 1 && (
            <Polyline
              points={polylinePoints}
              fill="none"
              stroke="#673ab7"
              strokeWidth="2.5"
              strokeLinejoin="round"
            />
          )}

          {isAlt && coords.length > 1 && (
            <Polyline
              points={polylinePoints}
              fill="none"
              stroke="#d1c4e9"
              strokeWidth="1.5"
              strokeDasharray="3,3"
            />
          )}

          {isAlt && coords68.length > 1 && (
            <Polyline
              points={coords68.map(c => `${c.x.toFixed(1)},${c.y.toFixed(1)}`).join(' ')}
              fill="none"
              stroke="#ff9800"
              strokeWidth="2.5"
              strokeLinejoin="round"
            />
          )}

          {isAlt && coords1012.length > 1 && (
            <Polyline
              points={coords1012.map(c => `${c.x.toFixed(1)},${c.y.toFixed(1)}`).join(' ')}
              fill="none"
              stroke="#0bc0af"
              strokeWidth="2.5"
              strokeLinejoin="round"
            />
          )}

          {coords.map((c, idx) => {
            const dotColor = isAlt
              ? c.bucket === '6-8'
                ? '#ff9800'
                : '#0bc0af'
              : '#673ab7';
            const showVal = coords.length <= 7 || idx === 0 || idx === coords.length - 1 || idx % 2 === 0;
            return (
              <React.Fragment key={idx}>
                <Circle
                  cx={c.x}
                  cy={c.y}
                  r="4"
                  fill={dotColor}
                  stroke="#fff"
                  strokeWidth="1.5"
                />
                {showVal && (
                  <SvgText
                    x={c.x}
                    y={c.y - 7}
                    fontSize="9"
                    fontWeight="bold"
                    fill="#1b2a47"
                    textAnchor="middle"
                  >
                    {c.val}
                  </SvgText>
                )}
                {labelIndices.has(idx) && (
                  <SvgText
                    x={c.x}
                    y={H - 6}
                    fontSize="8.5"
                    fill="#666"
                    textAnchor="middle"
                  >
                    {c.date.length > 8 ? c.date.slice(0, 5) : c.date}
                  </SvgText>
                )}
              </React.Fragment>
            );
          })}
        </Svg>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  chartCard: {
    backgroundColor: '#f8f6fc',
    borderRadius: 10,
    padding: 10,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#e1d5f7'
  },
  chartHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 6
  },
  chartTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#4a148c'
  },
  metricToggle: {
    flexDirection: 'row',
    gap: 4
  },
  metricBtn: {
    paddingVertical: 3,
    paddingHorizontal: 7,
    borderRadius: 8,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#d1c4e9'
  },
  metricBtnActive: {
    backgroundColor: '#673ab7',
    borderColor: '#673ab7'
  },
  metricBtnTxt: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#555'
  },
  metricBtnTxtActive: {
    color: '#fff'
  },
  legendRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 4
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4
  },
  legendTxt: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#444'
  },
  svgWrapper: {
    width: '100%',
    alignItems: 'center'
  }
});
