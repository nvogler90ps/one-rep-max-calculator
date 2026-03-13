(function () {
  'use strict';

  // ===== State =====
  var state = {
    units: 'imperial',
    gender: 'male',
    activity: 1.55,
    formula: 'mifflin',
    macroGoal: 'maintenance',
    macroSplit: 'balanced',
    proteinPct: 30,
    carbsPct: 40,
    fatPct: 30,
    tdee: 0,
    bmr: 0
  };

  var activityMultipliers = {
    sedentary: 1.2,
    light: 1.375,
    moderate: 1.55,
    very: 1.725,
    extra: 1.9
  };

  // Splits shown as (carbs/protein/fat) in the UI
  var macroPresets = {
    balanced:    { carbs: 40, protein: 30, fat: 30 },
    lowcarb:     { carbs: 25, protein: 45, fat: 30 },
    highprotein: { carbs: 20, protein: 40, fat: 40 },
    keto:        { carbs: 5,  protein: 25, fat: 70 }
  };

  // ===== DOM refs =====
  var $ = function (sel) { return document.querySelector(sel); };
  var $$ = function (sel) { return document.querySelectorAll(sel); };

  // ===== Unit Toggle =====
  function initUnitToggle() {
    var btns = $$('#unit-toggle button');
    btns.forEach(function (btn) {
      btn.addEventListener('click', function () {
        btns.forEach(function (b) { b.classList.remove('active'); });
        btn.classList.add('active');
        state.units = btn.dataset.unit;
        updateUnitLabels();
        localStorage.setItem('tdee-units', state.units);
      });
    });

    var saved = localStorage.getItem('tdee-units');
    if (saved) {
      state.units = saved;
      btns.forEach(function (b) {
        b.classList.toggle('active', b.dataset.unit === saved);
      });
    }
    updateUnitLabels();
  }

  function updateUnitLabels() {
    var imperial = state.units === 'imperial';
    $('#height-group').style.display = imperial ? 'flex' : 'none';
    $('#height-cm-group').style.display = imperial ? 'none' : 'block';
    $('#weight-label').textContent = imperial ? 'Weight (lbs)' : 'Weight (kg)';
    $('#weight-input').placeholder = imperial ? 'e.g. 170' : 'e.g. 77';
  }

  // ===== Gender Toggle =====
  function initGenderToggle() {
    var btns = $$('.gender-toggle button');
    btns.forEach(function (btn) {
      btn.addEventListener('click', function () {
        btns.forEach(function (b) { b.classList.remove('active'); });
        btn.classList.add('active');
        state.gender = btn.dataset.gender;
      });
    });
  }

  // ===== Activity Level =====
  function initActivityOptions() {
    var options = $$('.activity-option');
    options.forEach(function (opt) {
      opt.addEventListener('click', function () {
        options.forEach(function (o) { o.classList.remove('active'); });
        opt.classList.add('active');
        state.activity = activityMultipliers[opt.dataset.level];
      });
    });
  }

  // ===== Formula Select =====
  function initFormulaSelect() {
    var sel = $('#formula-select');
    sel.addEventListener('change', function () {
      state.formula = sel.value;
      var bfRow = $('#bodyfat-row');
      if (state.formula === 'katch') {
        bfRow.style.display = 'flex';
      } else {
        bfRow.style.display = 'flex'; // always show, it's optional
      }
    });
  }

  // ===== Calculation =====
  function getInputValues() {
    var age = parseInt($('#age-input').value, 10);
    var weight, heightCm;

    if (state.units === 'imperial') {
      weight = parseFloat($('#weight-input').value) * 0.453592; // lbs to kg
      var ft = parseInt($('#height-ft').value, 10) || 0;
      var inches = parseInt($('#height-in').value, 10) || 0;
      heightCm = (ft * 12 + inches) * 2.54;
    } else {
      weight = parseFloat($('#weight-input').value); // already kg
      heightCm = parseFloat($('#height-cm').value);
    }

    var bodyFat = parseFloat($('#bodyfat-input').value);

    return { age: age, weight: weight, heightCm: heightCm, bodyFat: bodyFat };
  }

  function calcBMR(vals) {
    if (state.formula === 'katch' && !isNaN(vals.bodyFat)) {
      var leanMass = vals.weight * (1 - vals.bodyFat / 100);
      return 370 + (21.6 * leanMass);
    } else if (state.formula === 'harris') {
      if (state.gender === 'male') {
        return 88.362 + (13.397 * vals.weight) + (4.799 * vals.heightCm) - (5.677 * vals.age);
      } else {
        return 447.593 + (9.247 * vals.weight) + (3.098 * vals.heightCm) - (4.330 * vals.age);
      }
    } else {
      // Mifflin-St Jeor (default)
      if (state.gender === 'male') {
        return (10 * vals.weight) + (6.25 * vals.heightCm) - (5 * vals.age) + 5;
      } else {
        return (10 * vals.weight) + (6.25 * vals.heightCm) - (5 * vals.age) - 161;
      }
    }
  }

  function calculate() {
    var vals = getInputValues();

    if (isNaN(vals.age) || vals.age < 1 || isNaN(vals.weight) || vals.weight < 1 || isNaN(vals.heightCm) || vals.heightCm < 1) {
      return;
    }

    if (state.formula === 'katch' && isNaN(vals.bodyFat)) {
      return;
    }

    state.bmr = Math.round(calcBMR(vals));
    state.tdee = Math.round(state.bmr * state.activity);

    // Show results
    $('#results').classList.add('visible');
    $('#bmr-value').textContent = state.bmr.toLocaleString();
    $('#tdee-value').textContent = state.tdee.toLocaleString();

    // Lean mass
    var leanBox = $('#lean-mass-box');
    if (!isNaN(vals.bodyFat) && vals.bodyFat > 0) {
      var leanMassKg = vals.weight * (1 - vals.bodyFat / 100);
      var leanDisplay;
      if (state.units === 'imperial') {
        leanDisplay = Math.round(leanMassKg / 0.453592) + ' lbs';
      } else {
        leanDisplay = Math.round(leanMassKg) + ' kg';
      }
      $('#lean-mass-value').textContent = leanDisplay;
      leanBox.style.display = 'block';
    } else {
      leanBox.style.display = 'none';
    }

    updateCalorieGoals();
    updateMacros();

    // Scroll to results
    $('#results').scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  // ===== Calorie Goals =====
  function updateCalorieGoals() {
    var goals = [
      { label: 'Aggressive Loss', delta: -750, cls: 'loss' },
      { label: 'Weight Loss', delta: -500, cls: 'loss' },
      { label: 'Mild Loss', delta: -250, cls: 'loss' },
      { label: 'Maintain', delta: 0, cls: 'maintain' },
      { label: 'Mild Gain', delta: 250, cls: 'gain' },
      { label: 'Muscle Gain', delta: 500, cls: 'gain' }
    ];

    var container = $('#calorie-goals');
    container.innerHTML = '';

    goals.forEach(function (g) {
      var cal = state.tdee + g.delta;
      var div = document.createElement('div');
      div.className = 'calorie-goal ' + g.cls;

      var deltaText = '';
      if (g.delta < 0) {
        deltaText = g.delta + ' cal/day';
      } else if (g.delta > 0) {
        deltaText = '+' + g.delta + ' cal/day';
      } else {
        deltaText = 'no change';
      }

      div.innerHTML =
        '<div class="goal-label">' + g.label + '</div>' +
        '<div class="goal-value">' + cal.toLocaleString() + '</div>' +
        '<div class="goal-delta">' + deltaText + '</div>';
      container.appendChild(div);
    });
  }

  // ===== Macro Calculator =====
  function initMacroControls() {
    var goalSel = $('#macro-goal');
    var splitSel = $('#macro-split');

    goalSel.addEventListener('change', function () {
      state.macroGoal = goalSel.value;
      updateMacros();
    });

    splitSel.addEventListener('change', function () {
      state.macroSplit = splitSel.value;
      if (splitSel.value === 'custom') {
        $('#custom-sliders').style.display = 'block';
      } else {
        $('#custom-sliders').style.display = 'none';
        var preset = macroPresets[splitSel.value];
        state.proteinPct = preset.protein;
        state.carbsPct = preset.carbs;
        state.fatPct = preset.fat;
        updateSliderDisplay();
      }
      updateMacros();
    });

    // Sliders
    ['protein', 'carbs', 'fat'].forEach(function (macro) {
      var slider = $('#slider-' + macro);
      slider.addEventListener('input', function () {
        state[macro + 'Pct'] = parseInt(slider.value, 10);
        updateSliderDisplay();
        updateMacros();
      });
    });
  }

  function updateSliderDisplay() {
    $('#slider-protein').value = state.proteinPct;
    $('#slider-carbs').value = state.carbsPct;
    $('#slider-fat').value = state.fatPct;
    $('#pct-protein').textContent = state.proteinPct + '%';
    $('#pct-carbs').textContent = state.carbsPct + '%';
    $('#pct-fat').textContent = state.fatPct + '%';

    var total = state.proteinPct + state.carbsPct + state.fatPct;
    var warning = $('#macro-total-warning');
    if (total !== 100) {
      warning.textContent = 'Percentages total ' + total + '% (should be 100%)';
      warning.classList.add('visible');
    } else {
      warning.classList.remove('visible');
    }
  }

  function updateMacros() {
    if (state.tdee === 0) { return; }

    // Determine target calories based on goal
    var targetCal;
    switch (state.macroGoal) {
      case 'cutting':    targetCal = state.tdee - 500; break;
      case 'bulking':    targetCal = state.tdee + 500; break;
      case 'highprotein': targetCal = state.tdee; break;
      default:           targetCal = state.tdee; break;
    }

    // If goal is high protein, override split
    var pPct = state.proteinPct;
    var cPct = state.carbsPct;
    var fPct = state.fatPct;

    if (state.macroGoal === 'highprotein' && state.macroSplit !== 'custom') {
      pPct = 40; cPct = 30; fPct = 30;
    }

    var proteinCal = targetCal * (pPct / 100);
    var carbsCal = targetCal * (cPct / 100);
    var fatCal = targetCal * (fPct / 100);

    var proteinG = Math.round(proteinCal / 4);
    var carbsG = Math.round(carbsCal / 4);
    var fatG = Math.round(fatCal / 9);

    $('#macro-protein-g').textContent = proteinG + 'g';
    $('#macro-protein-cal').textContent = Math.round(proteinCal) + ' cal';
    $('#macro-carbs-g').textContent = carbsG + 'g';
    $('#macro-carbs-cal').textContent = Math.round(carbsCal) + ' cal';
    $('#macro-fat-g').textContent = fatG + 'g';
    $('#macro-fat-cal').textContent = Math.round(fatCal) + ' cal';
    $('#macro-target-cal').textContent = targetCal.toLocaleString();
  }

  // ===== Collapsible =====
  function initCollapsible() {
    var headers = $$('.collapsible-header');
    headers.forEach(function (header) {
      header.addEventListener('click', function () {
        header.classList.toggle('open');
        var body = header.nextElementSibling;
        body.classList.toggle('open');
      });
    });
  }

  // ===== Init =====
  function init() {
    initUnitToggle();
    initGenderToggle();
    initActivityOptions();
    initFormulaSelect();
    initMacroControls();
    initCollapsible();
    updateSliderDisplay();

    $('#btn-calculate').addEventListener('click', calculate);

    // Allow Enter key to trigger calculation
    var inputs = $$('#calculator-form input, #calculator-form select');
    inputs.forEach(function (input) {
      input.addEventListener('keydown', function (e) {
        if (e.key === 'Enter') {
          e.preventDefault();
          calculate();
        }
      });
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
