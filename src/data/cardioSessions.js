export const cardioSessions = [
  {
    id: 1,
    name: 'Tabata classique (vélo stationnaire)',
    goal: 'Développer la puissance aérobie maximale et la capacité anaérobie.',
    protocol: '8 × (20 s effort maximal / 10 s repos)',
    duration: '15 min (2 blocs de 8 × 20/10 avec 1 min de repos entre les blocs)'
  },
  {
    id: 2,
    name: 'Gibala modifié (vélo stationnaire)',
    goal: 'Améliorer la capacité oxydative et la performance aérobie.',
    protocol: '4 × (30 s all-out / 2 min 30 s récupération active)',
    duration: '15 min'
  },
  {
    id: 3,
    name: '10-20-30 (elliptique)',
    goal: 'Améliorer le VO2max avec un volume réduit.',
    protocol: '2 blocs de 5 min (cycles 30 s faible / 20 s modéré / 10 s intense), 2 min de récupération',
    duration: '15 min'
  },
  {
    id: 4,
    name: 'Intervalles longs 3 × 3 min (stairmaster)',
    goal: 'Maximiser le temps passé au-dessus de 90 % du VO2max.',
    protocol: '3 × (3 min à 85-95 % FCmax / 2 min récupération active)',
    duration: '15 min'
  },
  {
    id: 5,
    name: 'Tabata + 10-20-30 hybride (vélo stationnaire)',
    goal: 'Combiner puissance et endurance.',
    protocol: '4 × (20 s sprint / 10 s repos) + 5 min de 10-20-30',
    duration: '15 min'
  },
  {
    id: 6,
    name: 'Escalier roulant : intervalles progressifs',
    goal: 'Développer la capacité cardiovasculaire avec une montée en intensité.',
    protocol: '3-5 min à niveau modéré, puis 5 × (1 min à niveau élevé / 1 min à niveau faible)',
    duration: '15-17 min'
  },
  {
    id: 7,
    name: 'Elliptique : intervalles courts répétés',
    goal: 'Améliorer la vitesse et la récupération.',
    protocol: '10 × (30 s intense / 30 s récupération)',
    duration: '13 min'
  },
  {
    id: 8,
    name: 'Vélo : pyramide d\'intervalles',
    goal: 'Varier les stimuli pour éviter l\'adaptation.',
    protocol: '1 min intense / 1 min récup → 2 min / 1 min → 3 min / 1 min → 2 min / 1 min → 1 min',
    duration: '15 min'
  },
  {
    id: 9,
    name: 'Stairmaster : intervalles longs fractionnés',
    goal: 'Améliorer l\'endurance cardiovasculaire.',
    protocol: '4 × (2 min à intensité élevée / 1 min récupération active)',
    duration: '15 min'
  },
  {
    id: 10,
    name: 'Séance « récupération active » (elliptique ou vélo)',
    goal: 'Maintenir l\'activité cardiovasculaire sans surcharger le système nerveux.',
    protocol: '12 minutes à intensité modérée (60-70 % FCmax), avec 2 accélérations de 30s',
    duration: '15 min'
  }
];

export const fatigueSessions = {
  A: {
    name: 'Option A – 10-20-30 allégé',
    protocol: '2 blocs de 5 min (cycles 10-20-30), intensité max 70-80 %',
    duration: '15 min',
    advantage: 'Moins stressant pour le système nerveux, mais maintient une variabilité d\'intensité bénéfique.'
  },
  B: {
    name: 'Option B – Intervalles modérés',
    protocol: '6 × (1 min à intensité modérée-élevée / 1 min récupération active)',
    duration: '15 min',
    advantage: 'Facile à exécuter même avec une fatigue accumulée, maintient une FC élevée.'
  }
};
