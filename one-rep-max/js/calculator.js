/**
 * One-Rep Max calculator using multiple established formulas.
 * All formulas take weight lifted and reps performed, return estimated 1RM.
 */

const FORMULAS = {
  epley: {
    name: "Epley",
    calc: (w, r) => (r === 1 ? w : w * (1 + r / 30)),
    description: "Most widely used formula. Tends to overestimate at very high rep ranges.",
  },
  brzycki: {
    name: "Brzycki",
    calc: (w, r) => (r === 1 ? w : w * (36 / (37 - r))),
    description: "Very accurate for 1-10 reps. Most popular alternative to Epley.",
  },
  lander: {
    name: "Lander",
    calc: (w, r) => (r === 1 ? w : (100 * w) / (101.3 - 2.67123 * r)),
    description: "Good accuracy across moderate rep ranges.",
  },
  lombardi: {
    name: "Lombardi",
    calc: (w, r) => (r === 1 ? w : w * Math.pow(r, 0.1)),
    description: "Simple power-based formula. Tends to give conservative estimates.",
  },
  mayhew: {
    name: "Mayhew",
    calc: (w, r) =>
      r === 1
        ? w
        : (100 * w) / (52.2 + 41.9 * Math.exp(-0.055 * r)),
    description: "Exponential model. Good for higher rep ranges (8-15).",
  },
  oconner: {
    name: "O'Conner",
    calc: (w, r) => (r === 1 ? w : w * (1 + r * 0.025)),
    description: "Simple linear model. Conservative estimates.",
  },
  wathan: {
    name: "Wathan",
    calc: (w, r) =>
      r === 1
        ? w
        : (100 * w) / (48.8 + 53.8 * Math.exp(-0.075 * r)),
    description: "Exponential model, often considered most accurate overall.",
  },
};

/**
 * Calculate 1RM using all formulas and return average + individual results.
 */
function calculateOneRepMax(weight, reps) {
  if (weight <= 0 || reps <= 0 || reps > 30) {
    return null;
  }

  if (reps === 1) {
    const result = {
      average: weight,
      formulas: {},
    };
    for (const [key, formula] of Object.entries(FORMULAS)) {
      result.formulas[key] = {
        name: formula.name,
        value: weight,
        description: formula.description,
      };
    }
    return result;
  }

  const results = {};
  let sum = 0;
  let count = 0;

  for (const [key, formula] of Object.entries(FORMULAS)) {
    const value = Math.round(formula.calc(weight, reps));
    results[key] = {
      name: formula.name,
      value: value,
      description: formula.description,
    };
    sum += value;
    count++;
  }

  return {
    average: Math.round(sum / count),
    formulas: results,
  };
}

/**
 * Generate a percentage-based training table from a 1RM.
 */
function generatePercentageTable(oneRepMax) {
  const percentages = [100, 95, 90, 85, 80, 75, 70, 65, 60, 55, 50];
  const repRanges = [1, 2, 3, 5, 6, 8, 10, 12, 15, 18, 20];

  return percentages.map((pct, i) => ({
    percentage: pct,
    weight: Math.round(oneRepMax * (pct / 100)),
    reps: repRanges[i],
    use:
      pct >= 90
        ? "Strength / Peaking"
        : pct >= 75
          ? "Strength / Hypertrophy"
          : pct >= 60
            ? "Hypertrophy / Endurance"
            : "Muscular Endurance",
  }));
}

/**
 * Generate warmup sets for a target working weight.
 */
function generateWarmupSets(workingWeight) {
  const barWeight = 45;
  if (workingWeight <= barWeight) {
    return [{ weight: barWeight, reps: 10, note: "Empty bar" }];
  }

  const sets = [
    { pct: 0, reps: 10, note: "Empty bar" },
    { pct: 0.4, reps: 8, note: "Light warmup" },
    { pct: 0.6, reps: 5, note: "Moderate warmup" },
    { pct: 0.75, reps: 3, note: "Heavy warmup" },
    { pct: 0.85, reps: 1, note: "Final warmup" },
  ];

  return sets
    .map((s) => ({
      weight: s.pct === 0 ? barWeight : roundToNearest(workingWeight * s.pct, 5),
      reps: s.reps,
      note: s.note,
    }))
    .filter((s, i, arr) => {
      if (i === 0) {
        return true;
      }
      return s.weight > arr[i - 1].weight;
    });
}

/**
 * Round to nearest increment (for plate math).
 */
function roundToNearest(value, increment) {
  return Math.round(value / increment) * increment;
}
