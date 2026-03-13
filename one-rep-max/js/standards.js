/**
 * Strength standards data based on publicly available population benchmarks.
 * Categories: Beginner (<6mo), Novice (6-12mo), Intermediate (1-3yr), Advanced (3-5yr), Elite (5+yr)
 * Values are multipliers of bodyweight for a 1RM.
 * Sources: publicly available strength standard tables (ExRx, symmetric strength, etc.)
 */

const STRENGTH_STANDARDS = {
  male: {
    bench_press: {
      label: "Bench Press",
      standards: [
        { bw: 114, levels: [0.55, 0.85, 1.15, 1.45, 1.75] },
        { bw: 123, levels: [0.55, 0.85, 1.10, 1.40, 1.70] },
        { bw: 132, levels: [0.55, 0.80, 1.10, 1.35, 1.65] },
        { bw: 148, levels: [0.50, 0.80, 1.05, 1.30, 1.60] },
        { bw: 165, levels: [0.50, 0.75, 1.00, 1.30, 1.55] },
        { bw: 181, levels: [0.50, 0.75, 1.00, 1.25, 1.50] },
        { bw: 198, levels: [0.45, 0.70, 0.95, 1.20, 1.50] },
        { bw: 220, levels: [0.45, 0.70, 0.95, 1.20, 1.45] },
        { bw: 242, levels: [0.45, 0.65, 0.90, 1.15, 1.40] },
        { bw: 275, levels: [0.40, 0.65, 0.85, 1.10, 1.35] },
        { bw: 319, levels: [0.40, 0.60, 0.80, 1.05, 1.30] },
      ],
    },
    squat: {
      label: "Squat",
      standards: [
        { bw: 114, levels: [0.70, 1.05, 1.40, 1.80, 2.20] },
        { bw: 123, levels: [0.70, 1.00, 1.35, 1.75, 2.15] },
        { bw: 132, levels: [0.65, 1.00, 1.35, 1.70, 2.10] },
        { bw: 148, levels: [0.65, 0.95, 1.30, 1.65, 2.00] },
        { bw: 165, levels: [0.60, 0.95, 1.25, 1.60, 1.95] },
        { bw: 181, levels: [0.60, 0.90, 1.20, 1.55, 1.90] },
        { bw: 198, levels: [0.55, 0.85, 1.15, 1.50, 1.85] },
        { bw: 220, levels: [0.55, 0.85, 1.15, 1.50, 1.80] },
        { bw: 242, levels: [0.55, 0.80, 1.10, 1.45, 1.75] },
        { bw: 275, levels: [0.50, 0.75, 1.05, 1.40, 1.70] },
        { bw: 319, levels: [0.50, 0.75, 1.00, 1.35, 1.65] },
      ],
    },
    deadlift: {
      label: "Deadlift",
      standards: [
        { bw: 114, levels: [0.85, 1.25, 1.65, 2.10, 2.55] },
        { bw: 123, levels: [0.80, 1.20, 1.60, 2.05, 2.50] },
        { bw: 132, levels: [0.80, 1.15, 1.55, 2.00, 2.40] },
        { bw: 148, levels: [0.75, 1.10, 1.50, 1.90, 2.30] },
        { bw: 165, levels: [0.75, 1.10, 1.45, 1.85, 2.25] },
        { bw: 181, levels: [0.70, 1.05, 1.40, 1.80, 2.20] },
        { bw: 198, levels: [0.70, 1.00, 1.35, 1.75, 2.15] },
        { bw: 220, levels: [0.65, 1.00, 1.35, 1.70, 2.10] },
        { bw: 242, levels: [0.65, 0.95, 1.30, 1.65, 2.00] },
        { bw: 275, levels: [0.60, 0.90, 1.20, 1.60, 1.95] },
        { bw: 319, levels: [0.60, 0.85, 1.15, 1.55, 1.90] },
      ],
    },
    overhead_press: {
      label: "Overhead Press",
      standards: [
        { bw: 114, levels: [0.35, 0.55, 0.75, 0.95, 1.15] },
        { bw: 123, levels: [0.35, 0.55, 0.70, 0.90, 1.10] },
        { bw: 132, levels: [0.35, 0.50, 0.70, 0.90, 1.10] },
        { bw: 148, levels: [0.30, 0.50, 0.65, 0.85, 1.05] },
        { bw: 165, levels: [0.30, 0.50, 0.65, 0.85, 1.00] },
        { bw: 181, levels: [0.30, 0.45, 0.65, 0.80, 1.00] },
        { bw: 198, levels: [0.30, 0.45, 0.60, 0.80, 0.95] },
        { bw: 220, levels: [0.25, 0.45, 0.60, 0.75, 0.95] },
        { bw: 242, levels: [0.25, 0.40, 0.55, 0.75, 0.90] },
        { bw: 275, levels: [0.25, 0.40, 0.55, 0.70, 0.85] },
        { bw: 319, levels: [0.25, 0.40, 0.50, 0.65, 0.85] },
      ],
    },
    barbell_row: {
      label: "Barbell Row",
      standards: [
        { bw: 114, levels: [0.40, 0.60, 0.85, 1.10, 1.35] },
        { bw: 123, levels: [0.40, 0.60, 0.80, 1.05, 1.30] },
        { bw: 132, levels: [0.40, 0.55, 0.80, 1.05, 1.25] },
        { bw: 148, levels: [0.35, 0.55, 0.75, 1.00, 1.20] },
        { bw: 165, levels: [0.35, 0.55, 0.75, 0.95, 1.15] },
        { bw: 181, levels: [0.35, 0.50, 0.70, 0.95, 1.15] },
        { bw: 198, levels: [0.30, 0.50, 0.70, 0.90, 1.10] },
        { bw: 220, levels: [0.30, 0.50, 0.65, 0.90, 1.10] },
        { bw: 242, levels: [0.30, 0.45, 0.65, 0.85, 1.05] },
        { bw: 275, levels: [0.30, 0.45, 0.60, 0.80, 1.00] },
        { bw: 319, levels: [0.25, 0.40, 0.55, 0.75, 0.95] },
      ],
    },
  },
  female: {
    bench_press: {
      label: "Bench Press",
      standards: [
        { bw: 97, levels: [0.30, 0.45, 0.65, 0.85, 1.05] },
        { bw: 105, levels: [0.25, 0.45, 0.60, 0.80, 1.00] },
        { bw: 114, levels: [0.25, 0.40, 0.60, 0.75, 0.95] },
        { bw: 123, levels: [0.25, 0.40, 0.55, 0.75, 0.90] },
        { bw: 132, levels: [0.25, 0.40, 0.55, 0.70, 0.90] },
        { bw: 148, levels: [0.20, 0.35, 0.50, 0.65, 0.85] },
        { bw: 165, levels: [0.20, 0.35, 0.50, 0.65, 0.80] },
        { bw: 181, levels: [0.20, 0.35, 0.45, 0.60, 0.75] },
        { bw: 198, levels: [0.20, 0.30, 0.45, 0.55, 0.75] },
      ],
    },
    squat: {
      label: "Squat",
      standards: [
        { bw: 97, levels: [0.45, 0.70, 1.00, 1.30, 1.60] },
        { bw: 105, levels: [0.45, 0.65, 0.95, 1.25, 1.55] },
        { bw: 114, levels: [0.40, 0.65, 0.90, 1.20, 1.50] },
        { bw: 123, levels: [0.40, 0.60, 0.85, 1.15, 1.45] },
        { bw: 132, levels: [0.40, 0.60, 0.85, 1.10, 1.40] },
        { bw: 148, levels: [0.35, 0.55, 0.80, 1.05, 1.30] },
        { bw: 165, levels: [0.35, 0.55, 0.75, 1.00, 1.25] },
        { bw: 181, levels: [0.35, 0.50, 0.70, 0.95, 1.20] },
        { bw: 198, levels: [0.30, 0.50, 0.70, 0.90, 1.15] },
      ],
    },
    deadlift: {
      label: "Deadlift",
      standards: [
        { bw: 97, levels: [0.55, 0.85, 1.20, 1.55, 1.90] },
        { bw: 105, levels: [0.55, 0.80, 1.15, 1.50, 1.85] },
        { bw: 114, levels: [0.50, 0.80, 1.10, 1.45, 1.75] },
        { bw: 123, levels: [0.50, 0.75, 1.05, 1.40, 1.70] },
        { bw: 132, levels: [0.50, 0.75, 1.05, 1.35, 1.65] },
        { bw: 148, levels: [0.45, 0.70, 0.95, 1.25, 1.55] },
        { bw: 165, levels: [0.45, 0.65, 0.90, 1.20, 1.50] },
        { bw: 181, levels: [0.40, 0.60, 0.85, 1.15, 1.45] },
        { bw: 198, levels: [0.40, 0.60, 0.85, 1.10, 1.40] },
      ],
    },
    overhead_press: {
      label: "Overhead Press",
      standards: [
        { bw: 97, levels: [0.20, 0.35, 0.50, 0.65, 0.80] },
        { bw: 105, levels: [0.20, 0.30, 0.45, 0.60, 0.75] },
        { bw: 114, levels: [0.20, 0.30, 0.45, 0.60, 0.70] },
        { bw: 123, levels: [0.15, 0.30, 0.40, 0.55, 0.70] },
        { bw: 132, levels: [0.15, 0.30, 0.40, 0.55, 0.65] },
        { bw: 148, levels: [0.15, 0.25, 0.35, 0.50, 0.60] },
        { bw: 165, levels: [0.15, 0.25, 0.35, 0.45, 0.60] },
        { bw: 181, levels: [0.15, 0.25, 0.35, 0.45, 0.55] },
        { bw: 198, levels: [0.10, 0.20, 0.30, 0.40, 0.55] },
      ],
    },
    barbell_row: {
      label: "Barbell Row",
      standards: [
        { bw: 97, levels: [0.25, 0.40, 0.55, 0.75, 0.95] },
        { bw: 105, levels: [0.25, 0.35, 0.55, 0.70, 0.90] },
        { bw: 114, levels: [0.25, 0.35, 0.50, 0.70, 0.85] },
        { bw: 123, levels: [0.20, 0.35, 0.50, 0.65, 0.85] },
        { bw: 132, levels: [0.20, 0.35, 0.50, 0.65, 0.80] },
        { bw: 148, levels: [0.20, 0.30, 0.45, 0.60, 0.75] },
        { bw: 165, levels: [0.20, 0.30, 0.45, 0.55, 0.70] },
        { bw: 181, levels: [0.15, 0.30, 0.40, 0.55, 0.70] },
        { bw: 198, levels: [0.15, 0.25, 0.40, 0.50, 0.65] },
      ],
    },
  },
};

const LEVEL_LABELS = ["Beginner", "Novice", "Intermediate", "Advanced", "Elite"];
const LEVEL_DESCRIPTIONS = [
  "Stronger than 5% of lifters. Expected for someone who has just started lifting.",
  "Stronger than 20% of lifters. Typical after several months of consistent training.",
  "Stronger than 50% of lifters. Typical after 1-3 years of dedicated training.",
  "Stronger than 80% of lifters. Competitive at local level. 3-5+ years of serious training.",
  "Stronger than 95% of lifters. Competitive at regional/national level. 5+ years of dedicated training.",
];

/**
 * Interpolate strength standard for a given bodyweight.
 * Uses linear interpolation between the two nearest weight classes.
 */
function getStandardMultipliers(sex, exercise, bodyweight) {
  const data = STRENGTH_STANDARDS[sex]?.[exercise];
  if (!data) {
    return null;
  }

  const entries = data.standards;

  if (bodyweight <= entries[0].bw) {
    return entries[0].levels;
  }
  if (bodyweight >= entries[entries.length - 1].bw) {
    return entries[entries.length - 1].levels;
  }

  for (let i = 0; i < entries.length - 1; i++) {
    if (bodyweight >= entries[i].bw && bodyweight <= entries[i + 1].bw) {
      const ratio =
        (bodyweight - entries[i].bw) / (entries[i + 1].bw - entries[i].bw);
      return entries[i].levels.map(
        (val, idx) => val + ratio * (entries[i + 1].levels[idx] - val)
      );
    }
  }

  return entries[0].levels;
}

/**
 * Determine the user's strength level and percentile estimate.
 */
function getStrengthLevel(sex, exercise, bodyweight, oneRepMax) {
  const multipliers = getStandardMultipliers(sex, exercise, bodyweight);
  if (!multipliers) {
    return null;
  }

  const standards = multipliers.map((m) => Math.round(m * bodyweight));
  let levelIndex = 0;

  for (let i = 0; i < standards.length; i++) {
    if (oneRepMax >= standards[i]) {
      levelIndex = i;
    }
  }

  // Estimate percentile within the level
  const percentileRanges = [5, 20, 50, 80, 95];
  let percentile;

  if (oneRepMax < standards[0]) {
    percentile = Math.round((oneRepMax / standards[0]) * percentileRanges[0]);
  } else if (levelIndex >= standards.length - 1) {
    percentile = percentileRanges[percentileRanges.length - 1];
  } else {
    const lowerWeight = standards[levelIndex];
    const upperWeight = standards[levelIndex + 1];
    const lowerPct = percentileRanges[levelIndex];
    const upperPct = percentileRanges[levelIndex + 1];
    const ratio = (oneRepMax - lowerWeight) / (upperWeight - lowerWeight);
    percentile = Math.round(lowerPct + ratio * (upperPct - lowerPct));
  }

  return {
    level: LEVEL_LABELS[levelIndex],
    levelIndex: levelIndex,
    description: LEVEL_DESCRIPTIONS[levelIndex],
    percentile: Math.min(99, Math.max(1, percentile)),
    standards: standards,
  };
}
