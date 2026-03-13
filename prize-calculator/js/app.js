/* ========================================
   Horse Racing Prize Money Calculator
   ======================================== */

(function () {
  'use strict';

  // Race data with realistic position splits
  var races = {
    'kentucky-derby': {
      name: 'Kentucky Derby',
      purse: 5000000,
      currency: 'USD',
      splits: [0.60, 0.20, 0.10, 0.05, 0.03, 0.02]
    },
    'preakness': {
      name: 'Preakness Stakes',
      purse: 2000000,
      currency: 'USD',
      splits: [0.60, 0.20, 0.10, 0.05, 0.03, 0.02]
    },
    'belmont': {
      name: 'Belmont Stakes',
      purse: 2000000,
      currency: 'USD',
      splits: [0.60, 0.20, 0.10, 0.05, 0.03, 0.02]
    },
    'breeders-cup': {
      name: "Breeders' Cup Classic",
      purse: 7000000,
      currency: 'USD',
      splits: [0.60, 0.20, 0.10, 0.05, 0.03, 0.02]
    },
    'dubai-world-cup': {
      name: 'Dubai World Cup',
      purse: 12000000,
      currency: 'USD',
      splits: [0.60, 0.20, 0.10, 0.05, 0.03, 0.02]
    },
    'cheltenham': {
      name: 'Cheltenham Gold Cup',
      purse: 625000,
      currency: 'GBP',
      splits: [0.5694, 0.2139, 0.1069, 0.0535, 0.0284, 0.0279]
    },
    'royal-ascot': {
      name: 'Royal Ascot Gold Cup',
      purse: 600000,
      currency: 'GBP',
      splits: [0.5694, 0.2139, 0.1069, 0.0535, 0.0284, 0.0279]
    },
    'prix-arc': {
      name: "Prix de l'Arc de Triomphe",
      purse: 5000000,
      currency: 'EUR',
      splits: [0.5714, 0.2286, 0.1143, 0.0571, 0.0286]
    },
    'melbourne-cup': {
      name: 'Melbourne Cup',
      purse: 8000000,
      currency: 'AUD',
      splits: [0.60, 0.15, 0.075, 0.05, 0.035, 0.02, 0.02, 0.01, 0.01, 0.01, 0.01, 0.01]
    },
    'japan-cup': {
      name: 'Japan Cup',
      purse: 700000000,
      currency: 'JPY',
      splits: [0.5143, 0.2057, 0.1286, 0.0771, 0.0514, 0.0229]
    }
  };

  // Position labels
  var positionLabels = ['1st', '2nd', '3rd', '4th', '5th', '6th', '7th', '8th', '9th', '10th', '11th', '12th'];
  var positionClasses = ['first', 'second', 'third', '', '', '', '', '', '', '', '', ''];

  // Default stakeholder splits
  var ownerPct = 80;
  var trainerPct = 10;
  var jockeyPct = 10;

  // DOM elements
  var raceSelect = document.getElementById('race-select');
  var customPurseGroup = document.getElementById('custom-purse-group');
  var customPurseInput = document.getElementById('custom-purse');
  var customCurrency = document.getElementById('custom-currency');
  var positionBreakdown = document.getElementById('position-breakdown');
  var winnerTotal = document.getElementById('winner-total');
  var stakeholderSplits = document.getElementById('stakeholder-splits');
  var comparisonBody = document.getElementById('comparison-body');
  var ownerSlider = document.getElementById('owner-pct');
  var trainerSlider = document.getElementById('trainer-pct');
  var jockeySlider = document.getElementById('jockey-pct');
  var ownerLabel = document.getElementById('owner-pct-label');
  var trainerLabel = document.getElementById('trainer-pct-label');
  var jockeyLabel = document.getElementById('jockey-pct-label');
  var splitWarning = document.getElementById('split-warning');

  // Currency formatting
  function formatCurrency(amount, currency) {
    if (currency === 'JPY') {
      return 'JPY' + Math.round(amount).toLocaleString('en-US');
    }
    var symbols = {
      'USD': '$',
      'GBP': 'GBP',
      'EUR': 'EUR',
      'AUD': 'A$'
    };
    var symbol = symbols[currency] || currency;
    if (currency === 'GBP' || currency === 'EUR') {
      return symbol + Math.round(amount).toLocaleString('en-US');
    }
    return symbol + Math.round(amount).toLocaleString('en-US');
  }

  // Format purse for comparison table (shorter)
  function formatPurseShort(amount, currency) {
    if (currency === 'JPY') {
      if (amount >= 100000000) {
        return 'JPY' + (amount / 100000000).toFixed(0) + '00M';
      }
      return 'JPY' + Math.round(amount).toLocaleString('en-US');
    }
    var symbols = {
      'USD': '$',
      'GBP': 'GBP',
      'EUR': 'EUR',
      'AUD': 'A$'
    };
    var symbol = symbols[currency] || currency;
    if (amount >= 1000000) {
      return symbol + (amount / 1000000).toFixed(1).replace(/\.0$/, '') + 'M';
    }
    if (amount >= 1000) {
      return symbol + (amount / 1000).toFixed(0) + 'K';
    }
    return symbol + Math.round(amount).toLocaleString('en-US');
  }

  // Get current race data
  function getCurrentRace() {
    var key = raceSelect.value;
    if (key === 'custom') {
      var purse = parseFloat(customPurseInput.value) || 0;
      var currency = customCurrency.value;
      return {
        name: 'Custom Race',
        purse: purse,
        currency: currency,
        splits: [0.60, 0.20, 0.10, 0.05, 0.03, 0.02]
      };
    }
    return races[key];
  }

  // Render position breakdown
  function renderPositions(race) {
    var html = '';
    for (var i = 0; i < race.splits.length; i++) {
      var amount = race.purse * race.splits[i];
      var cls = positionClasses[i] || '';
      html += '<div class="position-row ' + cls + '">';
      html += '<div><span class="position-label">' + positionLabels[i] + '</span>';
      html += '<span class="position-pct">(' + (race.splits[i] * 100).toFixed(1) + '%)</span></div>';
      html += '<span class="position-amount">' + formatCurrency(amount, race.currency) + '</span>';
      html += '</div>';
    }
    positionBreakdown.innerHTML = html;
  }

  // Render winner total and stakeholder splits
  function renderStakeholders(race) {
    var winnerAmount = race.purse * race.splits[0];

    // Winner total
    winnerTotal.innerHTML =
      '<div class="label">1st Place Prize</div>' +
      '<div class="amount">' + formatCurrency(winnerAmount, race.currency) + '</div>';

    // Stakeholder cards
    var total = ownerPct + trainerPct + jockeyPct;
    var ownerAmt, trainerAmt, jockeyAmt;

    if (total > 0) {
      ownerAmt = winnerAmount * (ownerPct / 100);
      trainerAmt = winnerAmount * (trainerPct / 100);
      jockeyAmt = winnerAmount * (jockeyPct / 100);
    } else {
      ownerAmt = 0;
      trainerAmt = 0;
      jockeyAmt = 0;
    }

    stakeholderSplits.innerHTML =
      '<div class="split-card">' +
        '<div class="role">Owner</div>' +
        '<div class="pct">' + ownerPct + '%</div>' +
        '<div class="amount">' + formatCurrency(ownerAmt, race.currency) + '</div>' +
      '</div>' +
      '<div class="split-card">' +
        '<div class="role">Trainer</div>' +
        '<div class="pct">' + trainerPct + '%</div>' +
        '<div class="amount">' + formatCurrency(trainerAmt, race.currency) + '</div>' +
      '</div>' +
      '<div class="split-card">' +
        '<div class="role">Jockey</div>' +
        '<div class="pct">' + jockeyPct + '%</div>' +
        '<div class="amount">' + formatCurrency(jockeyAmt, race.currency) + '</div>' +
      '</div>';
  }

  // Render comparison table
  function renderComparisonTable(activeKey) {
    var html = '';
    var keys = Object.keys(races);
    for (var i = 0; i < keys.length; i++) {
      var key = keys[i];
      var race = races[key];
      var winnerShare = race.purse * race.splits[0];
      var rowClass = (key === activeKey) ? ' class="active-row"' : '';
      html += '<tr' + rowClass + '>';
      html += '<td class="race-name">' + race.name + '</td>';
      html += '<td class="amount">' + formatPurseShort(race.purse, race.currency) + '</td>';
      html += '<td class="amount">' + formatPurseShort(winnerShare, race.currency) + '</td>';
      html += '<td class="currency-col">' + race.currency + '</td>';
      html += '</tr>';
    }
    comparisonBody.innerHTML = html;
  }

  // Update split warning
  function updateSplitWarning() {
    var total = ownerPct + trainerPct + jockeyPct;
    if (total === 100) {
      splitWarning.textContent = 'Total: 100% -- valid split';
      splitWarning.className = 'split-warning ok';
    } else {
      splitWarning.textContent = 'Total: ' + total + '% -- must equal 100%';
      splitWarning.className = 'split-warning error';
    }
  }

  // Full recalculate
  function recalculate() {
    var race = getCurrentRace();
    var activeKey = raceSelect.value;

    renderPositions(race);
    renderStakeholders(race);
    renderComparisonTable(activeKey === 'custom' ? null : activeKey);
    updateSplitWarning();
  }

  // Event: race selector change
  raceSelect.addEventListener('change', function () {
    if (raceSelect.value === 'custom') {
      customPurseGroup.style.display = '';
    } else {
      customPurseGroup.style.display = 'none';
    }
    recalculate();
  });

  // Event: custom purse input
  customPurseInput.addEventListener('input', function () {
    recalculate();
  });

  customCurrency.addEventListener('change', function () {
    recalculate();
  });

  // Event: split sliders
  function handleSliderChange(slider, labelEl, setter) {
    slider.addEventListener('input', function () {
      var val = parseInt(slider.value, 10);
      labelEl.textContent = val + '%';
      setter(val);
      recalculate();
    });
  }

  handleSliderChange(ownerSlider, ownerLabel, function (v) { ownerPct = v; });
  handleSliderChange(trainerSlider, trainerLabel, function (v) { trainerPct = v; });
  handleSliderChange(jockeySlider, jockeyLabel, function (v) { jockeyPct = v; });

  // Initial render
  recalculate();

})();
