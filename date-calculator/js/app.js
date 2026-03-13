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
  var SHORT_MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun",
    "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  var SHORT_DAYS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

  function formatDate(d) {
    return MONTHS[d.getMonth()] + " " + d.getDate() + ", " + d.getFullYear();
  }

  function formatShort(d) {
    return SHORT_MONTHS[d.getMonth()] + " " + d.getDate();
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

  function sameDay(a, b) {
    return a.getFullYear() === b.getFullYear() &&
      a.getMonth() === b.getMonth() &&
      a.getDate() === b.getDate();
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
  // Calendar renderer (month grid with highlighted range)
  // -------------------------------------------------------

  function renderCalendar(container, startDate, endDate, markedDates) {
    if (!container) {
      return;
    }
    container.innerHTML = "";

    var earlier = startDate <= endDate ? startDate : endDate;
    var later = startDate <= endDate ? endDate : startDate;
    var marks = markedDates || [];

    // Determine which months to show
    var months = [];
    var cur = new Date(earlier.getFullYear(), earlier.getMonth(), 1);
    var lastMonth = new Date(later.getFullYear(), later.getMonth(), 1);
    while (cur <= lastMonth) {
      months.push(new Date(cur));
      cur.setMonth(cur.getMonth() + 1);
    }

    // Cap at 6 months visible
    if (months.length > 6) {
      var first3 = [months[0], months[1], months[2]];
      var last3 = [
        new Date(lastMonth.getFullYear(), lastMonth.getMonth() - 2, 1),
        new Date(lastMonth.getFullYear(), lastMonth.getMonth() - 1, 1),
        lastMonth
      ];
      var seen = {};
      first3.forEach(function (m) {
        seen[m.getFullYear() + "-" + m.getMonth()] = true;
      });
      months = first3.slice();
      var needEllipsis = false;
      last3.forEach(function (m) {
        var key = m.getFullYear() + "-" + m.getMonth();
        if (!seen[key]) {
          needEllipsis = true;
          months.push(m);
        }
      });
      if (needEllipsis) {
        months.splice(3, 0, null);
      }
    }

    months.forEach(function (month) {
      if (month === null) {
        var el = document.createElement("div");
        el.className = "cal-ellipsis";
        el.textContent = "...";
        container.appendChild(el);
        return;
      }

      var monthDiv = document.createElement("div");
      monthDiv.className = "cal-month";

      var title = document.createElement("div");
      title.className = "cal-title";
      title.textContent = SHORT_MONTHS[month.getMonth()] + " " + month.getFullYear();
      monthDiv.appendChild(title);

      var grid = document.createElement("div");
      grid.className = "cal-grid";

      SHORT_DAYS.forEach(function (name) {
        var hdr = document.createElement("div");
        hdr.className = "cal-hdr";
        hdr.textContent = name;
        grid.appendChild(hdr);
      });

      var firstDow = new Date(month.getFullYear(), month.getMonth(), 1).getDay();
      for (var b = 0; b < firstDow; b++) {
        var blank = document.createElement("div");
        blank.className = "cal-day cal-blank";
        grid.appendChild(blank);
      }

      var daysInMonth = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();
      for (var d = 1; d <= daysInMonth; d++) {
        var cell = document.createElement("div");
        cell.className = "cal-day";
        cell.textContent = d;

        var thisDate = new Date(month.getFullYear(), month.getMonth(), d);
        var thisTime = thisDate.getTime();

        // Check if this is a marked date
        var isMarked = false;
        for (var mi = 0; mi < marks.length; mi++) {
          if (sameDay(thisDate, marks[mi].date)) {
            cell.classList.add("cal-marked");
            cell.setAttribute("title", marks[mi].label);
            isMarked = true;
            break;
          }
        }

        if (!isMarked) {
          if (sameDay(thisDate, startDate) || sameDay(thisDate, endDate)) {
            cell.classList.add("cal-endpoint");
          } else if (thisTime >= earlier.getTime() && thisTime <= later.getTime()) {
            cell.classList.add("cal-in-range");
          }
        }

        if (sameDay(thisDate, today)) {
          cell.classList.add("cal-today");
        }

        grid.appendChild(cell);
      }

      monthDiv.appendChild(grid);
      container.appendChild(monthDiv);
    });
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
  var $addCalendar = document.getElementById("add-calendar");

  var $betweenStart = document.getElementById("between-start");
  var $betweenEnd = document.getElementById("between-end");
  var $betweenResult = document.getElementById("between-result");
  var $betweenDays = document.getElementById("between-result-days");
  var $betweenWeeks = document.getElementById("between-result-weeks");
  var $betweenBiz = document.getElementById("between-result-business");
  var $betweenBreakdown = document.getElementById("between-result-breakdown");
  var $betweenCalendar = document.getElementById("between-calendar");

  var $dowDate = document.getElementById("dow-date");
  var $dowResult = document.getElementById("dow-result");
  var $dowResultDay = document.getElementById("dow-result-day");
  var $dowResultDetail = document.getElementById("dow-result-detail");

  var $glanceDate = document.getElementById("glance-date");
  var $glanceMarkers = document.getElementById("glance-markers");
  var $glanceCalendar = document.getElementById("glance-calendar");

  var $ninetyDate = document.getElementById("ninety-date");
  var $ninetyMarkers = document.getElementById("ninety-markers");
  var $ninetyCalendar = document.getElementById("ninety-calendar");

  var $shortcutResult = document.getElementById("shortcut-result");
  var $shortcutDate = document.getElementById("shortcut-date");
  var $shortcutDetail = document.getElementById("shortcut-detail");

  // -------------------------------------------------------
  // 28-Day Intervals
  // -------------------------------------------------------

  var today = new Date();
  var todayStr = toLocalDateString(today);

  var CHAIN_DAYS = [28, 56, 84];

  function renderGlance() {
    var base = parseDateInput($glanceDate.value) || today;
    var isToday = sameDay(base, today);
    var dates = CHAIN_DAYS.map(function (n) {
      return { days: n, date: addToDate(base, n, "days") };
    });

    $glanceMarkers.innerHTML = "";
    var startCard = document.createElement("div");
    startCard.className = "glance-card glance-today";
    startCard.innerHTML = "<span class=\"glance-label\">" + (isToday ? "Today" : "Start") + "</span>" +
      "<span class=\"glance-date\">" + formatShort(base) + "</span>" +
      "<span class=\"glance-dow\">" + dayOfWeek(base) + "</span>";
    $glanceMarkers.appendChild(startCard);

    dates.forEach(function (item) {
      var card = document.createElement("div");
      card.className = "glance-card";
      card.innerHTML = "<span class=\"glance-label\">+" + item.days + " days</span>" +
        "<span class=\"glance-date\">" + formatShort(item.date) + "</span>" +
        "<span class=\"glance-dow\">" + dayOfWeek(item.date) + "</span>";
      $glanceMarkers.appendChild(card);
    });

    var marks = [{ date: base, label: isToday ? "Today" : "Start" }];
    dates.forEach(function (item) {
      marks.push({ date: item.date, label: "+" + item.days + " days" });
    });
    renderCalendar($glanceCalendar, base, dates[dates.length - 1].date, marks);
  }

  // -------------------------------------------------------
  // 90-Day Count
  // -------------------------------------------------------

  function renderNinety() {
    var base = parseDateInput($ninetyDate.value) || today;
    var isToday = sameDay(base, today);
    var endDate = addToDate(base, 90, "days");
    var remaining = daysBetween(today, endDate);
    var biz = countBusinessDays(base, endDate);

    $ninetyMarkers.innerHTML = "";

    var startCard = document.createElement("div");
    startCard.className = "glance-card glance-today";
    startCard.innerHTML = "<span class=\"glance-label\">" + (isToday ? "Today" : "Start") + "</span>" +
      "<span class=\"glance-date\">" + formatShort(base) + "</span>" +
      "<span class=\"glance-dow\">" + dayOfWeek(base) + "</span>";
    $ninetyMarkers.appendChild(startCard);

    var endCard = document.createElement("div");
    endCard.className = "glance-card";
    endCard.innerHTML = "<span class=\"glance-label\">Day 90</span>" +
      "<span class=\"glance-date\">" + formatShort(endDate) + "</span>" +
      "<span class=\"glance-dow\">" + dayOfWeek(endDate) + "</span>";
    $ninetyMarkers.appendChild(endCard);

    var countCard = document.createElement("div");
    countCard.className = "glance-card";
    countCard.innerHTML = "<span class=\"glance-label\">Remaining</span>" +
      "<span class=\"glance-date\">" + remaining + " days</span>" +
      "<span class=\"glance-dow\">" + biz + " business</span>";
    $ninetyMarkers.appendChild(countCard);

    var marks = [
      { date: base, label: isToday ? "Today" : "Start" },
      { date: endDate, label: "Day 90" }
    ];
    renderCalendar($ninetyCalendar, base, endDate, marks);
  }

  // -------------------------------------------------------
  // Initialize defaults
  // -------------------------------------------------------

  function init() {
    var saved = loadSettings();

    $glanceDate.value = (saved && saved.glanceDate) || todayStr;
    $ninetyDate.value = (saved && saved.ninetyDate) || todayStr;
    $startDate.value = (saved && saved.startDate) || todayStr;
    $offsetValue.value = (saved && saved.offsetValue !== undefined) ? saved.offsetValue : 28;
    $offsetUnit.value = (saved && saved.offsetUnit) || "days";
    $offsetDir.value = (saved && saved.offsetDir) || "add";
    $betweenStart.value = (saved && saved.betweenStart) || todayStr;
    $betweenEnd.value = (saved && saved.betweenEnd) || toLocalDateString(addToDate(today, 28, "days"));
    $dowDate.value = (saved && saved.dowDate) || todayStr;

    renderGlance();
    renderNinety();
    calcAddSubtract();
    calcBetween();
    calcDow();
  }

  // -------------------------------------------------------
  // Persist on change
  // -------------------------------------------------------

  function persist() {
    saveSettings({
      glanceDate: $glanceDate.value,
      ninetyDate: $ninetyDate.value,
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
    renderCalendar($addCalendar, base, result);
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
    renderCalendar($betweenCalendar, start, end);
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

    document.querySelectorAll(".pill").forEach(function (p) {
      p.classList.remove("active");
    });
  }

  // -------------------------------------------------------
  // Event listeners
  // -------------------------------------------------------

  // Glance date inputs
  $glanceDate.addEventListener("input", function () { renderGlance(); persist(); });
  $glanceDate.addEventListener("change", function () { renderGlance(); persist(); });
  $ninetyDate.addEventListener("input", function () { renderNinety(); persist(); });
  $ninetyDate.addEventListener("change", function () { renderNinety(); persist(); });

  [$startDate, $offsetValue, $offsetUnit, $offsetDir].forEach(function (el) {
    el.addEventListener("input", calcAddSubtract);
    el.addEventListener("change", calcAddSubtract);
  });

  [$betweenStart, $betweenEnd].forEach(function (el) {
    el.addEventListener("input", calcBetween);
    el.addEventListener("change", calcBetween);
  });

  $dowDate.addEventListener("input", calcDow);
  $dowDate.addEventListener("change", calcDow);

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
