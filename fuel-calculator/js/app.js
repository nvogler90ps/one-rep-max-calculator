document.addEventListener("DOMContentLoaded", function () {
  initUnitToggle();
  initVehicleSummary();
  initComparison();
});

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

var GALLONS_PER_LITER = 0.264172;
var LITERS_PER_GALLON = 3.78541;
var WEEKS_PER_YEAR = 52;

// ---------------------------------------------------------------------------
// State
// ---------------------------------------------------------------------------

var currentUnit = "gallons";

// ---------------------------------------------------------------------------
// Unit Toggle
// ---------------------------------------------------------------------------

function initUnitToggle() {
  var sel = document.getElementById("unit-toggle");
  if (!sel) {
    return;
  }
  sel.addEventListener("change", function () {
    currentUnit = sel.value;
    updateUnitLabels();
    updateVehicleSummary();
  });
}

function updateUnitLabels() {
  var labels = document.querySelectorAll(".unit-volume");
  var text = currentUnit === "gallons" ? "gallons" : "liters";
  var textSingular = currentUnit === "gallons" ? "gallon" : "liter";
  for (var i = 0; i < labels.length; i++) {
    var el = labels[i];
    // Use singular for "per gallon/liter" contexts
    if (el.closest && el.closest(".form-label")) {
      var labelText = el.closest(".form-label").textContent.toLowerCase();
      if (labelText.indexOf("per") !== -1) {
        el.textContent = textSingular;
      } else {
        el.textContent = text;
      }
    } else {
      el.textContent = text;
    }
  }
}

// ---------------------------------------------------------------------------
// Vehicle Summary
// ---------------------------------------------------------------------------

function initVehicleSummary() {
  var ids = ["fuel-type", "tank-size", "weekly-miles", "mpg"];
  ids.forEach(function (id) {
    var el = document.getElementById(id);
    if (el) {
      el.addEventListener("change", updateVehicleSummary);
      el.addEventListener("input", updateVehicleSummary);
    }
  });
  updateVehicleSummary();
}

function updateVehicleSummary() {
  var container = document.getElementById("vehicle-summary");
  if (!container) {
    return;
  }

  var fuelType = document.getElementById("fuel-type").value;
  var tankSize = parseFloat(document.getElementById("tank-size").value) || 0;
  var weeklyMiles = parseFloat(document.getElementById("weekly-miles").value) || 0;
  var mpg = parseFloat(document.getElementById("mpg").value) || 1;

  var fuelLabels = {
    regular: "Regular Unleaded",
    midgrade: "Mid-Grade",
    premium: "Premium",
    diesel: "Diesel"
  };

  var tankDisplay = tankSize;
  var unitLabel = "gallons";
  if (currentUnit === "liters") {
    tankDisplay = (tankSize * LITERS_PER_GALLON).toFixed(1);
    unitLabel = "liters";
  }

  var gallonsPerWeek = weeklyMiles / mpg;
  var fillsPerWeek = tankSize > 0 ? gallonsPerWeek / tankSize : 0;
  var fillsPerYear = fillsPerWeek * WEEKS_PER_YEAR;
  var gallonsPerYear = gallonsPerWeek * WEEKS_PER_YEAR;

  var volumePerYear = gallonsPerYear;
  var volUnit = "gallons";
  if (currentUnit === "liters") {
    volumePerYear = gallonsPerYear * LITERS_PER_GALLON;
    volUnit = "liters";
  }

  container.innerHTML =
    '<span class="highlight">' + escHtml(fuelLabels[fuelType]) + "</span> | " +
    "Tank: <span class=\"highlight\">" + tankDisplay + " " + unitLabel + "</span> | " +
    "~<span class=\"highlight\">" + gallonsPerWeek.toFixed(1) + " gal/week</span> | " +
    "~<span class=\"highlight\">" + fillsPerYear.toFixed(0) + " fill-ups/year</span> | " +
    "~<span class=\"highlight\">" + formatNum(Math.round(volumePerYear)) + " " + volUnit + "/year</span>";
}

// ---------------------------------------------------------------------------
// Price Comparison
// ---------------------------------------------------------------------------

function initComparison() {
  var btn = document.getElementById("compare-btn");
  if (!btn) {
    return;
  }
  btn.addEventListener("click", runComparison);

  // Also run on Enter key in price inputs
  var priceInputs = ["station-1-price", "station-2-price", "station-3-price"];
  priceInputs.forEach(function (id) {
    var el = document.getElementById(id);
    if (el) {
      el.addEventListener("keydown", function (e) {
        if (e.key === "Enter") {
          runComparison();
        }
      });
    }
  });

  // Run initial comparison with defaults
  runComparison();
}

function runComparison() {
  var stations = getStations();
  if (stations.length < 2) {
    showComparisonError("Enter prices for at least 2 stations.");
    return;
  }

  var tankSize = parseFloat(document.getElementById("tank-size").value) || 0;
  var weeklyMiles = parseFloat(document.getElementById("weekly-miles").value) || 0;
  var mpg = parseFloat(document.getElementById("mpg").value) || 1;

  if (tankSize <= 0 || weeklyMiles <= 0 || mpg <= 0) {
    showComparisonError("Please fill in valid vehicle profile values.");
    return;
  }

  var gallonsPerWeek = weeklyMiles / mpg;
  var fillsPerWeek = gallonsPerWeek / tankSize;
  var fillsPerYear = fillsPerWeek * WEEKS_PER_YEAR;
  var gallonsPerYear = gallonsPerWeek * WEEKS_PER_YEAR;

  // Calculate costs for each station
  stations.forEach(function (station) {
    var pricePerGallon = station.price;
    if (currentUnit === "liters") {
      // Convert price per liter to price per gallon for calculations
      pricePerGallon = station.price * LITERS_PER_GALLON;
    }
    station.costPerFill = pricePerGallon * tankSize;
    station.annualCost = pricePerGallon * gallonsPerYear;
    station.weeklyFuel = pricePerGallon * gallonsPerWeek;
    station.pricePerGallon = pricePerGallon;
  });

  // Find cheapest
  var cheapestIdx = 0;
  var expensiveIdx = 0;
  stations.forEach(function (s, i) {
    if (s.annualCost < stations[cheapestIdx].annualCost) {
      cheapestIdx = i;
    }
    if (s.annualCost > stations[expensiveIdx].annualCost) {
      expensiveIdx = i;
    }
  });

  renderComparison(stations, cheapestIdx, expensiveIdx);
  renderSavings(stations, cheapestIdx, fillsPerYear);
}

function getStations() {
  var stations = [];
  for (var i = 1; i <= 3; i++) {
    var nameEl = document.getElementById("station-" + i + "-name");
    var priceEl = document.getElementById("station-" + i + "-price");
    if (!nameEl || !priceEl) {
      continue;
    }
    var name = nameEl.value.trim();
    var price = parseFloat(priceEl.value);
    if (name && price > 0) {
      stations.push({ name: name, price: price });
    }
  }
  return stations;
}

function showComparisonError(msg) {
  var container = document.getElementById("comparison-result");
  if (container) {
    container.innerHTML = '<p class="empty-state">' + escHtml(msg) + "</p>";
  }
  var savingsContainer = document.getElementById("savings-result");
  if (savingsContainer) {
    savingsContainer.innerHTML = "";
  }
}

function renderComparison(stations, cheapestIdx, expensiveIdx) {
  var container = document.getElementById("comparison-result");
  if (!container) {
    return;
  }

  var volUnit = currentUnit === "gallons" ? "gal" : "L";

  var html = '<div class="result-cards">';
  stations.forEach(function (station, i) {
    var cardClass = "result-card";
    var tagHtml = "";
    if (i === cheapestIdx && stations.length > 1) {
      cardClass += " cheapest";
      tagHtml = '<span class="cheapest-tag">CHEAPEST</span>';
    } else if (i === expensiveIdx && stations.length > 1) {
      cardClass += " expensive";
      tagHtml = '<span class="expensive-tag">MOST EXPENSIVE</span>';
    }

    html += '<div class="' + cardClass + '">';
    html += '<div class="station-name">' + escHtml(station.name) + "</div>";
    if (tagHtml) {
      html += tagHtml;
    }
    html += '<div class="price-display">$' + station.price.toFixed(2) + "</div>";
    html += '<div class="price-label">per ' + volUnit + "</div>";
    html += '<div class="stat">Fill-up: <strong>$' + station.costPerFill.toFixed(2) + "</strong></div>";
    html += '<div class="stat">Weekly: <strong>$' + station.weeklyFuel.toFixed(2) + "</strong></div>";
    html += '<div class="stat">Annual: <strong>$' + formatNum(Math.round(station.annualCost)) + "</strong></div>";
    html += "</div>";
  });
  html += "</div>";

  // Comparison table
  html += '<div class="table-wrapper">';
  html += '<table class="data-table"><thead><tr>';
  html += "<th>Station</th><th>Price/" + volUnit + "</th><th>Per Fill-up</th><th>Weekly</th><th>Annual</th>";
  html += "</tr></thead><tbody>";

  stations.forEach(function (station) {
    html += "<tr>";
    html += "<td>" + escHtml(station.name) + "</td>";
    html += "<td>$" + station.price.toFixed(2) + "</td>";
    html += "<td>$" + station.costPerFill.toFixed(2) + "</td>";
    html += "<td>$" + station.weeklyFuel.toFixed(2) + "</td>";
    html += "<td>$" + formatNum(Math.round(station.annualCost)) + "</td>";
    html += "</tr>";
  });

  html += "</tbody></table></div>";

  container.innerHTML = html;
}

// ---------------------------------------------------------------------------
// Savings Calculator
// ---------------------------------------------------------------------------

function renderSavings(stations, cheapestIdx, fillsPerYear) {
  var container = document.getElementById("savings-result");
  if (!container) {
    return;
  }

  if (stations.length < 2) {
    container.innerHTML = '<p class="empty-state">Add at least 2 stations to see savings.</p>';
    return;
  }

  var cheapest = stations[cheapestIdx];
  var html = '<div class="savings-card">';
  html += '<h3 style="margin-bottom: 0.75rem; color: var(--text);">Savings by Choosing ' + escHtml(cheapest.name) + "</h3>";

  stations.forEach(function (station, i) {
    if (i === cheapestIdx) {
      return;
    }

    var savingsPerFill = station.costPerFill - cheapest.costPerFill;
    var savingsPerYear = station.annualCost - cheapest.annualCost;

    html += '<div class="savings-row">';
    html += '<span class="savings-label">vs. ' + escHtml(station.name) + " (per fill-up)</span>";
    html += '<span class="savings-value positive">Save $' + savingsPerFill.toFixed(2) + "</span>";
    html += "</div>";

    html += '<div class="savings-row">';
    html += '<span class="savings-label">vs. ' + escHtml(station.name) + " (per year)</span>";
    html += '<span class="savings-value positive">Save $' + formatNum(Math.round(savingsPerYear)) + "</span>";
    html += "</div>";
  });

  // Overall max savings
  var maxSavingsPerYear = 0;
  stations.forEach(function (station, i) {
    if (i !== cheapestIdx) {
      var diff = station.annualCost - cheapest.annualCost;
      if (diff > maxSavingsPerYear) {
        maxSavingsPerYear = diff;
      }
    }
  });

  html += '<div class="savings-row" style="border-top: 2px solid var(--accent); margin-top: 0.5rem; padding-top: 0.75rem;">';
  html += '<span class="savings-label" style="font-weight: 600; color: var(--text);">Maximum Annual Savings</span>';
  html += '<span class="savings-value positive" style="font-size: 1.3rem;">$' + formatNum(Math.round(maxSavingsPerYear)) + "/year</span>";
  html += "</div>";

  html += "</div>";

  container.innerHTML = html;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function escHtml(str) {
  var div = document.createElement("div");
  div.appendChild(document.createTextNode(str));
  return div.innerHTML;
}

function formatNum(n) {
  return n.toLocaleString();
}
