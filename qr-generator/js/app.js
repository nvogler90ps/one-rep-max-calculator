(function () {
  'use strict';

  // --- State ---
  var currentTab = 'url';
  var qrSize = 300;
  var errorCorrection = 'M';
  var fgColor = '#e8eaed';
  var bgColor = '#1a1d27';

  // --- DOM refs ---
  var tabBtns = document.querySelectorAll('.tab-btn');
  var tabPanels = document.querySelectorAll('.tab-panel');
  var qrDisplayEl = document.getElementById('qr-display');
  var sizeSlider = document.getElementById('qr-size');
  var sizeValue = document.getElementById('qr-size-value');
  var ecSelect = document.getElementById('ec-level');
  var fgInput = document.getElementById('fg-color');
  var bgInput = document.getElementById('bg-color');
  var btnPng = document.getElementById('btn-png');
  var btnSvg = document.getElementById('btn-svg');
  var btnCopy = document.getElementById('btn-copy');
  var toastEl = document.getElementById('toast');

  // --- Tabs ---
  tabBtns.forEach(function (btn) {
    btn.addEventListener('click', function () {
      currentTab = btn.dataset.tab;
      tabBtns.forEach(function (b) { b.classList.remove('active'); });
      btn.classList.add('active');
      tabPanels.forEach(function (p) {
        p.classList.toggle('active', p.id === 'panel-' + currentTab);
      });
      generateQR();
    });
  });

  // --- Get data string for current tab ---
  function getDataString() {
    switch (currentTab) {
      case 'url':
        return document.getElementById('input-url').value.trim();

      case 'wifi': {
        var ssid = document.getElementById('wifi-ssid').value;
        var pass = document.getElementById('wifi-pass').value;
        var enc = document.getElementById('wifi-enc').value;
        var hidden = document.getElementById('wifi-hidden').checked;
        if (!ssid) { return ''; }
        var parts = 'WIFI:T:' + enc + ';S:' + escapeWifi(ssid) + ';';
        if (enc !== 'nopass') {
          parts += 'P:' + escapeWifi(pass) + ';';
        }
        parts += 'H:' + hidden + ';;';
        return parts;
      }

      case 'vcard': {
        var name = document.getElementById('vcard-name').value.trim();
        if (!name) { return ''; }
        var phone = document.getElementById('vcard-phone').value.trim();
        var email = document.getElementById('vcard-email').value.trim();
        var company = document.getElementById('vcard-company').value.trim();
        var website = document.getElementById('vcard-website').value.trim();
        var address = document.getElementById('vcard-address').value.trim();
        var lines = ['BEGIN:VCARD', 'VERSION:3.0', 'FN:' + name];
        if (company) { lines.push('ORG:' + company); }
        if (phone) { lines.push('TEL:' + phone); }
        if (email) { lines.push('EMAIL:' + email); }
        if (website) { lines.push('URL:' + website); }
        if (address) { lines.push('ADR:;;' + address + ';;;;'); }
        lines.push('END:VCARD');
        return lines.join('\n');
      }

      case 'email': {
        var to = document.getElementById('email-to').value.trim();
        if (!to) { return ''; }
        var subject = document.getElementById('email-subject').value.trim();
        var body = document.getElementById('email-body').value.trim();
        var mailto = 'mailto:' + to;
        var params = [];
        if (subject) { params.push('subject=' + encodeURIComponent(subject)); }
        if (body) { params.push('body=' + encodeURIComponent(body)); }
        if (params.length > 0) { mailto += '?' + params.join('&'); }
        return mailto;
      }

      case 'sms': {
        var number = document.getElementById('sms-number').value.trim();
        if (!number) { return ''; }
        var msg = document.getElementById('sms-message').value.trim();
        var smsStr = 'sms:' + number;
        if (msg) { smsStr += '?body=' + encodeURIComponent(msg); }
        return smsStr;
      }

      case 'text':
        return document.getElementById('input-text').value;

      default:
        return '';
    }
  }

  function escapeWifi(str) {
    return str.replace(/([\\;,:"])/g, '\\$1');
  }

  // --- QR generation ---
  function generateQR() {
    var data = getDataString();
    if (!data) {
      qrDisplayEl.innerHTML = '<div class="qr-placeholder">Enter content to generate a QR code</div>';
      return;
    }

    var ecMap = { L: 1, M: 0, Q: 3, H: 2 };
    var ecLevel = ecMap[errorCorrection];

    // Auto-detect type number
    var typeNumber = 0;
    var qr;
    try {
      qr = qrcode(typeNumber, ecLevel);
      qr.addData(data);
      qr.make();
    } catch (e) {
      qrDisplayEl.innerHTML = '<div class="qr-placeholder">Content too long for QR code. Try reducing text or lowering error correction.</div>';
      return;
    }

    var moduleCount = qr.getModuleCount();
    var cellSize = Math.floor(qrSize / moduleCount);
    var actualSize = cellSize * moduleCount;

    // Build SVG
    var svgParts = [];
    svgParts.push('<svg xmlns="http://www.w3.org/2000/svg" width="' + actualSize + '" height="' + actualSize + '" viewBox="0 0 ' + moduleCount + ' ' + moduleCount + '">');
    svgParts.push('<rect width="' + moduleCount + '" height="' + moduleCount + '" fill="' + bgColor + '"/>');
    for (var row = 0; row < moduleCount; row++) {
      for (var col = 0; col < moduleCount; col++) {
        if (qr.isDark(row, col)) {
          svgParts.push('<rect x="' + col + '" y="' + row + '" width="1" height="1" fill="' + fgColor + '"/>');
        }
      }
    }
    svgParts.push('</svg>');
    var svgString = svgParts.join('');

    qrDisplayEl.innerHTML = svgString;
    qrDisplayEl.style.background = bgColor;
    qrDisplayEl.querySelector('svg').style.width = qrSize + 'px';
    qrDisplayEl.querySelector('svg').style.height = qrSize + 'px';
  }

  // --- Controls ---
  sizeSlider.addEventListener('input', function () {
    qrSize = parseInt(sizeSlider.value, 10);
    sizeValue.textContent = qrSize + 'px';
    generateQR();
  });

  ecSelect.addEventListener('change', function () {
    errorCorrection = ecSelect.value;
    generateQR();
  });

  fgInput.addEventListener('input', function () {
    fgColor = fgInput.value;
    generateQR();
  });

  bgInput.addEventListener('input', function () {
    bgColor = bgInput.value;
    generateQR();
  });

  // --- Live input listeners ---
  document.querySelectorAll('.tab-panel input, .tab-panel textarea, .tab-panel select').forEach(function (el) {
    el.addEventListener('input', generateQR);
    el.addEventListener('change', generateQR);
  });

  // --- Password toggle ---
  var passToggle = document.getElementById('wifi-pass-toggle');
  var passInput = document.getElementById('wifi-pass');
  if (passToggle && passInput) {
    passToggle.addEventListener('click', function () {
      if (passInput.type === 'password') {
        passInput.type = 'text';
        passToggle.textContent = 'Hide';
      } else {
        passInput.type = 'password';
        passToggle.textContent = 'Show';
      }
    });
  }

  // --- Download PNG ---
  btnPng.addEventListener('click', function () {
    var data = getDataString();
    if (!data) { return; }

    var svg = qrDisplayEl.querySelector('svg');
    if (!svg) { return; }

    var svgData = new XMLSerializer().serializeToString(svg);
    var svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
    var url = URL.createObjectURL(svgBlob);

    var img = new Image();
    img.onload = function () {
      var canvas = document.createElement('canvas');
      canvas.width = qrSize;
      canvas.height = qrSize;
      var ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0, qrSize, qrSize);
      URL.revokeObjectURL(url);

      var link = document.createElement('a');
      link.download = 'qr-code.png';
      link.href = canvas.toDataURL('image/png');
      link.click();
    };
    img.src = url;
  });

  // --- Download SVG ---
  btnSvg.addEventListener('click', function () {
    var svg = qrDisplayEl.querySelector('svg');
    if (!svg) { return; }

    var svgData = new XMLSerializer().serializeToString(svg);
    var blob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
    var link = document.createElement('a');
    link.download = 'qr-code.svg';
    link.href = URL.createObjectURL(blob);
    link.click();
    URL.revokeObjectURL(link.href);
  });

  // --- Copy to clipboard ---
  btnCopy.addEventListener('click', function () {
    var svg = qrDisplayEl.querySelector('svg');
    if (!svg) { return; }

    var svgData = new XMLSerializer().serializeToString(svg);
    var svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
    var url = URL.createObjectURL(svgBlob);

    var img = new Image();
    img.onload = function () {
      var canvas = document.createElement('canvas');
      canvas.width = qrSize;
      canvas.height = qrSize;
      var ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0, qrSize, qrSize);
      URL.revokeObjectURL(url);

      canvas.toBlob(function (blob) {
        if (!blob) { return; }
        var item = new ClipboardItem({ 'image/png': blob });
        navigator.clipboard.write([item]).then(function () {
          showToast('QR code copied to clipboard');
        }).catch(function () {
          showToast('Failed to copy -- try downloading instead');
        });
      }, 'image/png');
    };
    img.src = url;
  });

  // --- Toast ---
  function showToast(msg) {
    toastEl.textContent = msg;
    toastEl.classList.add('show');
    setTimeout(function () {
      toastEl.classList.remove('show');
    }, 2000);
  }

  // --- Init ---
  generateQR();
})();
