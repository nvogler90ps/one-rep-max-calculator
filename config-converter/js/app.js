/**
 * Config Converter - Main Application
 */
(function () {
  "use strict";

  // ── Sample Data ─────────────────────────────────────────────────────
  var samples = {
    json: '{\n  "server": {\n    "host": "localhost",\n    "port": 8080,\n    "debug": true\n  },\n  "database": {\n    "driver": "postgresql",\n    "host": "db.example.com",\n    "port": 5432,\n    "name": "myapp",\n    "credentials": {\n      "username": "admin",\n      "password": "secret123"\n    }\n  },\n  "logging": {\n    "level": "info",\n    "outputs": ["stdout", "file"],\n    "file_path": "/var/log/app.log"\n  },\n  "features": {\n    "enable_cache": true,\n    "cache_ttl": 3600,\n    "rate_limit": 100\n  }\n}',

    yaml: 'server:\n  host: localhost\n  port: 8080\n  debug: true\n\ndatabase:\n  driver: postgresql\n  host: db.example.com\n  port: 5432\n  name: myapp\n  credentials:\n    username: admin\n    password: secret123\n\nlogging:\n  level: info\n  outputs:\n    - stdout\n    - file\n  file_path: /var/log/app.log\n\nfeatures:\n  enable_cache: true\n  cache_ttl: 3600\n  rate_limit: 100',

    toml: '[server]\nhost = "localhost"\nport = 8080\ndebug = true\n\n[database]\ndriver = "postgresql"\nhost = "db.example.com"\nport = 5432\nname = "myapp"\n\n[database.credentials]\nusername = "admin"\npassword = "secret123"\n\n[logging]\nlevel = "info"\noutputs = ["stdout", "file"]\nfile_path = "/var/log/app.log"\n\n[features]\nenable_cache = true\ncache_ttl = 3600\nrate_limit = 100',

    ini: '[server]\nhost = localhost\nport = 8080\ndebug = true\n\n[database]\ndriver = postgresql\nhost = db.example.com\nport = 5432\nname = myapp\nusername = admin\npassword = secret123\n\n[logging]\nlevel = info\nfile_path = /var/log/app.log\n\n[features]\nenable_cache = true\ncache_ttl = 3600\nrate_limit = 100'
  };

  // ── DOM refs ────────────────────────────────────────────────────────
  var inputArea = document.getElementById("input-area");
  var outputArea = document.getElementById("output-area");
  var outputHighlighted = document.getElementById("output-highlighted");
  var detectedBadge = document.getElementById("detected-format");
  var targetSelect = document.getElementById("target-format");
  var convertBtn = document.getElementById("convert-btn");
  var copyBtn = document.getElementById("copy-btn");
  var downloadBtn = document.getElementById("download-btn");
  var clearBtn = document.getElementById("clear-btn");
  var errorBox = document.getElementById("error-box");
  var errorText = document.getElementById("error-text");
  var sampleButtons = document.querySelectorAll(".sample-btn");

  var currentDetected = null;
  var currentOutput = "";

  // ── Format Detection ────────────────────────────────────────────────
  function detectFormat(text) {
    text = text.trim();
    if (text === "") { return null; }

    // JSON: starts with { or [
    if ((text[0] === "{" || text[0] === "[")) {
      try {
        JSON.parse(text);
        return "json";
      } catch (e) {
        // might still be JSON with errors, but try others
      }
    }

    // TOML: look for [section] headers and key = value patterns
    // Must distinguish from INI which also has [sections]
    var lines = text.split("\n");
    var hasTomlFeatures = false;
    var hasIniFeatures = false;

    for (var i = 0; i < lines.length; i++) {
      var line = lines[i].trim();
      if (line === "" || line[0] === "#") { continue; }

      // TOML array of tables
      if (/^\[\[.+\]\]/.test(line)) { hasTomlFeatures = true; }

      // TOML: values with types (quoted strings with =, arrays, inline tables)
      if (/^[^=]+=\s*\[/.test(line)) { hasTomlFeatures = true; }
      if (/^[^=]+=\s*\{/.test(line)) { hasTomlFeatures = true; }
      if (/^[^=]+=\s*"/.test(line)) { hasTomlFeatures = true; }
      if (/^[^=]+=\s*(true|false)\s*$/.test(line)) { hasTomlFeatures = true; }
      if (/^[^=]+=\s*\d+\.\d+\s*$/.test(line)) { hasTomlFeatures = true; }

      // INI: comments with ;
      if (line[0] === ";") { hasIniFeatures = true; }
      // INI: key : value syntax
      if (/^[^:=]+:[^:]/.test(line) && !/^\[\[/.test(line) && line[0] !== "[") { hasIniFeatures = true; }
    }

    // YAML detection: look for key: value patterns (colon+space), - list items
    var yamlScore = 0;
    var tomlScore = hasTomlFeatures ? 2 : 0;
    var iniScore = hasIniFeatures ? 1 : 0;

    for (var j = 0; j < lines.length; j++) {
      var ln = lines[j].trim();
      if (ln === "" || ln[0] === "#") { continue; }

      // YAML-style key: value (colon followed by space, no = sign)
      if (/^[a-zA-Z_][a-zA-Z0-9_]*:\s/.test(ln) && ln.indexOf("=") === -1) {
        yamlScore++;
      }
      // YAML list items
      if (/^- /.test(ln)) { yamlScore++; }
      // Indented lines (YAML uses indentation)
      if (lines[j].length > 0 && lines[j][0] === " " && /^\s+[a-zA-Z]/.test(lines[j])) {
        yamlScore++;
      }

      // TOML/INI: [section] with key = value
      if (/^\[.+\]$/.test(ln) && !/^\[\[/.test(ln)) {
        tomlScore++;
        iniScore++;
      }
      if (/^[^=]+=/.test(ln)) {
        tomlScore++;
        iniScore++;
      }
    }

    if (yamlScore > tomlScore && yamlScore > iniScore) { return "yaml"; }
    if (tomlScore > iniScore) { return "toml"; }
    if (iniScore > 0) { return "ini"; }
    if (yamlScore > 0) { return "yaml"; }

    // Fallback: try parsing
    try { JSON.parse(text); return "json"; } catch (e) {}
    try { TOML.parse(text); return "toml"; } catch (e) {}
    try { YAML.parse(text); return "yaml"; } catch (e) {}
    try { INI.parse(text); return "ini"; } catch (e) {}

    return null;
  }

  // ── Parsing ─────────────────────────────────────────────────────────
  function parseInput(text, format) {
    switch (format) {
      case "json": return JSON.parse(text);
      case "yaml": return YAML.parse(text);
      case "toml": return TOML.parse(text);
      case "ini":  return INI.parse(text);
      default: throw new Error("Unknown format: " + format);
    }
  }

  // ── Serializing ─────────────────────────────────────────────────────
  function serializeOutput(data, format) {
    switch (format) {
      case "json": return JSON.stringify(data, null, 2);
      case "yaml": return YAML.stringify(data);
      case "toml": return TOML.stringify(flattenForToml(data));
      case "ini":  return INI.stringify(flattenForIni(data));
      default: throw new Error("Unknown format: " + format);
    }
  }

  // INI only supports one level of nesting. Flatten deeper structures.
  function flattenForIni(data) {
    if (typeof data !== "object" || data === null || Array.isArray(data)) {
      return data;
    }
    var result = {};
    var keys = Object.keys(data);
    for (var i = 0; i < keys.length; i++) {
      var val = data[keys[i]];
      if (typeof val === "object" && val !== null && !Array.isArray(val)) {
        result[keys[i]] = {};
        flattenIniSection(val, result[keys[i]]);
      } else if (Array.isArray(val)) {
        result[keys[i]] = val.join(", ");
      } else {
        result[keys[i]] = val;
      }
    }
    return result;
  }

  function flattenIniSection(obj, target) {
    var keys = Object.keys(obj);
    for (var i = 0; i < keys.length; i++) {
      var val = obj[keys[i]];
      if (typeof val === "object" && val !== null && !Array.isArray(val)) {
        // Flatten nested objects with dot notation
        var subKeys = Object.keys(val);
        for (var j = 0; j < subKeys.length; j++) {
          target[keys[i] + "." + subKeys[j]] = typeof val[subKeys[j]] === "object" ?
            JSON.stringify(val[subKeys[j]]) : val[subKeys[j]];
        }
      } else if (Array.isArray(val)) {
        target[keys[i]] = val.join(", ");
      } else {
        target[keys[i]] = val;
      }
    }
  }

  function flattenForToml(data) {
    // TOML handles nested objects well, but arrays of non-objects need care
    return data;
  }

  // ── Syntax Highlighting ─────────────────────────────────────────────
  function highlight(text, format) {
    var escaped = escapeHtml(text);
    switch (format) {
      case "json": return highlightJson(escaped);
      case "yaml": return highlightYaml(escaped);
      case "toml": return highlightToml(escaped);
      case "ini":  return highlightIni(escaped);
      default: return escaped;
    }
  }

  function escapeHtml(str) {
    return str.replace(/&/g, "&amp;")
              .replace(/</g, "&lt;")
              .replace(/>/g, "&gt;");
  }

  function highlightJson(text) {
    // Keys
    text = text.replace(/(&quot;|")([^"\\]*(?:\\.[^"\\]*)*)(&quot;|")\s*:/g,
      '<span class="hl-key">"$2"</span>:');
    // String values
    text = text.replace(/:\s*(&quot;|")([^"\\]*(?:\\.[^"\\]*)*)(&quot;|")/g,
      ': <span class="hl-string">"$2"</span>');
    // Standalone strings in arrays
    text = text.replace(/(\[|,)\s*(&quot;|")([^"\\]*(?:\\.[^"\\]*)*)(&quot;|")/g,
      '$1 <span class="hl-string">"$3"</span>');
    // Numbers
    text = text.replace(/(:\s*)(-?\d+\.?\d*([eE][+-]?\d+)?)/g,
      '$1<span class="hl-number">$2</span>');
    // Booleans & null
    text = text.replace(/(:\s*)(true|false|null)/g,
      '$1<span class="hl-keyword">$2</span>');
    // Braces/brackets
    text = text.replace(/([{}\[\]])/g, '<span class="hl-bracket">$1</span>');
    return text;
  }

  function highlightYaml(text) {
    var lines = text.split("\n");
    for (var i = 0; i < lines.length; i++) {
      var line = lines[i];
      // Comments
      if (/^\s*#/.test(line)) {
        lines[i] = '<span class="hl-comment">' + line + '</span>';
        continue;
      }
      // Key: value
      var match = line.match(/^(\s*)([^:\s][^:]*?)(:)(\s+)(.*)/);
      if (match) {
        var val = highlightYamlValue(match[5]);
        lines[i] = match[1] + '<span class="hl-key">' + match[2] + '</span>' +
                    '<span class="hl-bracket">:</span>' + match[4] + val;
        continue;
      }
      // Key: (no value)
      var keyOnly = line.match(/^(\s*)([^:\s][^:]*?)(:)\s*$/);
      if (keyOnly) {
        lines[i] = keyOnly[1] + '<span class="hl-key">' + keyOnly[2] + '</span>' +
                    '<span class="hl-bracket">:</span>';
        continue;
      }
      // List items
      var listMatch = line.match(/^(\s*)(- )(.*)/);
      if (listMatch) {
        lines[i] = listMatch[1] + '<span class="hl-bracket">-</span> ' +
                    highlightYamlValue(listMatch[3]);
        continue;
      }
    }
    return lines.join("\n");
  }

  function highlightYamlValue(val) {
    if (/^(true|false|null|~)$/i.test(val)) {
      return '<span class="hl-keyword">' + val + '</span>';
    }
    if (/^-?\d+\.?\d*([eE][+-]?\d+)?$/.test(val)) {
      return '<span class="hl-number">' + val + '</span>';
    }
    if (/^["']/.test(val)) {
      return '<span class="hl-string">' + val + '</span>';
    }
    if (/^\[/.test(val) || /^\{/.test(val)) {
      return '<span class="hl-bracket">' + val + '</span>';
    }
    return '<span class="hl-string">' + val + '</span>';
  }

  function highlightToml(text) {
    var lines = text.split("\n");
    for (var i = 0; i < lines.length; i++) {
      var line = lines[i];
      // Comments
      if (/^\s*#/.test(line)) {
        lines[i] = '<span class="hl-comment">' + line + '</span>';
        continue;
      }
      // Array of tables
      if (/^\[\[.+\]\]/.test(line)) {
        lines[i] = '<span class="hl-section">' + line + '</span>';
        continue;
      }
      // Tables
      if (/^\[.+\]/.test(line)) {
        lines[i] = '<span class="hl-section">' + line + '</span>';
        continue;
      }
      // Key = value
      var kvMatch = line.match(/^(\s*)([^=]+?)\s*(=)\s*(.*)/);
      if (kvMatch) {
        lines[i] = kvMatch[1] + '<span class="hl-key">' + kvMatch[2] + '</span>' +
                    ' <span class="hl-bracket">=</span> ' + highlightTomlValue(kvMatch[4]);
      }
    }
    return lines.join("\n");
  }

  function highlightTomlValue(val) {
    if (/^(true|false)$/.test(val)) {
      return '<span class="hl-keyword">' + val + '</span>';
    }
    if (/^-?\d/.test(val)) {
      return '<span class="hl-number">' + val + '</span>';
    }
    if (/^"/.test(val) || /^'/.test(val)) {
      return '<span class="hl-string">' + val + '</span>';
    }
    if (/^\[/.test(val)) {
      return '<span class="hl-bracket">' + val + '</span>';
    }
    return val;
  }

  function highlightIni(text) {
    var lines = text.split("\n");
    for (var i = 0; i < lines.length; i++) {
      var line = lines[i];
      // Comments
      if (/^\s*[#;]/.test(line)) {
        lines[i] = '<span class="hl-comment">' + line + '</span>';
        continue;
      }
      // Sections
      if (/^\[.+\]/.test(line)) {
        lines[i] = '<span class="hl-section">' + line + '</span>';
        continue;
      }
      // Key = value
      var kvMatch = line.match(/^(\s*)([^=]+?)\s*(=)\s*(.*)/);
      if (kvMatch) {
        lines[i] = kvMatch[1] + '<span class="hl-key">' + kvMatch[2] + '</span>' +
                    ' <span class="hl-bracket">=</span> ' + highlightIniValue(kvMatch[4]);
      }
    }
    return lines.join("\n");
  }

  function highlightIniValue(val) {
    if (/^(true|false|yes|no|on|off)$/i.test(val)) {
      return '<span class="hl-keyword">' + val + '</span>';
    }
    if (/^-?\d+\.?\d*$/.test(val)) {
      return '<span class="hl-number">' + val + '</span>';
    }
    return '<span class="hl-string">' + val + '</span>';
  }

  // ── File Extensions ─────────────────────────────────────────────────
  var extensions = {
    json: ".json",
    yaml: ".yaml",
    toml: ".toml",
    ini: ".ini"
  };

  // ── Event Handlers ──────────────────────────────────────────────────
  function onInputChange() {
    var text = inputArea.value;
    var format = detectFormat(text);
    currentDetected = format;

    if (format) {
      detectedBadge.textContent = format.toUpperCase();
      detectedBadge.className = "badge badge-" + format;

      // Auto-select a different target format
      if (targetSelect.value === format || targetSelect.value === "") {
        var formats = ["json", "yaml", "toml", "ini"];
        for (var i = 0; i < formats.length; i++) {
          if (formats[i] !== format) {
            targetSelect.value = formats[i];
            break;
          }
        }
      }
    } else {
      detectedBadge.textContent = "Paste config to detect";
      detectedBadge.className = "badge";
    }
    hideError();
  }

  function onConvert() {
    var text = inputArea.value.trim();
    if (text === "") {
      showError("Please paste some configuration text in the input area.");
      return;
    }

    if (!currentDetected) {
      showError("Could not detect the input format. Please check your configuration text.");
      return;
    }

    var target = targetSelect.value;
    if (!target) {
      showError("Please select a target format.");
      return;
    }

    if (target === currentDetected) {
      showError("Source and target formats are the same. Select a different target format.");
      return;
    }

    try {
      var data = parseInput(text, currentDetected);
      currentOutput = serializeOutput(data, target);
      outputArea.style.display = "none";
      outputHighlighted.style.display = "block";
      outputHighlighted.innerHTML = highlight(currentOutput, target);
      copyBtn.disabled = false;
      downloadBtn.disabled = false;
      hideError();
    } catch (e) {
      showError("Error parsing " + currentDetected.toUpperCase() + ": " + e.message);
      currentOutput = "";
      outputHighlighted.innerHTML = "";
      outputHighlighted.style.display = "none";
      outputArea.style.display = "block";
      outputArea.value = "";
      copyBtn.disabled = true;
      downloadBtn.disabled = true;
    }
  }

  function onCopy() {
    if (!currentOutput) { return; }
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(currentOutput).then(function () {
        showCopyFeedback();
      });
    } else {
      // Fallback
      var ta = document.createElement("textarea");
      ta.value = currentOutput;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
      showCopyFeedback();
    }
  }

  function showCopyFeedback() {
    var original = copyBtn.textContent;
    copyBtn.textContent = "Copied!";
    copyBtn.classList.add("success");
    setTimeout(function () {
      copyBtn.textContent = original;
      copyBtn.classList.remove("success");
    }, 2000);
  }

  function onDownload() {
    if (!currentOutput) { return; }
    var target = targetSelect.value;
    var ext = extensions[target] || ".txt";
    var blob = new Blob([currentOutput], { type: "text/plain" });
    var url = URL.createObjectURL(blob);
    var a = document.createElement("a");
    a.href = url;
    a.download = "config" + ext;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  function onClear() {
    inputArea.value = "";
    outputArea.value = "";
    outputArea.style.display = "block";
    outputHighlighted.style.display = "none";
    outputHighlighted.innerHTML = "";
    currentDetected = null;
    currentOutput = "";
    detectedBadge.textContent = "Paste config to detect";
    detectedBadge.className = "badge";
    copyBtn.disabled = true;
    downloadBtn.disabled = true;
    hideError();
  }

  function onLoadSample(format) {
    inputArea.value = samples[format];
    onInputChange();
    // Auto-convert
    setTimeout(onConvert, 50);
  }

  function showError(msg) {
    errorText.textContent = msg;
    errorBox.style.display = "flex";
  }

  function hideError() {
    errorBox.style.display = "none";
  }

  // ── Bind Events ─────────────────────────────────────────────────────
  inputArea.addEventListener("input", onInputChange);
  convertBtn.addEventListener("click", onConvert);
  copyBtn.addEventListener("click", onCopy);
  downloadBtn.addEventListener("click", onDownload);
  clearBtn.addEventListener("click", onClear);

  for (var i = 0; i < sampleButtons.length; i++) {
    (function (btn) {
      btn.addEventListener("click", function () {
        var format = btn.getAttribute("data-format");
        onLoadSample(format);
      });
    })(sampleButtons[i]);
  }

  // Keyboard shortcut: Ctrl/Cmd+Enter to convert
  document.addEventListener("keydown", function (e) {
    if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
      e.preventDefault();
      onConvert();
    }
  });
})();
