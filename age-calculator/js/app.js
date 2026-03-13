(function () {
  'use strict';

  // DOM refs
  var birthInput = document.getElementById('birthdate');
  var calcBtn = document.getElementById('calcBtn');

  var exactSection = document.getElementById('exactAgeSection');
  var unitsSection = document.getElementById('unitsSection');
  var funFactsSection = document.getElementById('funFactsSection');
  var planetSection = document.getElementById('planetSection');

  var specificBirth = document.getElementById('specificBirth');
  var specificTarget = document.getElementById('specificTarget');
  var specificBtn = document.getElementById('specificBtn');
  var specificResult = document.getElementById('specificResult');

  var person1 = document.getElementById('person1');
  var person2 = document.getElementById('person2');
  var diffBtn = document.getElementById('diffBtn');
  var diffResult = document.getElementById('diffResult');

  var tickInterval = null;

  // Planet orbital periods in Earth days
  var planets = {
    Mercury: 87.969,
    Venus: 224.701,
    Earth: 365.256,
    Mars: 686.971,
    Jupiter: 4332.59,
    Saturn: 10759.22,
    Uranus: 30688.5,
    Neptune: 60182.0
  };

  // Zodiac sign ranges
  var zodiacSigns = [
    { sign: 'Capricorn', start: [1, 1], end: [1, 19] },
    { sign: 'Aquarius', start: [1, 20], end: [2, 18] },
    { sign: 'Pisces', start: [2, 19], end: [3, 20] },
    { sign: 'Aries', start: [3, 21], end: [4, 19] },
    { sign: 'Taurus', start: [4, 20], end: [5, 20] },
    { sign: 'Gemini', start: [5, 21], end: [6, 20] },
    { sign: 'Cancer', start: [6, 21], end: [7, 22] },
    { sign: 'Leo', start: [7, 23], end: [8, 22] },
    { sign: 'Virgo', start: [8, 23], end: [9, 22] },
    { sign: 'Libra', start: [9, 23], end: [10, 22] },
    { sign: 'Scorpio', start: [10, 23], end: [11, 21] },
    { sign: 'Sagittarius', start: [11, 22], end: [12, 21] },
    { sign: 'Capricorn', start: [12, 22], end: [12, 31] }
  ];

  var dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

  // Calculate exact age between two dates
  function calcAge(birth, target) {
    var years = target.getFullYear() - birth.getFullYear();
    var months = target.getMonth() - birth.getMonth();
    var days = target.getDate() - birth.getDate();

    if (days < 0) {
      months--;
      var prevMonth = new Date(target.getFullYear(), target.getMonth(), 0);
      days += prevMonth.getDate();
    }
    if (months < 0) {
      years--;
      months += 12;
    }

    var hours = target.getHours() - birth.getHours();
    var minutes = target.getMinutes() - birth.getMinutes();
    if (minutes < 0) {
      hours--;
      minutes += 60;
    }
    if (hours < 0) {
      days--;
      hours += 24;
      if (days < 0) {
        months--;
        if (months < 0) {
          years--;
          months += 12;
        }
        var prev = new Date(target.getFullYear(), target.getMonth(), 0);
        days += prev.getDate();
      }
    }

    return { years: years, months: months, days: days, hours: hours, minutes: minutes };
  }

  function totalDaysBetween(a, b) {
    var ms = b.getTime() - a.getTime();
    return Math.floor(ms / 86400000);
  }

  function getZodiac(month, day) {
    var md = [month, day];
    for (var i = 0; i < zodiacSigns.length; i++) {
      var z = zodiacSigns[i];
      var afterStart = md[0] > z.start[0] || (md[0] === z.start[0] && md[1] >= z.start[1]);
      var beforeEnd = md[0] < z.end[0] || (md[0] === z.end[0] && md[1] <= z.end[1]);
      if (afterStart && beforeEnd) {
        return z.sign;
      }
    }
    return 'Unknown';
  }

  function getGeneration(year) {
    if (year >= 2013) { return 'Gen Alpha'; }
    if (year >= 1997) { return 'Gen Z'; }
    if (year >= 1981) { return 'Millennial'; }
    if (year >= 1965) { return 'Gen X'; }
    if (year >= 1946) { return 'Baby Boomer'; }
    if (year >= 1928) { return 'Silent Generation'; }
    return 'Greatest Generation';
  }

  function getNextBirthday(birth) {
    var now = new Date();
    var thisYear = now.getFullYear();
    var next = new Date(thisYear, birth.getMonth(), birth.getDate());
    if (next <= now) {
      next = new Date(thisYear + 1, birth.getMonth(), birth.getDate());
    }
    var diff = totalDaysBetween(now, next);
    if (diff === 0) {
      return 'Today! Happy Birthday!';
    }
    return diff + ' day' + (diff === 1 ? '' : 's') + ' away (' + next.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' }) + ')';
  }

  function formatNumber(n) {
    return n.toLocaleString('en-US');
  }

  function showResults(birthDate) {
    var now = new Date();
    var age = calcAge(birthDate, now);

    // Exact age
    document.getElementById('ageSummary').textContent =
      age.years + ' years, ' + age.months + ' months, ' + age.days + ' days old';
    document.getElementById('ageYears').textContent = age.years;
    document.getElementById('ageMonths').textContent = age.months;
    document.getElementById('ageDays').textContent = age.days;
    document.getElementById('ageHours').textContent = age.hours;
    document.getElementById('ageMinutes').textContent = age.minutes;

    // Units
    var totalD = totalDaysBetween(birthDate, now);
    var totalW = Math.floor(totalD / 7);
    var totalH = totalD * 24 + age.hours;
    var totalM = totalH * 60 + age.minutes;

    document.getElementById('totalDays').textContent = formatNumber(totalD);
    document.getElementById('totalWeeks').textContent = formatNumber(totalW);
    document.getElementById('totalHours').textContent = formatNumber(totalH);
    document.getElementById('totalMinutes').textContent = formatNumber(totalM);

    // Live ticking seconds
    if (tickInterval) {
      clearInterval(tickInterval);
    }
    function updateSeconds() {
      var s = Math.floor((Date.now() - birthDate.getTime()) / 1000);
      document.getElementById('secondsAlive').textContent = formatNumber(s);
    }
    updateSeconds();
    tickInterval = setInterval(updateSeconds, 1000);

    // Fun facts
    document.getElementById('dayOfWeekBorn').textContent = dayNames[birthDate.getDay()];
    document.getElementById('nextBirthday').textContent = getNextBirthday(birthDate);
    document.getElementById('generation').textContent = getGeneration(birthDate.getFullYear());
    document.getElementById('zodiacSign').textContent = getZodiac(birthDate.getMonth() + 1, birthDate.getDate());

    // Planets
    var earthDays = totalD;
    var planetKeys = Object.keys(planets);
    for (var i = 0; i < planetKeys.length; i++) {
      var key = planetKeys[i];
      var planetAge = earthDays / planets[key];
      document.getElementById('age' + key).textContent = planetAge.toFixed(2) + ' yrs';
    }

    // Show sections
    exactSection.classList.remove('hidden');
    unitsSection.classList.remove('hidden');
    funFactsSection.classList.remove('hidden');
    planetSection.classList.remove('hidden');
  }

  function parseDateInput(input) {
    if (!input.value) {
      return null;
    }
    var parts = input.value.split('-');
    return new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
  }

  // Main calculate
  calcBtn.addEventListener('click', function () {
    var bd = parseDateInput(birthInput);
    if (!bd) {
      return;
    }
    showResults(bd);
  });

  // Age on specific date
  specificBtn.addEventListener('click', function () {
    var bd = parseDateInput(specificBirth);
    var td = parseDateInput(specificTarget);
    if (!bd || !td) {
      return;
    }
    var age = calcAge(bd, td);
    var label = td < bd ? 'Not yet born' : age.years + ' years, ' + age.months + ' months, ' + age.days + ' days';
    specificResult.textContent = label;
    specificResult.classList.remove('hidden');
  });

  // Age difference
  diffBtn.addEventListener('click', function () {
    var d1 = parseDateInput(person1);
    var d2 = parseDateInput(person2);
    if (!d1 || !d2) {
      return;
    }
    var older = d1 < d2 ? d1 : d2;
    var younger = d1 < d2 ? d2 : d1;
    var diff = calcAge(older, younger);
    var totalD = totalDaysBetween(older, younger);
    diffResult.textContent =
      diff.years + ' years, ' + diff.months + ' months, ' + diff.days + ' days apart (' + formatNumber(totalD) + ' days)';
    diffResult.classList.remove('hidden');
  });

  // Sync birthdate to specific-date section
  birthInput.addEventListener('change', function () {
    if (birthInput.value && !specificBirth.value) {
      specificBirth.value = birthInput.value;
    }
  });
})();
