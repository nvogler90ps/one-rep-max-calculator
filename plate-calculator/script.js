/* ========================================
   Plate Calculator - Logic
   ======================================== */

(function () {
  "use strict";

  // ---- Plate definitions ----

  var PLATES_LBS = [45, 35, 25, 10, 5, 2.5];
  var PLATES_KG = [20, 15, 10, 5, 2.5, 1.25];

  // Competition colors keyed by lbs value
  var PLATE_COLORS = {
    45: "#3b6fdb",   // blue
    35: "#d4a82a",   // yellow
    25: "#3aad5c",   // green
    10: "#e0e0e0",   // white
    5: "#d44040",    // red
    2.5: "#8a8a8a",  // gray
    // kg equivalents
    20: "#3b6fdb",
    15: "#d4a82a",
    1.25: "#8a8a8a"
  };

  // Bar options: { lbs, kg }
  var BAR_OPTIONS = [
    { lbs: 45, kg: 20, label: "Standard" },
    { lbs: 35, kg: 15, label: "Women's" },
    { lbs: 33, kg: 15, label: "Training" }
  ];

  // ---- State ----

  var state = {
    unit: "lbs",
    barLbs: 45,
    barKg: 20,
    targetWeight: 135,
    availablePlates: {} // keyed by lbs value, true/false
  };

  // Default: all plates available
  PLATES_LBS.forEach(function (p) {
    state.availablePlates[p] = true;
  });

  // ---- DOM refs ----

  var elTargetWeight = document.getElementById("target-weight");
  var elUnitLabel = document.getElementById("unit-label");
  var elBarSelect = document.getElementById("bar-select");
  var elBtnLbs = document.getElementById("btn-lbs");
  var elBtnKg = document.getElementById("btn-kg");
  var elBtnMinus = document.getElementById("btn-minus");
  var elBtnPlus = document.getElementById("btn-plus");
  var elWeightMessage = document.getElementById("weight-message");
  var elPlateSummary = document.getElementById("plate-summary");
  var elBarbellSvg = document.getElementById("barbell-svg");
  var elPlatesGrid = document.getElementById("plates-grid");
  var elWarmupSets = document.getElementById("warmup-sets");

  // ---- Unit helpers ----

  function lbsToKg(lbs) {
    return Math.round(lbs / 2.20462 * 100) / 100;
  }

  function kgToLbs(kg) {
    return Math.round(kg * 2.20462 * 100) / 100;
  }

  function getBarWeight() {
    return state.unit === "lbs" ? state.barLbs : state.barKg;
  }

  function getPlateList() {
    return state.unit === "lbs" ? PLATES_LBS : PLATES_KG;
  }

  function plateDisplayValue(plateLbs) {
    if (state.unit === "lbs") {
      return plateLbs % 1 === 0 ? plateLbs.toString() : plateLbs.toFixed(1);
    }
    var kg = lbsToKg(plateLbs);
    // Round to standard kg values
    var kgPlates = PLATES_KG;
    var closest = kgPlates.reduce(function (prev, curr) {
      return Math.abs(curr - kg) < Math.abs(prev - kg) ? curr : prev;
    });
    return closest % 1 === 0 ? closest.toString() : closest.toFixed(2);
  }

  function getAvailablePlatesForCalc() {
    var plates = getPlateList();
    var available = [];
    // Map between lbs plate index and kg plate index
    for (var i = 0; i < PLATES_LBS.length; i++) {
      if (state.availablePlates[PLATES_LBS[i]]) {
        available.push(plates[i]);
      }
    }
    return available.sort(function (a, b) { return b - a; });
  }

  // ---- Plate calculation (greedy) ----

  function calculatePlates(targetTotal) {
    var barWeight = getBarWeight();
    if (targetTotal < barWeight) {
      return { plates: [], perSide: 0, actual: barWeight, remainder: 0, belowBar: true };
    }

    var remaining = targetTotal - barWeight;
    var perSide = remaining / 2;
    var available = getAvailablePlatesForCalc();
    var plates = [];
    var loaded = 0;

    for (var i = 0; i < available.length; i++) {
      while (loaded + available[i] <= perSide + 0.001) {
        plates.push(available[i]);
        loaded += available[i];
      }
    }

    var actualPerSide = Math.round(loaded * 100) / 100;
    var actualTotal = Math.round((barWeight + actualPerSide * 2) * 100) / 100;
    var remainder = Math.round((targetTotal - actualTotal) * 100) / 100;

    return {
      plates: plates,
      perSide: actualPerSide,
      actual: actualTotal,
      remainder: remainder,
      belowBar: false
    };
  }

  // ---- SVG barbell drawing ----

  function getPlateColor(plateValue) {
    // Map plate value to its color
    if (PLATE_COLORS[plateValue]) {
      return PLATE_COLORS[plateValue];
    }
    // Fallback: try rounding
    var rounded = Math.round(plateValue * 10) / 10;
    if (PLATE_COLORS[rounded]) {
      return PLATE_COLORS[rounded];
    }
    return "#8a8a8a";
  }

  function getPlateHeight(plateValue) {
    // Taller plates for heavier weights
    var plates = getPlateList();
    var maxPlate = plates[0];
    var ratio = plateValue / maxPlate;
    var minH = 40;
    var maxH = 130;
    return minH + ratio * (maxH - minH);
  }

  function getPlateWidth(plateValue) {
    var plates = getPlateList();
    var maxPlate = plates[0];
    var ratio = plateValue / maxPlate;
    return Math.max(10, 8 + ratio * 14);
  }

  function drawBarbell(svgEl, plates, compact) {
    var svgNS = "http://www.w3.org/2000/svg";
    svgEl.innerHTML = "";

    var viewW = compact ? 600 : 700;
    var viewH = compact ? 140 : 200;
    svgEl.setAttribute("viewBox", "0 0 " + viewW + " " + viewH);

    var midY = viewH / 2;
    var barH = compact ? 8 : 10;
    var collarW = compact ? 10 : 12;
    var sleeveW = compact ? 6 : 8;

    // Calculate total plate width to ensure they fit
    var totalPlateW = 0;
    for (var p = 0; p < plates.length; p++) {
      totalPlateW += getPlateWidth(plates[p]) + 2;
    }

    var barStart = 20;
    var barEnd = viewW - 20;
    var barMid = viewW / 2;

    // Draw bar (full horizontal line)
    var bar = document.createElementNS(svgNS, "rect");
    bar.setAttribute("x", barStart);
    bar.setAttribute("y", midY - barH / 2);
    bar.setAttribute("width", barEnd - barStart);
    bar.setAttribute("height", barH);
    bar.setAttribute("rx", barH / 2);
    bar.setAttribute("fill", "#6b7280");
    svgEl.appendChild(bar);

    // Center knurling
    var knurlW = compact ? 60 : 80;
    var knurl = document.createElementNS(svgNS, "rect");
    knurl.setAttribute("x", barMid - knurlW / 2);
    knurl.setAttribute("y", midY - barH / 2 - 1);
    knurl.setAttribute("width", knurlW);
    knurl.setAttribute("height", barH + 2);
    knurl.setAttribute("rx", 2);
    knurl.setAttribute("fill", "#9ca3af");
    svgEl.appendChild(knurl);

    // Draw collars and plates on each side
    drawSide(svgEl, svgNS, plates, barMid - knurlW / 2 - 10, midY, barH, collarW, sleeveW, -1, compact);
    drawSide(svgEl, svgNS, plates, barMid + knurlW / 2 + 10, midY, barH, collarW, sleeveW, 1, compact);

    // Sleeve ends (small circles)
    var endR = compact ? 5 : 6;
    var leftEnd = document.createElementNS(svgNS, "circle");
    leftEnd.setAttribute("cx", barStart + endR);
    leftEnd.setAttribute("cy", midY);
    leftEnd.setAttribute("r", endR);
    leftEnd.setAttribute("fill", "#9ca3af");
    svgEl.appendChild(leftEnd);

    var rightEnd = document.createElementNS(svgNS, "circle");
    rightEnd.setAttribute("cx", barEnd - endR);
    rightEnd.setAttribute("cy", midY);
    rightEnd.setAttribute("r", endR);
    rightEnd.setAttribute("fill", "#9ca3af");
    svgEl.appendChild(rightEnd);
  }

  function drawSide(svgEl, svgNS, plates, startX, midY, barH, collarW, sleeveW, direction, compact) {
    // Collar
    var collarH = compact ? 20 : 26;
    var cx = direction === -1 ? startX - collarW : startX;
    var collar = document.createElementNS(svgNS, "rect");
    collar.setAttribute("x", cx);
    collar.setAttribute("y", midY - collarH / 2);
    collar.setAttribute("width", collarW);
    collar.setAttribute("height", collarH);
    collar.setAttribute("rx", 2);
    collar.setAttribute("fill", "#9ca3af");
    svgEl.appendChild(collar);

    // Plates (largest closest to collar)
    var offset = direction === -1 ? cx - 3 : cx + collarW + 3;

    for (var i = 0; i < plates.length; i++) {
      var pw = getPlateWidth(plates[i]);
      var ph = getPlateHeight(plates[i]);
      var scaleFactor = compact ? 0.75 : 1;
      ph = ph * scaleFactor;

      var px = direction === -1 ? offset - pw : offset;

      var plateRect = document.createElementNS(svgNS, "rect");
      plateRect.setAttribute("x", px);
      plateRect.setAttribute("y", midY - ph / 2);
      plateRect.setAttribute("width", pw);
      plateRect.setAttribute("height", ph);
      plateRect.setAttribute("rx", 2);
      plateRect.setAttribute("fill", getPlateColor(plates[i]));
      plateRect.setAttribute("stroke", "rgba(0,0,0,0.3)");
      plateRect.setAttribute("stroke-width", "1");
      svgEl.appendChild(plateRect);

      // Plate label (only for non-compact or large plates)
      if (!compact || ph > 50) {
        var label = document.createElementNS(svgNS, "text");
        label.setAttribute("x", px + pw / 2);
        label.setAttribute("y", midY + 3);
        label.setAttribute("text-anchor", "middle");
        label.setAttribute("dominant-baseline", "middle");
        label.setAttribute("fill", plates[i] === 10 || (state.unit === "kg" && plates[i] === 5) ? "#333" : "#fff");
        label.setAttribute("font-size", compact ? "7" : "9");
        label.setAttribute("font-weight", "600");
        label.setAttribute("font-family", "sans-serif");

        var val = plates[i];
        label.textContent = val % 1 === 0 ? val.toString() : val.toFixed(1);
        svgEl.appendChild(label);
      }

      offset = direction === -1 ? px - 2 : px + pw + 2;
    }
  }

  // ---- Render plates checkboxes ----

  function renderPlatesGrid() {
    elPlatesGrid.innerHTML = "";

    for (var i = 0; i < PLATES_LBS.length; i++) {
      var lbsVal = PLATES_LBS[i];
      var kgVal = PLATES_KG[i];
      var checked = state.availablePlates[lbsVal];

      var displayText = state.unit === "lbs"
        ? (lbsVal % 1 === 0 ? lbsVal : lbsVal.toFixed(1))
        : (kgVal % 1 === 0 ? kgVal : kgVal.toFixed(2));

      var label = document.createElement("label");
      label.className = "plate-checkbox" + (checked ? " checked" : "");
      label.dataset.plate = lbsVal;

      var input = document.createElement("input");
      input.type = "checkbox";
      input.checked = checked;

      var dot = document.createElement("div");
      dot.className = "plate-dot";
      dot.style.backgroundColor = getPlateColor(state.unit === "lbs" ? lbsVal : kgVal);

      var span = document.createElement("span");
      span.textContent = displayText;

      var checkIcon = document.createElement("div");
      checkIcon.className = "plate-check-icon";

      label.appendChild(input);
      label.appendChild(dot);
      label.appendChild(span);
      label.appendChild(checkIcon);

      (function (plateKey, lbl, inp) {
        lbl.addEventListener("click", function (e) {
          e.preventDefault();
          state.availablePlates[plateKey] = !state.availablePlates[plateKey];
          inp.checked = state.availablePlates[plateKey];
          if (state.availablePlates[plateKey]) {
            lbl.classList.add("checked");
          } else {
            lbl.classList.remove("checked");
          }
          update();
        });
      })(lbsVal, label, input);

      elPlatesGrid.appendChild(label);
    }
  }

  // ---- Warmup ramp ----

  function generateWarmupSets(workingWeight) {
    var barWeight = getBarWeight();
    if (workingWeight <= barWeight) {
      return [{ weight: barWeight, label: "Working Set", isWorking: true }];
    }

    var sets = [];
    var percentages = [0, 0.4, 0.6, 0.75, 0.9];

    // Filter out sets that would be below bar weight or too close together
    var prevWeight = -1;
    for (var i = 0; i < percentages.length; i++) {
      var raw = workingWeight * percentages[i];
      if (raw < barWeight) {
        raw = barWeight;
      }

      // Round to nearest achievable weight
      var result = calculatePlates(raw);
      var w = result.actual;

      if (w !== prevWeight && w < workingWeight) {
        sets.push({
          weight: w,
          label: "Warmup " + (sets.length + 1),
          isWorking: false,
          plates: result.plates
        });
        prevWeight = w;
      }
    }

    // Add working set
    var workResult = calculatePlates(workingWeight);
    sets.push({
      weight: workResult.actual,
      label: "Working Set",
      isWorking: true,
      plates: workResult.plates
    });

    return sets;
  }

  function renderWarmupSets() {
    elWarmupSets.innerHTML = "";
    var sets = generateWarmupSets(state.targetWeight);
    var unitStr = state.unit;

    for (var i = 0; i < sets.length; i++) {
      var set = sets[i];
      var card = document.createElement("div");
      card.className = "warmup-card";

      var header = document.createElement("div");
      header.className = "warmup-card-header";

      var labelEl = document.createElement("span");
      labelEl.className = "warmup-set-label" + (set.isWorking ? " working" : "");
      labelEl.textContent = set.label;

      var weightEl = document.createElement("span");
      weightEl.className = "warmup-weight";
      weightEl.textContent = formatWeight(set.weight) + " " + unitStr;

      header.appendChild(labelEl);
      header.appendChild(weightEl);
      card.appendChild(header);

      // Plate text summary
      if (set.plates && set.plates.length > 0) {
        var platesText = document.createElement("div");
        platesText.className = "warmup-plates-text";
        platesText.textContent = "Per side: " + summarizePlates(set.plates);
        card.appendChild(platesText);
      } else {
        var emptyText = document.createElement("div");
        emptyText.className = "warmup-plates-text";
        emptyText.textContent = "Empty bar";
        card.appendChild(emptyText);
      }

      // Mini barbell SVG
      var svgContainer = document.createElement("div");
      svgContainer.className = "warmup-barbell-container";
      var svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
      svg.setAttribute("viewBox", "0 0 600 140");
      svg.setAttribute("preserveAspectRatio", "xMidYMid meet");
      drawBarbell(svg, set.plates || [], true);
      svgContainer.appendChild(svg);
      card.appendChild(svgContainer);

      elWarmupSets.appendChild(card);
    }
  }

  function summarizePlates(plates) {
    if (plates.length === 0) {
      return "none";
    }
    var counts = {};
    for (var i = 0; i < plates.length; i++) {
      var key = plates[i];
      counts[key] = (counts[key] || 0) + 1;
    }
    var parts = [];
    var keys = Object.keys(counts).sort(function (a, b) { return parseFloat(b) - parseFloat(a); });
    for (var j = 0; j < keys.length; j++) {
      var val = parseFloat(keys[j]);
      var display = val % 1 === 0 ? val.toString() : val.toFixed(val < 1 ? 2 : 1);
      if (counts[keys[j]] > 1) {
        parts.push(counts[keys[j]] + " x " + display);
      } else {
        parts.push(display);
      }
    }
    return parts.join(" + ");
  }

  function formatWeight(w) {
    if (w % 1 === 0) {
      return w.toString();
    }
    return w.toFixed(1);
  }

  // ---- Main update ----

  function update() {
    var result = calculatePlates(state.targetWeight);

    // Message
    if (result.belowBar) {
      elWeightMessage.textContent = "Target is below bar weight (" + formatWeight(getBarWeight()) + " " + state.unit + ")";
      elWeightMessage.className = "weight-message warning";
    } else if (Math.abs(result.remainder) > 0.01) {
      elWeightMessage.textContent = "Nearest loadable: " + formatWeight(result.actual) + " " + state.unit + " (off by " + formatWeight(Math.abs(result.remainder)) + ")";
      elWeightMessage.className = "weight-message warning";
    } else {
      elWeightMessage.textContent = "";
      elWeightMessage.className = "weight-message";
    }

    // Plate summary
    if (result.plates.length === 0) {
      elPlateSummary.textContent = result.belowBar ? "" : "Empty bar -- no plates needed";
    } else {
      elPlateSummary.textContent = "Per side: " + summarizePlates(result.plates);
    }

    // Draw main barbell
    drawBarbell(elBarbellSvg, result.plates, false);

    // Warmup
    renderWarmupSets();
  }

  // ---- Event handlers ----

  function setUnit(unit) {
    if (unit === state.unit) {
      return;
    }

    // Convert target weight
    if (unit === "kg") {
      state.targetWeight = Math.round(lbsToKg(state.targetWeight) * 2) / 2;
    } else {
      state.targetWeight = Math.round(kgToLbs(state.targetWeight) * 2) / 2;
    }

    state.unit = unit;
    elTargetWeight.value = state.targetWeight;
    elUnitLabel.textContent = unit;

    if (unit === "lbs") {
      elBtnLbs.classList.add("active");
      elBtnKg.classList.remove("active");
      elTargetWeight.step = 5;
    } else {
      elBtnKg.classList.add("active");
      elBtnLbs.classList.remove("active");
      elTargetWeight.step = 2.5;
    }

    // Update bar select display
    updateBarSelectOptions();
    renderPlatesGrid();
    update();
  }

  function updateBarSelectOptions() {
    var opts = elBarSelect.options;
    for (var i = 0; i < opts.length; i++) {
      var barOpt = BAR_OPTIONS[i];
      if (state.unit === "lbs") {
        opts[i].textContent = barOpt.lbs + " lb / " + barOpt.kg + " kg (" + barOpt.label + ")";
      } else {
        opts[i].textContent = barOpt.kg + " kg / " + barOpt.lbs + " lb (" + barOpt.label + ")";
      }
    }
  }

  elBtnLbs.addEventListener("click", function () { setUnit("lbs"); });
  elBtnKg.addEventListener("click", function () { setUnit("kg"); });

  elBarSelect.addEventListener("change", function () {
    var idx = elBarSelect.selectedIndex;
    state.barLbs = BAR_OPTIONS[idx].lbs;
    state.barKg = BAR_OPTIONS[idx].kg;
    update();
  });

  elTargetWeight.addEventListener("input", function () {
    var val = parseFloat(elTargetWeight.value);
    if (!isNaN(val) && val >= 0) {
      state.targetWeight = val;
      update();
    }
  });

  elTargetWeight.addEventListener("blur", function () {
    if (elTargetWeight.value === "" || isNaN(parseFloat(elTargetWeight.value))) {
      elTargetWeight.value = getBarWeight();
      state.targetWeight = getBarWeight();
      update();
    }
  });

  var stepSize = function () {
    return state.unit === "lbs" ? 5 : 2.5;
  };

  elBtnMinus.addEventListener("click", function () {
    var newVal = state.targetWeight - stepSize();
    if (newVal < 0) {
      newVal = 0;
    }
    state.targetWeight = newVal;
    elTargetWeight.value = state.targetWeight;
    update();
  });

  elBtnPlus.addEventListener("click", function () {
    state.targetWeight = state.targetWeight + stepSize();
    elTargetWeight.value = state.targetWeight;
    update();
  });

  // ---- Init ----

  renderPlatesGrid();
  update();

})();
