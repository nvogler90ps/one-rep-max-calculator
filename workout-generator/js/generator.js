// Workout Generator Algorithm

const EXPERIENCE_PROFILES = {
  beginner: { sets: 3, repsLow: 12, repsHigh: 15, restSeconds: 60, label: "Beginner" },
  intermediate: { sets: [3, 4], repsLow: 8, repsHigh: 12, restSeconds: 90, label: "Intermediate" },
  advanced: { sets: 4, repsLow: 6, repsHigh: 10, restSeconds: 120, label: "Advanced" }
};

/**
 * Parse free-text injury description and match to known injuries.
 * Returns { matchedInjuries: [], contraindicationTags: Set, adviceList: [] }
 */
function parseInjuries(text) {
  const result = {
    matchedInjuries: [],
    contraindicationTags: new Set(),
    adviceList: []
  };

  if (!text || text.trim().length === 0) {
    return result;
  }

  const lowerText = text.toLowerCase();

  for (const injury of INJURIES) {
    for (const keyword of injury.keywords) {
      if (lowerText.includes(keyword)) {
        if (!result.matchedInjuries.find(i => i.id === injury.id)) {
          result.matchedInjuries.push(injury);
          injury.contraindicationTags.forEach(tag => result.contraindicationTags.add(tag));
          result.adviceList.push({ label: injury.label, advice: injury.advice });
        }
        break;
      }
    }
  }

  return result;
}

/**
 * Filter exercises by muscle group, removing contraindicated ones.
 * Returns { warmups: [], exercises: [], warning: bool }
 */
function filterExercises(muscleGroup, contraindicationTags) {
  const tagSet = contraindicationTags instanceof Set ? contraindicationTags : new Set(contraindicationTags);

  const allForGroup = EXERCISES.filter(e => e.muscleGroup === muscleGroup);

  const safeWarmups = allForGroup.filter(e =>
    e.isWarmup && !e.contraindications.some(c => tagSet.has(c))
  );

  const safeExercises = allForGroup.filter(e =>
    !e.isWarmup && !e.contraindications.some(c => tagSet.has(c))
  );

  return {
    warmups: safeWarmups,
    exercises: safeExercises,
    warning: safeExercises.length < 3
  };
}

/**
 * Shuffle array in place (Fisher-Yates).
 */
function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/**
 * Sort exercises by number of contraindications (fewer = safer first).
 */
function sortBySafety(exercises) {
  return [...exercises].sort((a, b) => a.contraindications.length - b.contraindications.length);
}

/**
 * Pick warmup exercises: 3-4 from available safe warmups.
 */
function pickWarmups(safeWarmups) {
  const count = Math.min(safeWarmups.length, Math.random() < 0.5 ? 3 : 4);
  return shuffle(safeWarmups).slice(0, count);
}

/**
 * Pick workout exercises: 1-2 compound + 2-3 isolation = 4-6 total.
 * Prefer exercises with fewer contraindications (safer).
 */
function pickExercises(safeExercises) {
  const compounds = sortBySafety(safeExercises.filter(e => e.type === "compound"));
  const isolations = sortBySafety(safeExercises.filter(e => e.type === "isolation"));

  // Randomize within safety tiers
  const shuffledCompounds = shuffleWithinSafetyTiers(compounds);
  const shuffledIsolations = shuffleWithinSafetyTiers(isolations);

  // Pick 1-2 compound
  const compoundCount = shuffledCompounds.length >= 2 ? (Math.random() < 0.6 ? 2 : 1) : shuffledCompounds.length;
  const selectedCompounds = shuffledCompounds.slice(0, compoundCount);

  // Pick 2-3 isolation
  const isolationCount = shuffledIsolations.length >= 3 ? (Math.random() < 0.5 ? 3 : 2) : shuffledIsolations.length;
  const selectedIsolations = shuffledIsolations.slice(0, isolationCount);

  // If we still do not have enough, fill from the other type
  let selected = [...selectedCompounds, ...selectedIsolations];
  if (selected.length < 4) {
    const remaining = safeExercises.filter(e => !selected.includes(e));
    const extra = shuffle(remaining).slice(0, 4 - selected.length);
    selected = [...selected, ...extra];
  }

  return selected;
}

/**
 * Shuffle exercises that share the same contraindication count.
 */
function shuffleWithinSafetyTiers(sortedExercises) {
  if (sortedExercises.length <= 1) {
    return sortedExercises;
  }

  const tiers = [];
  let currentTier = [sortedExercises[0]];

  for (let i = 1; i < sortedExercises.length; i++) {
    if (sortedExercises[i].contraindications.length === sortedExercises[i - 1].contraindications.length) {
      currentTier.push(sortedExercises[i]);
    } else {
      tiers.push(currentTier);
      currentTier = [sortedExercises[i]];
    }
  }
  tiers.push(currentTier);

  return tiers.flatMap(tier => shuffle(tier));
}

/**
 * Apply experience-level sets/reps/rest to selected exercises.
 */
function applyExperienceProfile(exercises, experience) {
  const profile = EXPERIENCE_PROFILES[experience];

  return exercises.map(ex => {
    let sets;
    if (Array.isArray(profile.sets)) {
      sets = profile.sets[Math.floor(Math.random() * profile.sets.length)];
    } else {
      sets = profile.sets;
    }

    const reps = `${profile.repsLow}-${profile.repsHigh}`;
    const rest = profile.restSeconds;

    return {
      ...ex,
      programSets: sets,
      programReps: reps,
      programRest: rest
    };
  });
}

/**
 * Main generator function.
 * Returns { warmups, exercises, injuryInfo, warning, muscleGroupLabel, experienceLabel }
 */
function generateWorkout(muscleGroup, injuryText, experience) {
  const injuryInfo = parseInjuries(injuryText);
  const { warmups: safeWarmups, exercises: safeExercises, warning } = filterExercises(muscleGroup, injuryInfo.contraindicationTags);

  const selectedWarmups = pickWarmups(safeWarmups);
  const selectedExercises = pickExercises(safeExercises);
  const programmedExercises = applyExperienceProfile(selectedExercises, experience);

  return {
    warmups: selectedWarmups,
    exercises: programmedExercises,
    injuryInfo,
    warning,
    muscleGroupLabel: MUSCLE_GROUPS[muscleGroup],
    experienceLabel: EXPERIENCE_PROFILES[experience].label
  };
}
