(function () {
  'use strict';

  // Tab switching
  var tabs = document.querySelectorAll('.tab');
  var panels = document.querySelectorAll('.calc-panel');

  tabs.forEach(function (tab) {
    tab.addEventListener('click', function () {
      var target = tab.getAttribute('data-tab');

      tabs.forEach(function (t) {
        t.classList.remove('active');
        t.setAttribute('aria-selected', 'false');
      });
      tab.classList.add('active');
      tab.setAttribute('aria-selected', 'true');

      panels.forEach(function (p) {
        p.classList.remove('active');
      });
      document.getElementById('panel-' + target).classList.add('active');
    });
  });

  // Utility: format number to reasonable precision
  function fmt(n) {
    if (n === undefined || n === null || isNaN(n) || !isFinite(n)) {
      return '--';
    }
    // Round to 6 decimal places, then strip trailing zeros
    var rounded = parseFloat(n.toFixed(6));
    return rounded.toLocaleString('en-US', { maximumFractionDigits: 6 });
  }

  function val(id) {
    var el = document.getElementById(id);
    if (el.value === '') {
      return NaN;
    }
    return parseFloat(el.value);
  }

  function setResult(id, value) {
    var box = document.getElementById(id);
    box.querySelector('.result-value').textContent = value;
  }

  function setFormula(id, text) {
    document.getElementById(id).textContent = text;
  }

  // 1. What is X% of Y?
  function calcPctOf() {
    var pct = val('pctof-pct');
    var num = val('pctof-num');
    if (isNaN(pct) || isNaN(num)) {
      setResult('pctof-result', '--');
      setFormula('pctof-formula', '');
      return;
    }
    var result = (pct / 100) * num;
    setResult('pctof-result', fmt(result));
    setFormula('pctof-formula', '(' + pct + ' / 100) x ' + num + ' = ' + fmt(result));
  }

  document.getElementById('pctof-pct').addEventListener('input', calcPctOf);
  document.getElementById('pctof-num').addEventListener('input', calcPctOf);

  // 2. X is what % of Y?
  function calcWhatPct() {
    var part = val('whatpct-part');
    var whole = val('whatpct-whole');
    if (isNaN(part) || isNaN(whole) || whole === 0) {
      setResult('whatpct-result', '--');
      setFormula('whatpct-formula', '');
      return;
    }
    var result = (part / whole) * 100;
    setResult('whatpct-result', fmt(result) + '%');
    setFormula('whatpct-formula', '(' + part + ' / ' + whole + ') x 100 = ' + fmt(result) + '%');
  }

  document.getElementById('whatpct-part').addEventListener('input', calcWhatPct);
  document.getElementById('whatpct-whole').addEventListener('input', calcWhatPct);

  // 3. Percentage change
  function calcPctChange() {
    var oldVal = val('pctchg-old');
    var newVal = val('pctchg-new');
    if (isNaN(oldVal) || isNaN(newVal) || oldVal === 0) {
      setResult('pctchg-result', '--');
      setFormula('pctchg-formula', '');
      return;
    }
    var change = ((newVal - oldVal) / Math.abs(oldVal)) * 100;
    var label = change >= 0 ? 'increase' : 'decrease';
    setResult('pctchg-result', fmt(change) + '% ' + label);
    setFormula('pctchg-formula',
      '((' + newVal + ' - ' + oldVal + ') / |' + oldVal + '|) x 100 = ' + fmt(change) + '%');
  }

  document.getElementById('pctchg-old').addEventListener('input', calcPctChange);
  document.getElementById('pctchg-new').addEventListener('input', calcPctChange);

  // 4. Percentage difference
  function calcPctDiff() {
    var a = val('pctdiff-a');
    var b = val('pctdiff-b');
    if (isNaN(a) || isNaN(b)) {
      setResult('pctdiff-result', '--');
      setFormula('pctdiff-formula', '');
      return;
    }
    var avg = (a + b) / 2;
    if (avg === 0) {
      setResult('pctdiff-result', '0%');
      setFormula('pctdiff-formula', 'Both values are 0, so the difference is 0%');
      return;
    }
    var diff = (Math.abs(a - b) / Math.abs(avg)) * 100;
    setResult('pctdiff-result', fmt(diff) + '%');
    setFormula('pctdiff-formula',
      '(|' + a + ' - ' + b + '| / |(' + a + ' + ' + b + ') / 2|) x 100 = ' + fmt(diff) + '%');
  }

  document.getElementById('pctdiff-a').addEventListener('input', calcPctDiff);
  document.getElementById('pctdiff-b').addEventListener('input', calcPctDiff);

  // 5. Add/subtract percentage
  function calcAddSub() {
    var num = val('addsub-num');
    var pct = val('addsub-pct');
    var op = document.getElementById('addsub-op').value;
    if (isNaN(num) || isNaN(pct)) {
      setResult('addsub-result', '--');
      setFormula('addsub-formula', '');
      return;
    }
    var amount = (pct / 100) * num;
    var result;
    var symbol;
    if (op === 'add') {
      result = num + amount;
      symbol = '+';
    } else {
      result = num - amount;
      symbol = '-';
    }
    setResult('addsub-result', fmt(result));
    setFormula('addsub-formula',
      num + ' ' + symbol + ' (' + pct + '% of ' + num + ') = ' + num + ' ' + symbol + ' ' + fmt(amount) + ' = ' + fmt(result));
  }

  document.getElementById('addsub-num').addEventListener('input', calcAddSub);
  document.getElementById('addsub-pct').addEventListener('input', calcAddSub);
  document.getElementById('addsub-op').addEventListener('change', calcAddSub);

  // 6. Fraction to percentage
  function calcFracPct() {
    var num = val('fracpct-num');
    var den = val('fracpct-den');
    if (isNaN(num) || isNaN(den) || den === 0) {
      setResult('fracpct-result', '--');
      setFormula('fracpct-formula', '');
      return;
    }
    var result = (num / den) * 100;
    setResult('fracpct-result', fmt(result) + '%');
    setFormula('fracpct-formula',
      '(' + num + ' / ' + den + ') x 100 = ' + fmt(result) + '%');
  }

  document.getElementById('fracpct-num').addEventListener('input', calcFracPct);
  document.getElementById('fracpct-den').addEventListener('input', calcFracPct);
})();
