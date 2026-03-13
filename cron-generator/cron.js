(function () {
  "use strict";

  // ── Constants ──

  var DAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  var MONTH_NAMES = ["January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"];
  var DAY_ABBR_MAP = { SUN: 0, MON: 1, TUE: 2, WED: 3, THU: 4, FRI: 5, SAT: 6 };
  var MONTH_ABBR_MAP = { JAN: 1, FEB: 2, MAR: 3, APR: 4, MAY: 5, JUN: 6,
    JUL: 7, AUG: 8, SEP: 9, OCT: 10, NOV: 11, DEC: 12 };

  var COMMON_EXAMPLES = [
    { expr: "* * * * *", desc: "Every minute" },
    { expr: "*/5 * * * *", desc: "Every 5 minutes" },
    { expr: "*/15 * * * *", desc: "Every 15 minutes" },
    { expr: "*/30 * * * *", desc: "Every 30 minutes" },
    { expr: "0 * * * *", desc: "Every hour" },
    { expr: "0 */2 * * *", desc: "Every 2 hours" },
    { expr: "0 0 * * *", desc: "Daily at midnight" },
    { expr: "0 6 * * *", desc: "Daily at 6:00 AM" },
    { expr: "0 9 * * 1-5", desc: "Weekdays at 9:00 AM" },
    { expr: "0 17 * * 1-5", desc: "Weekdays at 5:00 PM" },
    { expr: "0 0 * * 0", desc: "Every Sunday at midnight" },
    { expr: "0 0 1 * *", desc: "1st of every month" },
    { expr: "0 0 15 * *", desc: "15th of every month" },
    { expr: "0 0 1 1 *", desc: "Once a year (Jan 1st)" },
    { expr: "0 0 * * 1", desc: "Every Monday at midnight" },
    { expr: "30 4 * * *", desc: "Daily at 4:30 AM" }
  ];

  // ── DOM refs ──

  var frequencySelect = document.getElementById("frequency");
  var builderOptions = document.getElementById("builder-options");
  var builderExpression = document.getElementById("builder-expression");
  var builderCopy = document.getElementById("builder-copy");
  var builderExplanation = document.getElementById("builder-explanation");
  var builderRunList = document.getElementById("builder-run-list");
  var examplesGrid = document.getElementById("examples-grid");
  var cronInput = document.getElementById("cron-input");
  var explainBtn = document.getElementById("explain-btn");
  var explainerError = document.getElementById("explainer-error");
  var explainerResults = document.getElementById("explainer-results");
  var explainerExplanation = document.getElementById("explainer-explanation");
  var explainerRunList = document.getElementById("explainer-run-list");
  var toast = document.getElementById("toast");

  // ── Helpers ──

  function padZero(n) {
    return n < 10 ? "0" + n : "" + n;
  }

  function formatDate(d) {
    return DAY_NAMES[d.getDay()] + ", " +
      MONTH_NAMES[d.getMonth()] + " " + d.getDate() + ", " +
      d.getFullYear() + " " +
      padZero(d.getHours()) + ":" + padZero(d.getMinutes());
  }

  function ordinal(n) {
    var s = ["th", "st", "nd", "rd"];
    var v = n % 100;
    return n + (s[(v - 20) % 10] || s[v] || s[0]);
  }

  function showToast() {
    toast.hidden = false;
    toast.classList.add("show");
    setTimeout(function () {
      toast.classList.remove("show");
      setTimeout(function () { toast.hidden = true; }, 300);
    }, 1500);
  }

  function copyToClipboard(text) {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text).then(showToast);
    } else {
      var ta = document.createElement("textarea");
      ta.value = text;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
      showToast();
    }
  }

  // ── Cron Parsing ──

  function replaceNames(field, map) {
    var result = field.toUpperCase();
    for (var name in map) {
      if (map.hasOwnProperty(name)) {
        result = result.replace(new RegExp(name, "g"), map[name]);
      }
    }
    return result;
  }

  function expandField(field, min, max) {
    // Returns sorted array of integers this field matches
    var values = {};
    var parts = field.split(",");
    for (var i = 0; i < parts.length; i++) {
      var part = parts[i].trim();
      var stepMatch = part.match(/^(.+)\/(\d+)$/);
      var step = 1;
      var range = part;
      if (stepMatch) {
        range = stepMatch[1];
        step = parseInt(stepMatch[2], 10);
        if (step === 0) { step = 1; }
      }
      var lo, hi;
      if (range === "*") {
        lo = min;
        hi = max;
      } else {
        var dashMatch = range.match(/^(\d+)-(\d+)$/);
        if (dashMatch) {
          lo = parseInt(dashMatch[1], 10);
          hi = parseInt(dashMatch[2], 10);
        } else {
          lo = parseInt(range, 10);
          hi = stepMatch ? max : lo;
        }
      }
      for (var v = lo; v <= hi; v += step) {
        if (v >= min && v <= max) {
          values[v] = true;
        }
      }
    }
    var result = [];
    for (var k in values) {
      if (values.hasOwnProperty(k)) {
        result.push(parseInt(k, 10));
      }
    }
    return result.sort(function (a, b) { return a - b; });
  }

  function parseCron(expr) {
    var parts = expr.trim().split(/\s+/);
    if (parts.length !== 5) {
      return null;
    }
    var minuteField = parts[0];
    var hourField = parts[1];
    var domField = parts[2];
    var monthField = replaceNames(parts[3], MONTH_ABBR_MAP);
    var dowField = replaceNames(parts[4], DAY_ABBR_MAP);

    // Handle 7 as Sunday alias
    dowField = dowField.replace(/\b7\b/g, "0");

    try {
      var minutes = expandField(minuteField, 0, 59);
      var hours = expandField(hourField, 0, 23);
      var doms = expandField(domField, 1, 31);
      var months = expandField(monthField, 1, 12);
      var dows = expandField(dowField, 0, 6);

      if (minutes.length === 0 || hours.length === 0 || doms.length === 0 ||
        months.length === 0 || dows.length === 0) {
        return null;
      }

      // Track whether dom/dow are wildcards for matching logic
      var domIsWild = (domField === "*");
      var dowIsWild = (dowField === "*");

      return {
        minutes: minutes,
        hours: hours,
        doms: doms,
        months: months,
        dows: dows,
        domIsWild: domIsWild,
        dowIsWild: dowIsWild,
        raw: parts
      };
    } catch (e) {
      return null;
    }
  }

  function cronMatches(parsed, date) {
    var minute = date.getMinutes();
    var hour = date.getHours();
    var dom = date.getDate();
    var month = date.getMonth() + 1;
    var dow = date.getDay();

    if (parsed.minutes.indexOf(minute) === -1) { return false; }
    if (parsed.hours.indexOf(hour) === -1) { return false; }
    if (parsed.months.indexOf(month) === -1) { return false; }

    // Standard cron: if both dom and dow are restricted (not wildcard),
    // match if EITHER matches (OR logic). If only one is restricted, use AND.
    if (!parsed.domIsWild && !parsed.dowIsWild) {
      return parsed.doms.indexOf(dom) !== -1 || parsed.dows.indexOf(dow) !== -1;
    }
    if (parsed.doms.indexOf(dom) === -1) { return false; }
    if (parsed.dows.indexOf(dow) === -1) { return false; }
    return true;
  }

  function getNextRuns(expr, count) {
    var parsed = parseCron(expr);
    if (!parsed) { return []; }

    var results = [];
    var d = new Date();
    d.setSeconds(0, 0);
    d.setMinutes(d.getMinutes() + 1);

    var limit = 525600; // max 1 year of minutes to check
    var checked = 0;

    while (results.length < count && checked < limit) {
      if (cronMatches(parsed, d)) {
        results.push(new Date(d));
      }
      d.setMinutes(d.getMinutes() + 1);
      checked++;
    }

    return results;
  }

  // ── Cron to English ──

  function describeField(values, allMin, allMax, namesFn) {
    if (values.length === (allMax - allMin + 1)) {
      return null; // wildcard, don't describe
    }
    if (namesFn) {
      return values.map(namesFn).join(", ");
    }
    return values.join(", ");
  }

  function cronToEnglish(expr) {
    var parsed = parseCron(expr);
    if (!parsed) { return "Invalid cron expression."; }

    var raw = parsed.raw;
    var parts = [];

    // Minute
    if (raw[0] === "*") {
      parts.push("every minute");
    } else if (raw[0].indexOf("/") !== -1) {
      var step = raw[0].split("/")[1];
      parts.push("every " + step + " minutes");
    } else {
      parts.push("at minute " + describeField(parsed.minutes, 0, 59));
    }

    // Hour
    if (raw[1] === "*") {
      if (raw[0] !== "*" && raw[0].indexOf("/") === -1) {
        parts.push("of every hour");
      }
    } else if (raw[1].indexOf("/") !== -1) {
      var hstep = raw[1].split("/")[1];
      parts.push("every " + hstep + " hours");
    } else {
      var hourDesc = parsed.hours.map(function (h) {
        if (h === 0) { return "12:00 AM"; }
        if (h === 12) { return "12:00 PM"; }
        if (h < 12) { return h + ":00 AM"; }
        return (h - 12) + ":00 PM";
      }).join(", ");
      // If we have a specific minute, combine into time
      if (raw[0] !== "*" && raw[0].indexOf("/") === -1 && parsed.minutes.length === 1) {
        var m = padZero(parsed.minutes[0]);
        hourDesc = parsed.hours.map(function (h) {
          if (h === 0) { return "12:" + m + " AM"; }
          if (h === 12) { return "12:" + m + " PM"; }
          if (h < 12) { return h + ":" + m + " AM"; }
          return (h - 12) + ":" + m + " PM";
        }).join(", ");
        // Replace the minute part
        parts = ["at " + hourDesc];
      } else {
        parts.push("during the " + hourDesc + " hour(s)");
      }
    }

    // Day of month
    if (raw[2] !== "*") {
      if (raw[2].indexOf("/") !== -1) {
        var dstep = raw[2].split("/")[1];
        parts.push("every " + dstep + " days");
      } else {
        var domStr = parsed.doms.map(function (d) { return ordinal(d); }).join(", ");
        parts.push("on the " + domStr + " of the month");
      }
    }

    // Month
    if (raw[3] !== "*") {
      if (raw[3].indexOf("/") !== -1) {
        var mstep = raw[3].split("/")[1];
        parts.push("every " + mstep + " months");
      } else {
        var monthStr = parsed.months.map(function (m) { return MONTH_NAMES[m - 1]; }).join(", ");
        parts.push("in " + monthStr);
      }
    }

    // Day of week
    if (raw[4] !== "*") {
      var dowReplaced = replaceNames(raw[4], DAY_ABBR_MAP).replace(/\b7\b/g, "0");
      if (dowReplaced.indexOf("/") !== -1) {
        var wstep = dowReplaced.split("/")[1];
        parts.push("every " + wstep + " days of the week");
      } else {
        var dowStr = parsed.dows.map(function (d) { return DAY_NAMES[d]; }).join(", ");
        parts.push("on " + dowStr);
      }
    }

    var sentence = parts.join(", ");
    return sentence.charAt(0).toUpperCase() + sentence.slice(1) + ".";
  }

  // ── Builder Logic ──

  function makeSelect(id, label, options) {
    var html = '<div class="builder-row">';
    html += '<label for="' + id + '">' + label + '</label>';
    html += '<select id="' + id + '">';
    for (var i = 0; i < options.length; i++) {
      var opt = options[i];
      var sel = opt.selected ? " selected" : "";
      html += '<option value="' + opt.value + '"' + sel + '>' + opt.label + '</option>';
    }
    html += '</select></div>';
    return html;
  }

  function hourOptions(selectedVal) {
    var opts = [];
    for (var h = 0; h < 24; h++) {
      var label;
      if (h === 0) { label = "12:00 AM (midnight)"; }
      else if (h === 12) { label = "12:00 PM (noon)"; }
      else if (h < 12) { label = h + ":00 AM"; }
      else { label = (h - 12) + ":00 PM"; }
      opts.push({ value: h, label: label, selected: h === selectedVal });
    }
    return opts;
  }

  function minuteOptions(selectedVal) {
    var opts = [];
    for (var m = 0; m < 60; m++) {
      opts.push({ value: m, label: padZero(m), selected: m === selectedVal });
    }
    return opts;
  }

  function dowOptions(selectedVal) {
    var opts = [];
    for (var d = 0; d < 7; d++) {
      opts.push({ value: d, label: DAY_NAMES[d], selected: d === selectedVal });
    }
    return opts;
  }

  function domOptions(selectedVal) {
    var opts = [];
    for (var d = 1; d <= 31; d++) {
      opts.push({ value: d, label: ordinal(d), selected: d === selectedVal });
    }
    return opts;
  }

  function monthOptions(selectedVal) {
    var opts = [];
    for (var m = 1; m <= 12; m++) {
      opts.push({ value: m, label: MONTH_NAMES[m - 1], selected: m === selectedVal });
    }
    return opts;
  }

  function renderBuilderOptions() {
    var freq = frequencySelect.value;
    var html = "";

    if (freq === "every-minute") {
      html = ""; // No options needed
    } else if (freq === "hourly") {
      html = makeSelect("opt-minute", "At Minute", minuteOptions(0));
    } else if (freq === "daily") {
      html = makeSelect("opt-hour", "At Hour", hourOptions(0));
      html += makeSelect("opt-minute", "At Minute", minuteOptions(0));
    } else if (freq === "weekly") {
      html = makeSelect("opt-dow", "Day of Week", dowOptions(0));
      html += makeSelect("opt-hour", "At Hour", hourOptions(0));
      html += makeSelect("opt-minute", "At Minute", minuteOptions(0));
    } else if (freq === "monthly") {
      html = makeSelect("opt-dom", "Day of Month", domOptions(1));
      html += makeSelect("opt-hour", "At Hour", hourOptions(0));
      html += makeSelect("opt-minute", "At Minute", minuteOptions(0));
    } else if (freq === "yearly") {
      html = makeSelect("opt-month", "Month", monthOptions(1));
      html += makeSelect("opt-dom", "Day of Month", domOptions(1));
      html += makeSelect("opt-hour", "At Hour", hourOptions(0));
      html += makeSelect("opt-minute", "At Minute", minuteOptions(0));
    }

    builderOptions.innerHTML = html;

    // Attach change listeners to new selects
    var selects = builderOptions.querySelectorAll("select");
    for (var i = 0; i < selects.length; i++) {
      selects[i].addEventListener("change", updateBuilder);
    }

    updateBuilder();
  }

  function getOptVal(id) {
    var el = document.getElementById(id);
    return el ? parseInt(el.value, 10) : 0;
  }

  function buildCronExpression() {
    var freq = frequencySelect.value;
    var minute, hour, dom, month, dow;

    if (freq === "every-minute") {
      return "* * * * *";
    } else if (freq === "hourly") {
      minute = getOptVal("opt-minute");
      return minute + " * * * *";
    } else if (freq === "daily") {
      minute = getOptVal("opt-minute");
      hour = getOptVal("opt-hour");
      return minute + " " + hour + " * * *";
    } else if (freq === "weekly") {
      minute = getOptVal("opt-minute");
      hour = getOptVal("opt-hour");
      dow = getOptVal("opt-dow");
      return minute + " " + hour + " * * " + dow;
    } else if (freq === "monthly") {
      minute = getOptVal("opt-minute");
      hour = getOptVal("opt-hour");
      dom = getOptVal("opt-dom");
      return minute + " " + hour + " " + dom + " * *";
    } else if (freq === "yearly") {
      minute = getOptVal("opt-minute");
      hour = getOptVal("opt-hour");
      dom = getOptVal("opt-dom");
      month = getOptVal("opt-month");
      return minute + " " + hour + " " + dom + " " + month + " *";
    }
    return "* * * * *";
  }

  function updateBuilder() {
    var expr = buildCronExpression();
    builderExpression.textContent = expr;
    builderExplanation.textContent = cronToEnglish(expr);
    renderRunList(builderRunList, expr);
  }

  function renderRunList(listEl, expr) {
    var runs = getNextRuns(expr, 10);
    listEl.innerHTML = "";
    if (runs.length === 0) {
      listEl.innerHTML = "<li>No upcoming runs found within the next year.</li>";
      return;
    }
    for (var i = 0; i < runs.length; i++) {
      var li = document.createElement("li");
      li.textContent = formatDate(runs[i]);
      listEl.appendChild(li);
    }
  }

  // ── Examples ──

  function renderExamples() {
    var html = "";
    for (var i = 0; i < COMMON_EXAMPLES.length; i++) {
      var ex = COMMON_EXAMPLES[i];
      html += '<button class="example-btn" data-expr="' + ex.expr + '">';
      html += '<span class="example-expr">' + ex.expr + '</span>';
      html += '<span class="example-desc">' + ex.desc + '</span>';
      html += '</button>';
    }
    examplesGrid.innerHTML = html;

    var buttons = examplesGrid.querySelectorAll(".example-btn");
    for (var j = 0; j < buttons.length; j++) {
      buttons[j].addEventListener("click", function () {
        var expr = this.getAttribute("data-expr");
        cronInput.value = expr;
        explainCron();
        cronInput.scrollIntoView({ behavior: "smooth", block: "center" });
      });
    }
  }

  // ── Explainer ──

  function explainCron() {
    var expr = cronInput.value.trim();
    explainerError.hidden = true;
    explainerResults.hidden = true;

    if (!expr) {
      explainerError.textContent = "Please enter a cron expression.";
      explainerError.hidden = false;
      return;
    }

    var parsed = parseCron(expr);
    if (!parsed) {
      explainerError.textContent = "Invalid cron expression. Please enter a valid 5-field cron expression (e.g. */5 * * * *).";
      explainerError.hidden = false;
      return;
    }

    explainerExplanation.textContent = cronToEnglish(expr);
    renderRunList(explainerRunList, expr);
    explainerResults.hidden = false;
  }

  // ── Event Bindings ──

  frequencySelect.addEventListener("change", renderBuilderOptions);

  builderCopy.addEventListener("click", function () {
    copyToClipboard(builderExpression.textContent);
  });

  explainBtn.addEventListener("click", explainCron);

  cronInput.addEventListener("keydown", function (e) {
    if (e.key === "Enter") {
      explainCron();
    }
  });

  // ── Init ──

  renderBuilderOptions();
  renderExamples();

})();
