/**
 * Main application logic -- DOM interactions, rendering, localStorage.
 */

document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("calc-form");
  const resultsSection = document.getElementById("results");
  const unitToggle = document.getElementById("unit-toggle");

  // Load saved preferences
  loadPreferences();

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    calculate();
  });

  // Real-time calculation on input change
  form.addEventListener("input", () => {
    const weight = parseFloat(document.getElementById("weight").value);
    const reps = parseInt(document.getElementById("reps").value, 10);
    if (weight > 0 && reps > 0 && reps <= 30) {
      calculate();
    }
  });

  unitToggle.addEventListener("change", () => {
    savePreferences();
    const weight = parseFloat(document.getElementById("weight").value);
    const reps = parseInt(document.getElementById("reps").value, 10);
    if (weight > 0 && reps > 0) {
      calculate();
    }
  });
});

function calculate() {
  const weight = parseFloat(document.getElementById("weight").value);
  const reps = parseInt(document.getElementById("reps").value, 10);
  const bodyweight = parseFloat(document.getElementById("bodyweight").value);
  const sex = document.getElementById("sex").value;
  const exercise = document.getElementById("exercise").value;
  const unit = document.getElementById("unit-toggle").value;

  if (!weight || !reps || weight <= 0 || reps <= 0 || reps > 30) {
    return;
  }

  const result = calculateOneRepMax(weight, reps);
  if (!result) {
    return;
  }

  savePreferences();
  renderResults(result, bodyweight, sex, exercise, unit);
  document.getElementById("results").classList.remove("hidden");
  document.getElementById("results").scrollIntoView({ behavior: "smooth", block: "nearest" });
}

function renderResults(result, bodyweight, sex, exercise, unit) {
  const unitLabel = unit === "kg" ? "kg" : "lbs";

  // Main 1RM result
  document.getElementById("estimated-1rm").textContent = `${result.average} ${unitLabel}`;

  // Formula breakdown
  const formulaGrid = document.getElementById("formula-breakdown");
  formulaGrid.innerHTML = "";

  for (const [key, data] of Object.entries(result.formulas)) {
    const card = document.createElement("div");
    card.className = "formula-card";
    card.innerHTML = `
      <div class="formula-name">${data.name}</div>
      <div class="formula-value">${data.value} ${unitLabel}</div>
    `;
    card.title = data.description;
    formulaGrid.appendChild(card);
  }

  // Percentage table
  const percentTable = generatePercentageTable(result.average);
  const tbody = document.getElementById("percentage-tbody");
  tbody.innerHTML = "";

  for (const row of percentTable) {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${row.percentage}%</td>
      <td><strong>${row.weight} ${unitLabel}</strong></td>
      <td>${row.reps}</td>
      <td>${row.use}</td>
    `;
    tbody.appendChild(tr);
  }

  // Warmup sets
  const warmupBody = document.getElementById("warmup-tbody");
  warmupBody.innerHTML = "";
  const warmupSets = generateWarmupSets(result.average);

  for (let i = 0; i < warmupSets.length; i++) {
    const set = warmupSets[i];
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${i + 1}</td>
      <td><strong>${set.weight} ${unitLabel}</strong></td>
      <td>${set.reps}</td>
      <td>${set.note}</td>
    `;
    warmupBody.appendChild(tr);
  }

  // Strength standards
  const standardsSection = document.getElementById("strength-standards");
  if (bodyweight > 0 && sex && exercise) {
    const strengthResult = getStrengthLevel(sex, exercise, bodyweight, result.average);
    if (strengthResult) {
      renderStrengthStandards(strengthResult, result.average, bodyweight, unitLabel);
      standardsSection.classList.remove("hidden");
    } else {
      standardsSection.classList.add("hidden");
    }
  } else {
    standardsSection.classList.add("hidden");
  }
}

function renderStrengthStandards(strengthResult, oneRepMax, bodyweight, unitLabel) {
  // Level badge
  const levelBadge = document.getElementById("strength-level");
  levelBadge.textContent = strengthResult.level;
  levelBadge.className = `level-badge level-${strengthResult.levelIndex}`;

  // Percentile
  document.getElementById("strength-percentile").textContent =
    `Stronger than approximately ${strengthResult.percentile}% of lifters at your bodyweight.`;

  // Description
  document.getElementById("strength-description").textContent = strengthResult.description;

  // Standards bar chart
  const barsContainer = document.getElementById("standards-bars");
  barsContainer.innerHTML = "";

  const maxStandard = strengthResult.standards[strengthResult.standards.length - 1];
  const chartMax = Math.max(maxStandard, oneRepMax) * 1.1;

  for (let i = 0; i < LEVEL_LABELS.length; i++) {
    const standard = strengthResult.standards[i];
    const barRow = document.createElement("div");
    barRow.className = "bar-row";

    const isCurrentLevel = i === strengthResult.levelIndex;

    barRow.innerHTML = `
      <div class="bar-label">${LEVEL_LABELS[i]}</div>
      <div class="bar-track">
        <div class="bar-fill level-bg-${i}" style="width: ${(standard / chartMax) * 100}%">
          <span class="bar-value">${standard} ${unitLabel}</span>
        </div>
        ${isCurrentLevel ? `<div class="bar-marker" style="left: ${(oneRepMax / chartMax) * 100}%" title="Your 1RM: ${oneRepMax} ${unitLabel}"></div>` : ""}
      </div>
    `;
    barsContainer.appendChild(barRow);
  }
}

function savePreferences() {
  const prefs = {
    sex: document.getElementById("sex").value,
    exercise: document.getElementById("exercise").value,
    unit: document.getElementById("unit-toggle").value,
    bodyweight: document.getElementById("bodyweight").value,
  };
  try {
    localStorage.setItem("orm_prefs", JSON.stringify(prefs));
  } catch (e) {
    // localStorage not available
  }
}

function loadPreferences() {
  try {
    const prefs = JSON.parse(localStorage.getItem("orm_prefs"));
    if (prefs) {
      if (prefs.sex) {
        document.getElementById("sex").value = prefs.sex;
      }
      if (prefs.exercise) {
        document.getElementById("exercise").value = prefs.exercise;
      }
      if (prefs.unit) {
        document.getElementById("unit-toggle").value = prefs.unit;
      }
      if (prefs.bodyweight) {
        document.getElementById("bodyweight").value = prefs.bodyweight;
      }
    }
  } catch (e) {
    // localStorage not available
  }
}
