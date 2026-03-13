/* -------------------------------------------------------
   Date Calculator - App Logic
   Pure JS, no dependencies.
   ------------------------------------------------------- */

(function () {
  "use strict";

  // -------------------------------------------------------
  // Helpers
  // -------------------------------------------------------

  var DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  var MONTHS = ["January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"];

  function formatDate(d) {
    return MONTHS[d.getMonth()] + " " + d.getDate() + ", " + d.getFullYear();
  }

  function dayOfWeek(d) {
    return DAYS[d.getDay()];
  }

  function toLocalDateString(d) {
    var y = d.getFullYear();
    var m = String(d.getMonth() + 1).padStart(2, "0");
    var day = String(d.getDate()).padStart(2, "0");
    return y + "-" + m + "-" + day;
  }

  function parseDateInput(val) {
    if (!val) {
      return null;
    }
    var parts = val.split("-");
    return new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
  }

  function countBusinessDays(start, end) {
    if (start > end) {
      var tmp = start;
      start = end;
      end = tmp;
    }
    var count = 0;
    var cur = new Date(start);
    while (cur <= end) {
      var dow = cur.getDay();
      if (dow !== 0 && dow !== 6) {
        count++;
      }
      cur.setDate(cur.getDate() + 1);
    }
    return count;
  }

  function addToDate(base, amount, unit) {
    var result = new Date(base);
    if (unit === "days") {
      result.setDate(result.getDate() + amount);
    } else if (unit === "weeks") {
      result.setDate(result.getDate() + amount * 7);
    } else if (unit === "months") {
      var targetMonth = result.getMonth() + amount;
      var day = result.getDate();
      result.setDate(1);
      result.setMonth(targetMonth);
      var maxDay = new Date(result.getFullYear(), result.getMonth() + 1, 0).getDate();
      result.setDate(Math.min(day, maxDay));
    } else if (unit === "years") {
      var yr = result.getFullYear() + amount;
      var mo = result.getMonth();
      var d = result.getDate();
      result.setFullYear(yr);
      result.setMonth(mo);
      var max = new Date(yr, mo + 1, 0).getDate();
      result.setDate(Math.min(d, max));
    }
    return result;
  }

  function daysBetween(a, b) {
    var ms = Math.abs(b.getTime() - a.getTime());
    return Math.round(ms / 86400000);
  }

  function breakdown(totalDays) {
    var years = Math.floor(totalDays / 365);
    var remaining = totalDays % 365;
    var months = Math.floor(remaining / 30);
    var days = remaining % 30;
    var parts = [];
    if (years > 0) {
      parts.push(years + (years === 1 ? " year" : " years"));
    }
    if (months > 0) {
      parts.push(months + (months === 1 ? " month" : " months"));
    }
    parts.push(days + (days === 1 ? " day" : " days"));
    return parts.join(", ");
  }

  // -------------------------------------------------------
  // LocalStorage
  // -------------------------------------------------------

  var STORAGE_KEY = "dateCalcSettings";

  function saveSettings(obj) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(obj));
    } catch (e) {
      // Storage unavailable
    }
  }

  function loadSettings() {
    try {
      var raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch (e) {
      return null;
    }
  }

  // -------------------------------------------------------
  // DOM refs
  // -------------------------------------------------------

  var $startDate = document.getElementById("start-date");
  var $offsetValue = document.getElementById("offset-value");
  var $offsetUnit = document.getElementById("offset-unit");
  var $offsetDir = document.getElementById("offset-direction");
  var $addResult = document.getElementById("add-result");
  var $addResultDate = document.getElementById("add-result-date");
  var $addResultDow = document.getElementById("add-result-dow");
  var $addResultBiz = document.getElementById("add-result-business");

  var $betweenStart = document.getElementById("between-start");
  var $betweenEnd = document.getElementById("between-end");
  var $betweenResult = document.getElementById("between-result");
  var $betweenDays = document.getElementById("between-result-days");
  var $betweenWeeks = document.getElementById("between-result-weeks");
  var $betweenBiz = document.getElementById("between-result-business");
  var $betweenBreakdown = document.getElementById("between-result-breakdown");

  var $dowDate = document.getElementById("dow-date");
  var $dowResult = document.getElementById("dow-result");
  var $dowResultDay = document.getElementById("dow-result-day");
  var $dowResultDetail = document.getElementById("dow-result-detail");

  var $shortcutResult = document.getElementById("shortcut-result");
  var $shortcutDate = document.getElementById("shortcut-date");
  var $shortcutDetail = document.getElementById("shortcut-detail");

  // -------------------------------------------------------
  // Initialize defaults
  // -------------------------------------------------------

  var today = new Date();
  var todayStr = toLocalDateString(today);

  function init() {
    var saved = loadSettings();

    $startDate.value = (saved && saved.startDate) || todayStr;
    $offsetValue.value = (saved && saved.offsetValue !== undefined) ? saved.offsetValue : 30;
    $offsetUnit.value = (saved && saved.offsetUnit) || "days";
    $offsetDir.value = (saved && saved.offsetDir) || "add";
    $betweenStart.value = (saved && saved.betweenStart) || todayStr;
    $betweenEnd.value = (saved && saved.betweenEnd) || toLocalDateString(addToDate(today, 30, "days"));
    $dowDate.value = (saved && saved.dowDate) || todayStr;

    calcAddSubtract();
    calcBetween();
    calcDow();
  }

  // -------------------------------------------------------
  // Persist on change
  // -------------------------------------------------------

  function persist() {
    saveSettings({
      startDate: $startDate.value,
      offsetValue: $offsetValue.value,
      offsetUnit: $offsetUnit.value,
      offsetDir: $offsetDir.value,
      betweenStart: $betweenStart.value,
      betweenEnd: $betweenEnd.value,
      dowDate: $dowDate.value
    });
  }

  // -------------------------------------------------------
  // Add/Subtract calculator
  // -------------------------------------------------------

  function calcAddSubtract() {
    var base = parseDateInput($startDate.value);
    var amount = parseInt($offsetValue.value, 10);
    var unit = $offsetUnit.value;
    var dir = $offsetDir.value;

    if (!base || isNaN(amount)) {
      $addResult.classList.add("hidden");
      return;
    }

    var actual = dir === "subtract" ? -amount : amount;
    var result = addToDate(base, actual, unit);
    var biz = countBusinessDays(base, result);

    $addResultDate.textContent = formatDate(result);
    $addResultDow.innerHTML = "<strong>Day:</strong> " + dayOfWeek(result);
    $addResultBiz.innerHTML = "<strong>Business days in range:</strong> " + biz.toLocaleString();
    $addResult.classList.remove("hidden");
    persist();
  }

  // -------------------------------------------------------
  // Between calculator
  // -------------------------------------------------------

  function calcBetween() {
    var start = parseDateInput($betweenStart.value);
    var end = parseDateInput($betweenEnd.value);

    if (!start || !end) {
      $betweenResult.classList.add("hidden");
      return;
    }

    var total = daysBetween(start, end);
    var biz = countBusinessDays(start, end);
    var weeks = (total / 7).toFixed(1);

    $betweenDays.textContent = total.toLocaleString() + " day" + (total !== 1 ? "s" : "");
    $betweenWeeks.innerHTML = "<strong>Weeks:</strong> " + weeks;
    $betweenBiz.innerHTML = "<strong>Business days:</strong> " + biz.toLocaleString();
    $betweenBreakdown.innerHTML = "<strong>Approx:</strong> " + breakdown(total);
    $betweenResult.classList.remove("hidden");
    persist();
  }

  // -------------------------------------------------------
  // Day of Week
  // -------------------------------------------------------

  function calcDow() {
    var d = parseDateInput($dowDate.value);

    if (!d) {
      $dowResult.classList.add("hidden");
      return;
    }

    $dowResultDay.textContent = dayOfWeek(d);
    $dowResultDetail.textContent = formatDate(d);
    $dowResult.classList.remove("hidden");
    persist();
  }

  // -------------------------------------------------------
  // Quick Shortcuts
  // -------------------------------------------------------

  function handleShortcut(days) {
    var result = addToDate(today, days, "days");
    var label = days > 0
      ? days + " days from today"
      : Math.abs(days) + " days ago";

    $shortcutDate.textContent = formatDate(result);
    $shortcutDetail.innerHTML = "<strong>" + dayOfWeek(result) + "</strong> -- " + label;
    $shortcutResult.classList.remove("hidden");

    // Remove active from all pills, add to clicked
    document.querySelectorAll(".pill").forEach(function (p) {
      p.classList.remove("active");
    });
  }

  // -------------------------------------------------------
  // Event listeners
  // -------------------------------------------------------

  // Add/Subtract inputs
  [$startDate, $offsetValue, $offsetUnit, $offsetDir].forEach(function (el) {
    el.addEventListener("input", calcAddSubtract);
    el.addEventListener("change", calcAddSubtract);
  });

  // Between inputs
  [$betweenStart, $betweenEnd].forEach(function (el) {
    el.addEventListener("input", calcBetween);
    el.addEventListener("change", calcBetween);
  });

  // Day of Week input
  $dowDate.addEventListener("input", calcDow);
  $dowDate.addEventListener("change", calcDow);

  // Shortcut pills
  document.querySelectorAll(".pill[data-days]").forEach(function (btn) {
    btn.addEventListener("click", function () {
      var days = parseInt(this.getAttribute("data-days"), 10);
      this.classList.add("active");
      handleShortcut(days);
    });
  });

  // -------------------------------------------------------
  // Init
  // -------------------------------------------------------

  init();

})();
