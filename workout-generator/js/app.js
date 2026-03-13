// App - UI Controller
(function() {
  "use strict";

  // DOM elements
  const form = document.getElementById("workout-form");
  const muscleGroupSelect = document.getElementById("muscle-group");
  const injuryInput = document.getElementById("injury-text");
  const experienceSelect = document.getElementById("experience");
  const generateBtn = document.getElementById("generate-btn");
  const resultsSection = document.getElementById("results");
  const injuryCard = document.getElementById("injury-card");
  const injuryList = document.getElementById("injury-list");
  const adviceList = document.getElementById("advice-list");
  const warmupBody = document.getElementById("warmup-body");
  const workoutBody = document.getElementById("workout-body");
  const warningCard = document.getElementById("warning-card");
  const regenerateBtn = document.getElementById("regenerate-btn");
  const printBtn = document.getElementById("print-btn");
  const planTitle = document.getElementById("plan-title");
  const planSubtitle = document.getElementById("plan-subtitle");

  // LocalStorage keys
  const STORAGE_KEYS = {
    muscleGroup: "wg_muscleGroup",
    experience: "wg_experience",
    injuryText: "wg_injuryText"
  };

  // Load saved preferences
  function loadPreferences() {
    const savedGroup = localStorage.getItem(STORAGE_KEYS.muscleGroup);
    const savedExperience = localStorage.getItem(STORAGE_KEYS.experience);
    const savedInjury = localStorage.getItem(STORAGE_KEYS.injuryText);

    if (savedGroup) {
      muscleGroupSelect.value = savedGroup;
    }
    if (savedExperience) {
      experienceSelect.value = savedExperience;
    }
    if (savedInjury) {
      injuryInput.value = savedInjury;
    }
  }

  // Save preferences
  function savePreferences() {
    localStorage.setItem(STORAGE_KEYS.muscleGroup, muscleGroupSelect.value);
    localStorage.setItem(STORAGE_KEYS.experience, experienceSelect.value);
    localStorage.setItem(STORAGE_KEYS.injuryText, injuryInput.value);
  }

  // Render injury info card
  function renderInjuryCard(injuryInfo) {
    if (injuryInfo.matchedInjuries.length === 0) {
      injuryCard.classList.add("hidden");
      return;
    }

    injuryCard.classList.remove("hidden");

    injuryList.innerHTML = injuryInfo.matchedInjuries
      .map(i => `<span class="injury-tag">${i.label}</span>`)
      .join("");

    adviceList.innerHTML = injuryInfo.adviceList
      .map(a => `<li><strong>${a.label}:</strong> ${a.advice}</li>`)
      .join("");
  }

  // Render warmup table
  function renderWarmups(warmups) {
    if (warmups.length === 0) {
      warmupBody.innerHTML = '<tr><td colspan="3" class="empty-state">No safe warmups available for this combination.</td></tr>';
      return;
    }

    warmupBody.innerHTML = warmups.map(w => `
      <tr>
        <td>${w.name}</td>
        <td>${w.defaultReps}</td>
        <td>${w.notes}</td>
      </tr>
    `).join("");
  }

  // Render workout table
  function renderExercises(exercises) {
    if (exercises.length === 0) {
      workoutBody.innerHTML = '<tr><td colspan="5" class="empty-state">No safe exercises available.</td></tr>';
      return;
    }

    workoutBody.innerHTML = exercises.map(e => `
      <tr>
        <td>
          ${e.name}
          ${e.type === "compound" ? '<span class="badge badge-compound">Compound</span>' : ""}
          ${e.equipment !== "none" ? '<span class="badge badge-equipment">' + e.equipment + '</span>' : ""}
        </td>
        <td>${e.programSets}</td>
        <td>${e.programReps}</td>
        <td>${e.programRest}s</td>
        <td>${e.notes}</td>
      </tr>
    `).join("");
  }

  // Render warning card
  function renderWarning(showWarning) {
    if (showWarning) {
      warningCard.classList.remove("hidden");
    } else {
      warningCard.classList.add("hidden");
    }
  }

  // Main generate handler
  function handleGenerate(e) {
    if (e) {
      e.preventDefault();
    }

    const muscleGroup = muscleGroupSelect.value;
    const injuryText = injuryInput.value;
    const experience = experienceSelect.value;

    if (!muscleGroup) {
      muscleGroupSelect.focus();
      return;
    }

    savePreferences();

    const result = generateWorkout(muscleGroup, injuryText, experience);

    // Update title
    planTitle.textContent = `${result.muscleGroupLabel} Workout`;
    planSubtitle.textContent = `${result.experienceLabel} Level${result.injuryInfo.matchedInjuries.length > 0 ? " - Injury-Adapted" : ""}`;

    // Render sections
    renderInjuryCard(result.injuryInfo);
    renderWarning(result.warning);
    renderWarmups(result.warmups);
    renderExercises(result.exercises);

    // Show results
    resultsSection.classList.remove("hidden");

    // Smooth scroll to results
    resultsSection.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  // Event listeners
  form.addEventListener("submit", handleGenerate);

  regenerateBtn.addEventListener("click", function() {
    handleGenerate(null);
    resultsSection.scrollIntoView({ behavior: "smooth", block: "start" });
  });

  printBtn.addEventListener("click", function() {
    window.print();
  });

  // Load preferences on page load
  loadPreferences();
})();
