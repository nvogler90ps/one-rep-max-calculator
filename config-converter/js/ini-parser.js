/**
 * Simple INI parser and serializer.
 * Handles: sections [name], key=value and key: value, comments (# and ;),
 * quoted values, boolean/number coercion.
 */
var INI = (function () {
  "use strict";

  function parse(text) {
    if (typeof text !== "string") {
      throw new Error("INI.parse expects a string");
    }
    var result = {};
    var currentSection = null;
    var lines = text.split("\n");

    for (var i = 0; i < lines.length; i++) {
      var line = lines[i].trim();

      // Skip empty lines and comments
      if (line === "" || line[0] === "#" || line[0] === ";") {
        continue;
      }

      // Section header
      if (line[0] === "[" && line[line.length - 1] === "]") {
        currentSection = line.substring(1, line.length - 1).trim();
        if (result[currentSection] === undefined) {
          result[currentSection] = {};
        }
        continue;
      }

      // Key = value or key : value
      var sepIdx = -1;
      for (var j = 0; j < line.length; j++) {
        if (line[j] === "=" || line[j] === ":") {
          sepIdx = j;
          break;
        }
      }

      if (sepIdx === -1) { continue; }

      var key = line.substring(0, sepIdx).trim();
      var val = line.substring(sepIdx + 1).trim();

      // Strip inline comments (only if preceded by whitespace)
      var commentIdx = findInlineComment(val);
      if (commentIdx !== -1) {
        val = val.substring(0, commentIdx).trim();
      }

      // Unquote
      if ((val[0] === '"' && val[val.length - 1] === '"') ||
          (val[0] === "'" && val[val.length - 1] === "'")) {
        val = val.substring(1, val.length - 1);
      } else {
        // Coerce types
        val = coerce(val);
      }

      if (currentSection !== null) {
        result[currentSection][key] = val;
      } else {
        result[key] = val;
      }
    }

    return result;
  }

  function findInlineComment(val) {
    var inQuote = false;
    var quoteChar = "";
    for (var i = 0; i < val.length; i++) {
      var ch = val[i];
      if (inQuote) {
        if (ch === quoteChar) { inQuote = false; }
      } else if (ch === '"' || ch === "'") {
        inQuote = true;
        quoteChar = ch;
      } else if ((ch === "#" || ch === ";") && i > 0 && (val[i - 1] === " " || val[i - 1] === "\t")) {
        return i;
      }
    }
    return -1;
  }

  function coerce(val) {
    if (val === "" || val === "null" || val === "Null" || val === "NULL") {
      return "";
    }
    if (val === "true" || val === "True" || val === "TRUE" || val === "yes" || val === "Yes" || val === "on" || val === "On") {
      return true;
    }
    if (val === "false" || val === "False" || val === "FALSE" || val === "no" || val === "No" || val === "off" || val === "Off") {
      return false;
    }
    if (/^-?\d+$/.test(val)) {
      return parseInt(val, 10);
    }
    if (/^-?\d+\.\d+$/.test(val)) {
      return parseFloat(val);
    }
    return val;
  }

  // ── serializer ──────────────────────────────────────────────────────
  function stringify(obj, options) {
    if (typeof obj !== "object" || obj === null || Array.isArray(obj)) {
      throw new Error("INI.stringify expects an object");
    }
    var lines = [];
    var keys = Object.keys(obj);

    // Top-level simple keys first
    for (var i = 0; i < keys.length; i++) {
      var val = obj[keys[i]];
      if (typeof val !== "object" || val === null) {
        lines.push(keys[i] + " = " + formatValue(val));
      }
    }

    // Sections
    for (var j = 0; j < keys.length; j++) {
      var sVal = obj[keys[j]];
      if (typeof sVal === "object" && sVal !== null && !Array.isArray(sVal)) {
        if (lines.length > 0) { lines.push(""); }
        lines.push("[" + keys[j] + "]");
        var sKeys = Object.keys(sVal);
        for (var k = 0; k < sKeys.length; k++) {
          var v = sVal[sKeys[k]];
          if (typeof v === "object" && v !== null) {
            // Flatten nested objects by converting to string
            lines.push(sKeys[k] + " = " + JSON.stringify(v));
          } else {
            lines.push(sKeys[k] + " = " + formatValue(v));
          }
        }
      }
    }

    return lines.join("\n") + "\n";
  }

  function formatValue(val) {
    if (val === null || val === undefined || val === "") { return ""; }
    if (typeof val === "boolean") { return val ? "true" : "false"; }
    if (typeof val === "number") { return String(val); }
    if (typeof val === "string") {
      // Quote if contains special chars
      if (val.indexOf("=") !== -1 || val.indexOf(":") !== -1 ||
          val.indexOf("#") !== -1 || val.indexOf(";") !== -1 ||
          val.indexOf("[") !== -1 || val.indexOf("]") !== -1 ||
          val[0] === " " || val[val.length - 1] === " " ||
          val.indexOf("\n") !== -1) {
        return '"' + val.replace(/\\/g, "\\\\").replace(/"/g, '\\"').replace(/\n/g, "\\n") + '"';
      }
      return val;
    }
    return String(val);
  }

  return { parse: parse, stringify: stringify };
})();
